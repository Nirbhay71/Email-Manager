---
okf_version: "1.0"
title: "Python gRPC Service"
description: "Python search/AI service: structure, models, and gRPC implementation"
---

# Python gRPC Service

**Path**: `python-service/`  
**Entry**: `python-service/server.py`  
**Default port**: `50051` (env: `GRPC_PORT`)

> ⚠️ Backend connects to port `50052` via `HYBRID_SEARCH_GRPC_HOST`. See [operations/known-issues.md](../operations/known-issues.md).

## Protocol Definition

**File**: `python-service/protos/search.proto`  
**Package**: `emailsearch`  
**Service**: `EmailSearchService`

```protobuf
service EmailSearchService {
  rpc EmbedAndStore (EmbedRequest) returns (EmbedResponse);     // Unary
  rpc AskQuestion (AskRequest) returns (stream AskResponseChunk); // Server-streaming
}
```

## File Structure

```
python-service/
├── server.py                    # gRPC server entry point
├── protos/
│   └── search.proto             # Service contract
├── generated/                   # Generated stubs (gitignored) — run protoc before use
│   ├── search_pb2.py
│   └── search_pb2_grpc.py
├── services/
│   ├── __init__.py
│   ├── embedder.py              # SentenceTransformer wrapper
│   ├── vector_store.py          # ChromaDB read/write
│   ├── keyword_store.py         # MongoDB text search
│   ├── hybrid_search.py         # RRF fusion algorithm
│   └── gemini_service.py        # Gemini 2.5 Flash streaming
├── chroma_data/                 # ChromaDB persistence (gitignored)
├── requirements.txt             # Python dependencies
└── .env                         # Python secrets (gitignored)
```

## Service Implementations

### `EmailSearchServicer.EmbedAndStore` (unary)

```
Input: { message_id, user_email, subject, body }
  → embedder.embed(subject + " " + body)
  → vector_store.store_email_vector(message_id, vector, user_email, subject)
Output: { success: bool, error: str }
```

### `EmailSearchServicer.AskQuestion` (server-streaming)

```
Input: { user_email, question, top_k }
  → embedder.embed(question)                          → query_vector
  → vector_store.query_vector_store(...)              → dense_results
  → keyword_store.search_keyword_store(...)           → sparse_results
  → hybrid_search.reciprocal_rank_fusion(...)         → ranked[(msg_id, score)]
  → keyword_store.emails_collection.find_one(...)     → email bodies
  → gemini_service.stream_answer(question, emails)   → text chunks
Output: stream of AskResponseChunk { text_delta, is_final, sources }
```

## Service Modules

### `services/embedder.py`
- **Model**: `Alibaba-NLP/gte-Qwen2-1.5B-instruct` (env: `EMBEDDING_MODEL`)
- **Fallback**: `BAAI/bge-large-en-v1.5` (env: `EMBEDDING_MODEL_FALLBACK`)
- **Device**: auto-detected (`cuda` if torch.cuda.is_available() else `cpu`)
- **Loaded at module import time** — slow startup, fast inference
- **Exports**: `embed(text: str) -> list[float]`

### `services/vector_store.py`
- **Client**: `chromadb.PersistentClient(path=CHROMA_PERSIST_DIR || "./chroma_data")`
- **Collection**: `emails` (created if absent), metric: cosine
- **Exports**: `store_email_vector(message_id, vector, user_email, subject)`, `query_vector_store(query_vector, user_email, top_k)`
- **Isolation**: `where={"user_email": user_email}` on all queries

### `services/keyword_store.py`
- **Connection**: `pymongo.MongoClient(MONGO_URI || "mongodb://localhost:27017/ai_email_manager")`
- **Collection**: `emails` (same MongoDB collection as Node.js backend)
- **Search**: `$text` query (uses MongoDB text index on `subject`, `body` fields)
- **Exports**: `search_keyword_store(query_str, user_email, top_k)`, `emails_collection` (direct access)

### `services/hybrid_search.py`
- RRF formula: `score += 1 / (k=60 + rank + 1)`
- **Exports**: `reciprocal_rank_fusion(vector_results, keyword_results, k=60)`
- No external dependencies — pure Python

### `services/gemini_service.py`
- **SDK**: `google.genai.Client` (env: `GEMINI_API_KEY`)
- **Model**: `gemini-2.5-flash`
- **Graceful degradation**: if `GEMINI_API_KEY` is absent, yields error message instead of crashing
- **Exports**: `stream_answer(question, context_emails) -> Generator[str]`

## Server Configuration

- Synchronous gRPC server (avoids asyncio event loop issues on Windows)
- `ThreadPoolExecutor(max_workers=10)`
- Reads `GRPC_PORT` — defaults to `50051`

## Python Requirements (`requirements.txt`)

```
grpcio
grpcio-tools
chromadb
sentence-transformers
torch
google-generativeai (or google-genai)
pymongo
python-dotenv
```
