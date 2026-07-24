# AI Email Manager — Phase 2 Implementation Spec
## Hybrid Search (Vector + Keyword) + Gemini-Powered Q&A

This document specifies everything needed to implement Phase 2. Hand this file
to a coding IDE / AI coding assistant as the source of truth for what to build.
It assumes Phase 1 (OAuth, Gmail Pub/Sub ingestion, MongoDB storage of raw
emails) is already working.

---

## 1. Goal

Given a natural-language question from the user (e.g. "when is my internship
deadline?"), the system should:

1. Retrieve the most relevant emails using **hybrid search** (dense vector
   similarity + sparse keyword matching, merged via Reciprocal Rank Fusion)
2. Feed the retrieved email content as context to **Gemini 2.5 Flash**
3. Stream Gemini's generated answer back to the dashboard in real time

---

## 2. Architecture

```
┌─────────────────────────┐         gRPC (localhost:50051)      ┌──────────────────────────────┐
│   Node.js (Express)      │ ───────────────────────────────────▶│   Python (gRPC server)        │
│                           │                                      │                                │
│  webhook.js               │  EmbedAndStore(messageId, userEmail,│  1. Embed text on GPU          │
│  (on new email ingested)  │      subject, body)                 │  2. Store vector in Chroma     │
│                           │ ◀────────────────────────────────── │                                │
│                           │                                      │                                │
│  routes/ask.js            │  AskQuestion(userEmail, question)   │  1. Embed question on GPU      │
│  (new endpoint, streaming)│      -> stream of answer chunks     │  2. Vector search (Chroma)      │
│                           │ ◀════════ streamed chunks ═════════ │  3. Keyword search (Mongo $text)│
│                           │                                      │  4. RRF fusion -> top emails    │
│                           │                                      │  5. Call Gemini 2.5 Flash,      │
│                           │                                      │     stream tokens back over     │
│                           │                                      │     gRPC server-streaming RPC   │
└─────────────────────────┘                                      └──────────────────────────────┘
              │                                                                    │
              ▼                                                                    ▼
       MongoDB (existing)                                              Chroma (local, GPU embeds only
       raw email documents,                                            used during embedding step,
       $text index for keyword                                         not for the DB itself)
       search
```

**Key point on GPU usage**: the GPU is used ONLY inside the Python process,
ONLY during the embedding step (`sentence-transformers` model forward pass).
Chroma's storage/retrieval is CPU-side vector math (fast even without GPU
since it's just comparing pre-computed vectors). Gemini calls are a normal
HTTPS request to Google's API — no local compute involved at all.

---

## 3. Prerequisites & Environment Setup

### 3.1 Python environment

```bash
cd python-service
python -m venv venv
venv\Scripts\activate        # Windows
```

### 3.2 Install PyTorch with CUDA support FIRST, separately

This is the most common failure point — installing plain `pip install torch`
gives you a CPU-only build silently, with no error, and everything will just
run slow with the GPU idle. Install the CUDA build explicitly:

```bash
pip install torch --index-url https://download.pytorch.org/whl/cu121
```

Verify it worked before installing anything else:

```bash
python -c "import torch; print(torch.cuda.is_available()); print(torch.cuda.get_device_name(0))"
```

Expected output:
```
True
NVIDIA GeForce RTX 3050
```

If `False` is printed, stop and fix this before proceeding — nothing below
will use the GPU until this returns `True`. Common causes: NVIDIA driver
outdated (update via GeForce Experience or nvidia.com), or CUDA toolkit
version mismatch with the installed torch build.

### 3.3 Install remaining Python dependencies

```bash
pip install grpcio grpcio-tools sentence-transformers chromadb pymongo python-dotenv google-genai
```

### 3.4 Node dependencies (add to existing backend)

```bash
npm install @grpc/grpc-js @grpc/proto-loader
```

### 3.5 Environment variables

**`python-service/.env`**
```
MONGO_URI=mongodb://localhost:27017/ai_email_manager
GEMINI_API_KEY=your_key_from_aistudio.google.com
CHROMA_PERSIST_DIR=./chroma_data
EMBEDDING_MODEL=Alibaba-NLP/gte-Qwen2-1.5B-instruct
EMBEDDING_MODEL_FALLBACK=BAAI/bge-large-en-v1.5
GRPC_PORT=50051
```

**Add to existing `backend/.env`**
```
PYTHON_GRPC_HOST=localhost:50051
```

Get a Gemini API key at https://aistudio.google.com/apikey — free tier is
sufficient for development/testing volume.

---

## 4. Folder Structure

```
python-service/
  protos/
    search.proto
  generated/                    # auto-generated, do not hand-edit
  services/
    embedder.py                 # loads model, text -> vector
    vector_store.py             # Chroma wrapper
    keyword_store.py            # Mongo $text wrapper
    hybrid_search.py            # RRF fusion logic
    gemini_service.py           # Gemini streaming call
  server.py                     # gRPC server entrypoint
  requirements.txt
  .env

backend/                        # existing Node project
  src/
    grpc/
      client.js                 # gRPC client setup, loads search.proto
    routes/
      ask.js                    # new: POST /ask (streaming response)
    services/
      embeddingClient.js         # wraps EmbedAndStore gRPC call
```

---

## 5. gRPC Contract (`protos/search.proto`)

```protobuf
syntax = "proto3";

package emailsearch;

service EmailSearchService {
  rpc EmbedAndStore (EmbedRequest) returns (EmbedResponse);
  rpc AskQuestion (AskRequest) returns (stream AskResponseChunk);
}

message EmbedRequest {
  string message_id = 1;
  string user_email = 2;
  string subject = 3;
  string body = 4;
}

message EmbedResponse {
  bool success = 1;
  string error = 2;
}

message AskRequest {
  string user_email = 1;
  string question = 2;
  int32 top_k = 3;         // how many emails to retrieve, default 5
}

message AskResponseChunk {
  string text_delta = 1;   // one streamed piece of Gemini's answer
  bool is_final = 2;       // true on the last chunk
  repeated SourceEmail sources = 3;  // only populated on the final chunk
}

message SourceEmail {
  string message_id = 1;
  string subject = 2;
  float score = 3;
}
```

### Code generation commands

**Python** (run from `python-service/`):
```bash
python -m grpc_tools.protoc -I protos --python_out=generated --grpc_python_out=generated protos/search.proto
```

**Node** does NOT need a codegen step — `@grpc/proto-loader` loads `.proto`
files dynamically at runtime. Just point it at the same `search.proto` file.

---

## 6. Python Service Specs

### 6.1 `services/embedder.py`

- Load the model ONCE at module import time (not per-request), on GPU:
  ```python
  from sentence_transformers import SentenceTransformer
  import torch

  device = "cuda" if torch.cuda.is_available() else "cpu"
  model = SentenceTransformer(EMBEDDING_MODEL, device=device)
  ```
- Function `embed(text: str) -> list[float]` — returns the embedding vector
- Log which device it loaded on at startup, loudly, so it's obvious in the
  console if it silently fell back to CPU
- Wrap model loading in try/except: if the primary model fails to load
  (e.g. OOM on the 1.5B model), fall back to `EMBEDDING_MODEL_FALLBACK`
  automatically and log a warning

### 6.2 `services/vector_store.py`

- Initialize a persistent Chroma client pointed at `CHROMA_PERSIST_DIR`
- One collection named `emails`
- `store(message_id, vector, metadata: {user_email, subject})`
- `query(vector, user_email, top_k) -> list[{message_id, score}]` —
  **must filter by `user_email`** using Chroma's `where` clause, otherwise
  one user's search can leak another user's email results

### 6.3 `services/keyword_store.py`

- `pymongo` connection to the same Mongo instance Node uses
- `search(query: str, user_email: str, top_k: int) -> list[{message_id, score}]`
  using `$text: {$search: query}` filtered by `userEmail`, sorted by
  `{score: {$meta: "textScore"}}`

### 6.4 `services/hybrid_search.py`

Implements Reciprocal Rank Fusion:

```python
def reciprocal_rank_fusion(vector_results, keyword_results, k=60):
    scores = {}
    for rank, item in enumerate(vector_results):
        scores[item['message_id']] = scores.get(item['message_id'], 0) + 1 / (k + rank + 1)
    for rank, item in enumerate(keyword_results):
        scores[item['message_id']] = scores.get(item['message_id'], 0) + 1 / (k + rank + 1)
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)
```

`k=60` is the standard constant from the original RRF paper — no need to
tune this initially.

### 6.5 `services/gemini_service.py`

- Use `google-genai` SDK, model = `gemini-2.5-flash`
- Function `stream_answer(question: str, context_emails: list[dict])`:
  - Build a prompt that includes the retrieved email subjects/bodies as
    context, explicitly instructing Gemini to answer ONLY from the provided
    context and say "I don't see that information in your emails" if the
    answer isn't present (prevents hallucinated dates/facts — important
    given this app deals with real deadlines)
  - Call Gemini's streaming generation method, yield each text chunk as
    it arrives — this is what makes the gRPC response streaming end-to-end
