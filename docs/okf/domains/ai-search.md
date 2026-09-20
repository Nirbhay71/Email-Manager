---
okf_version: "1.0"
title: "AI Search & Q&A Domain"
description: "Hybrid search and AI question-answering pipeline via gRPC and Gemini"
---

# AI Search & Q&A Domain

## Overview

Two distinct AI-powered endpoints:
1. **`POST /search/v2`** — Hybrid search (BM25 + semantic vector + RRF) returning ranked email results
2. **`POST /ask`** — AI Q&A streaming: retrieve context emails → stream Gemini answer via SSE

Both delegate to the Python gRPC service.

---

## Hybrid Search Pipeline (`POST /search/v2`)

```
Frontend (AIChatPage.tsx)
  → apiFetch('/search/v2', { method: 'POST', body: { query, limit, offset } })
  → backend/src/routes/search.routes.js
  → hybridSearchClient.Search({ query, user_email, limit, offset })
     → gRPC → python-service/server.py [Note: port discrepancy — see known-issues.md]
     [Service not yet confirmed — see known-issues.md]
  ← response: { results[], total, query_interpretation, timings, degraded, stages_timed_out }
```

> **Note**: The `search.routes.js` file calls `hybridSearchClient.Search()` which is defined in the `emailsearch_v2` proto (package from `search_feature_demo/grpc_app/search.proto`, gitignored). The `python-service` only implements `EmailSearchService` (package `emailsearch`) without a `Search` RPC. This endpoint may not be functional. See [operations/known-issues.md](../operations/known-issues.md).

## AI Q&A Pipeline (`POST /ask`) — SSE Streaming

```
Frontend (AIChatPage.tsx)
  → fetch('/ask', { method: 'POST', body: { question, sessionId } })
  → SSE stream (Content-Type: text/event-stream)
  → backend/src/routes/ask.routes.js
  → hybridSearchClient.AskQuestion({ user_email, question, top_k: 5 })
     → gRPC server-streaming → python-service/server.py → AskQuestion()
     │
     ├── 1. embedder.embed(question)
     │       → python-service/services/embedder.py
     │       → SentenceTransformer (Alibaba-NLP/gte-Qwen2-1.5B-instruct or fallback BAAI/bge-large-en-v1.5)
     │
     ├── 2. vector_store.query_vector_store(query_vector, user_email, top_k*2)
     │       → python-service/services/vector_store.py
     │       → ChromaDB cosine query, filtered by user_email
     │
     ├── 3. keyword_store.search_keyword_store(question, user_email, top_k*2)
     │       → python-service/services/keyword_store.py
     │       → MongoDB $text search on emails collection, filtered by userEmail
     │
     ├── 4. hybrid_search.reciprocal_rank_fusion(vector_res, keyword_res)
     │       → python-service/services/hybrid_search.py
     │       → RRF formula: sum(1 / (k=60 + rank + 1))
     │
     ├── 5. Fetch top_k email bodies from MongoDB
     │       → keyword_store.emails_collection.find_one({ messageId, userEmail })
     │
     ├── 6. gemini_service.stream_answer(question, context_emails)
     │       → python-service/services/gemini_service.py
     │       → google.genai.Client.models.generate_content_stream (model: gemini-2.5-flash)
     │       → yields text chunks
     │
     └── 7. Each chunk → gRPC AskResponseChunk → Node.js → SSE data: { text_delta, is_final, sources }

Frontend receives SSE chunks, renders streaming text.
```

## Session Persistence

After streaming completes (in `ask.routes.js`):
```javascript
if (sessionId) {
  ChatSession.findOneAndUpdate(
    { _id: sessionId, userEmail },  // scoped to authenticated user
    { $push: { messages: [{ role: 'user', content: question }, { role: 'ai', content: fullAiResponse, metadata: { sources } }] } }
  )
}
```

## Embedding Model

**Primary**: `Alibaba-NLP/gte-Qwen2-1.5B-instruct` (reads `EMBEDDING_MODEL` env)  
**Fallback**: `BAAI/bge-large-en-v1.5` (reads `EMBEDDING_MODEL_FALLBACK` env)  
**Device**: CUDA if available, else CPU (auto-detected via PyTorch)

## Files Involved

| File | Role |
|---|---|
| `backend/src/routes/ask.routes.js` | `POST /ask` SSE handler |
| `backend/src/routes/search.routes.js` | `POST /search/v2` handler |
| `backend/src/grpc/hybridSearchClient.js` | gRPC client |
| `python-service/server.py` | gRPC service implementations |
| `python-service/services/embedder.py` | SentenceTransformer wrapper |
| `python-service/services/vector_store.py` | ChromaDB vector queries |
| `python-service/services/keyword_store.py` | MongoDB text search |
| `python-service/services/hybrid_search.py` | RRF fusion algorithm |
| `python-service/services/gemini_service.py` | Gemini 2.5 Flash streaming |
| `python-service/protos/search.proto` | gRPC service definition |
| `frontend/src/pages/AIChatPage.tsx` | Client — SSE consumer |
| `backend/src/models/chatSession.model.js` | Session persistence |
