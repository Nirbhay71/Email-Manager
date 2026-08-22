---
okf_version: "1.0"
title: "AI Search & Q&A Data Flow"
description: "Step-by-step flow from frontend question to streamed Gemini answer"
---

# AI Search & Q&A Data Flow

## End-to-End Ask Flow

```
frontend/src/pages/AIChatPage.tsx
  User types question → submit
  
  fetch('http://localhost:5000/ask', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: "...", sessionId: "..." })
  })

  ↓ passes cookie accessToken ↓

backend/src/routes/ask.routes.js  POST /ask
  requireAuth middleware → jwt.verify → req.user.email

  → res.setHeader('Content-Type', 'text/event-stream')
  → keepalive interval: write ': keepalive\n\n' every 1s

  hybridSearchClient.AskQuestion({
    user_email: req.user.email,   // from JWT, cannot be spoofed
    question: "...",
    top_k: 5
  })

  ↓ gRPC server-streaming ↓

python-service/server.py  AskQuestion()

  Step A: Embed question
    services/embedder.py → embed(question)
    → SentenceTransformer(Alibaba-NLP/gte-Qwen2-1.5B-instruct, device=cuda|cpu)
    → .encode(question, convert_to_numpy=True).tolist()
    ← query_vector: list[float]

  Step B: Dense vector search
    services/vector_store.py → query_vector_store(query_vector, user_email, top_k*2)
    → ChromaDB collection.query(
         query_embeddings=[query_vector],
         n_results=top_k*2,
         where={"user_email": user_email}   // tenant isolation
       )
    ← list[{ message_id, score, subject }]

  Step C: Sparse keyword search
    services/keyword_store.py → search_keyword_store(question, user_email, top_k*2)
    → MongoDB emails collection:
       find({ userEmail: user_email, $text: { $search: question } })
       .sort(textScore).limit(top_k*2)
    ← list[{ message_id, score, subject }]

  Step D: RRF fusion
    services/hybrid_search.py → reciprocal_rank_fusion(vector_res, keyword_res)
    → RRF score = sum(1 / (60 + rank + 1))
    ← sorted[(message_id, rrf_score)]

  Step E: Fetch full email bodies
    keyword_store.emails_collection.find_one({
      messageId: msg_id,
      userEmail: user_email
    })
    ← list[{ subject, from, body, ... }]  (top_k documents)

  Step F: Stream Gemini answer
    services/gemini_service.py → stream_answer(question, context_emails)
    → Constructs prompt with email excerpts
    → google.genai.Client.models.generate_content_stream(
         model="gemini-2.5-flash",
         contents=prompt
       )
    → yields chunk.text

  Each chunk → gRPC yield AskResponseChunk { text_delta, is_final: false, sources: [] }
  Final      → gRPC yield AskResponseChunk { text_delta: "", is_final: true, sources: [...] }

  ↓ back in Node.js ask.routes.js ↓

  for await (const chunk of call) {
    fullAiResponse += chunk.text_delta
    res.write(`data: ${JSON.stringify(chunk)}\n\n`)
  }

  After stream ends:
  ChatSession.findOneAndUpdate(
    { _id: sessionId, userEmail },  // scoped to authenticated user
    { $push: { messages: [user_msg, ai_msg_with_sources] } }
  )

  res.end()

  ↓ frontend receives SSE events ↓

AIChatPage.tsx:
  → Accumulates text_delta in state
  → Renders streaming text in real-time
  → On is_final=true: displays source email references
```

## Keepalive Pattern

Node.js sends `: keepalive\n\n` every 1000ms while Python service is processing. This prevents Postman, browsers, and reverse proxies from closing the connection during the ~2-3s Gemini startup latency.

## Tenant Isolation

- ChromaDB queries include `where={"user_email": target_user}` — hardcoded from JWT, not client payload
- MongoDB queries include `userEmail: user_email` — same source
- Session persistence uses `{ _id: sessionId, userEmail }` — prevents cross-user injection