- Example prompt structure to implement:
  ```
  You are an email assistant. Answer the user's question using ONLY the
  email excerpts below. If the answer isn't in these emails, say so clearly
  instead of guessing.

  --- Email 1: {subject} ---
  {body}

  --- Email 2: {subject} ---
  {body}

  Question: {question}
  ```

### 6.6 `server.py`

- Implements the generated `EmailSearchServiceServicer`
- `EmbedAndStore`: call `embedder.embed()`, then `vector_store.store()`
- `AskQuestion`: call `vector_store.query()` + `keyword_store.search()` in
  parallel (use `asyncio.gather` or `concurrent.futures` — no reason to run
  these sequentially since they're independent), fuse with
  `hybrid_search.reciprocal_rank_fusion()`, fetch the top emails' full text
  from Mongo, then stream through `gemini_service.stream_answer()`, yielding
  `AskResponseChunk` messages back to Node as they arrive
- Serve on `[::]:50051` using `grpc.aio` (async server, required for
  streaming RPCs to work smoothly)

---

## 7. Node.js Integration Specs

### 7.1 `src/grpc/client.js`

- Load `search.proto` via `@grpc/proto-loader`
- Create and export a single gRPC client instance pointed at
  `process.env.PYTHON_GRPC_HOST`

### 7.2 `src/services/embeddingClient.js`

- Wraps the `EmbedAndStore` unary call in a Promise
- Called from the existing `webhook.js`, right after the email is saved to
  Mongo — fire-and-forget is acceptable here (log errors, don't block the
  webhook's HTTP response on it)

### 7.3 `src/routes/ask.js`

- `POST /ask` with body `{ question: string }`
- Get `userEmail` from the authenticated session (however Phase 1 auth
  currently identifies the logged-in user)
- Call the `AskQuestion` streaming RPC
- Pipe chunks to the client using **Server-Sent Events (SSE)**:
  ```js
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  call.on('data', (chunk) => {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  });
  call.on('end', () => res.end());
  call.on('error', (err) => { console.error(err); res.end(); });
  ```
- SSE is the right tool here (not WebSockets) since this is one-directional
  server-to-client streaming — simpler protocol, works over plain HTTP,
  and the dashboard just needs `EventSource` on the frontend to consume it

---

## 8. Testing Plan (in order)

1. **Embedder standalone**: run `embedder.py` directly with a hardcoded
   string, print the vector's length and first 5 values, confirm no
   CUDA errors, confirm console shows `device: cuda`
2. **Vector store standalone**: store 2–3 dummy embeddings, query one back,
   confirm correct nearest match returned
3. **Keyword store standalone**: run a `$text` query against your real
   Phase 1 email collection, confirm results return
4. **Hybrid fusion standalone**: feed two fake ranked lists with an
   overlapping item, confirm the overlapping item scores highest
5. **Gemini streaming standalone**: call `gemini_service.stream_answer()`
   with a fake question + fake context, confirm chunks print progressively
   to console (not all at once)
6. **Full gRPC server**: start `server.py`, use a simple Python gRPC test
   client script to call both RPCs directly, confirm expected responses
7. **Node client**: call `EmbedAndStore` from a test script, confirm the
   vector appears in Chroma
8. **End-to-end**: send 3–4 real test emails with a mix of exact-keyword
   and semantic-only overlap with a test question, hit `/ask` from a REST
   client (Postman/Thunder Client) with SSE enabled, confirm streamed
   answer arrives and correctly cites which emails it used

---

## 9. Known Constraints / Things to Revisit Later

- 6GB VRAM caps model choice — if `gte-Qwen2-1.5B-instruct` proves unstable
  under load, fall back to `bge-large-en-v1.5` (smaller, still strong)
- Embedding happens synchronously in the webhook flow for now — if email
  volume grows, move `EmbedAndStore` calls to a queue (e.g. BullMQ) so a
  slow embedding call never delays the webhook's response to Google
- No chunking implemented yet — whole email body embedded as one vector;
  revisit only if testing shows long emails hurt retrieval quality
- No conversation memory — each `/ask` call is independent, no multi-turn
  context; add a conversation history parameter later if needed
- Gemini API key has no rate-limit handling yet — add retry/backoff before
  this goes beyond personal testing
