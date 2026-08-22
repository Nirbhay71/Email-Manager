---
okf_version: "1.0"
title: "External Services"
description: "Twilio SMS and ChromaDB (local) integrations"
---

# External Services

## Twilio SMS

**SDK**: `twilio` npm package  
**File**: `backend/src/service/sms.service.js`  
**Called by**: `webhook.controllers.js → handleGmailWebhook()` when a deadline date is found in an email

**Behavior**:
- If `TWILIO_ACCOUNT_SID` or `TWILIO_AUTH_TOKEN` are absent, logs "skipping SMS" and returns `"skipped"` — SMS is optional
- Sends SMS from `TWILIO_FROM_NUMBER` to `TWILIO_TEST_TO_NUMBER` (hardcoded test destination, not dynamic)

**SMS message format**:
```
"Deadline {YYYY-MM-DD} found in "{subject}". Calendar event created."
```

**Required env vars**:
```
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER    (Twilio phone number)
TWILIO_TEST_TO_NUMBER (recipient phone — hardcoded test number)
```

**Note**: The destination is a fixed "test" number — not the user's phone. This is not production-ready for multi-user delivery.

---

## ChromaDB (Local Vector Store)

**Library**: `chromadb` Python package  
**File**: `python-service/services/vector_store.py`  
**Type**: Local persistent (not a remote service)  
**Data directory**: `python-service/chroma_data/` (gitignored)

**Initialization** (at module import):
```python
client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR || "./chroma_data")
collection = client.get_or_create_collection(name="emails", metadata={"hnsw:space": "cosine"})
```

**Data persists** between Python service restarts.  
**Not shared** with the Node.js backend — only `python-service` reads/writes ChromaDB.  
**Tenant isolation**: All queries include `where={"user_email": user_email}`.

---

## SentenceTransformer Models (Local ML)

Not an external web service — models are downloaded from HuggingFace Hub on first run and cached locally.

| Model | Env Var | Use case |
|---|---|---|
| `Alibaba-NLP/gte-Qwen2-1.5B-instruct` | `EMBEDDING_MODEL` | Primary; large, high quality |
| `BAAI/bge-large-en-v1.5` | `EMBEDDING_MODEL_FALLBACK` | Fallback if primary fails to load |

**CUDA**: Used automatically if a GPU is available (`torch.cuda.is_available()`).  
**Warning**: Loading GTE-Qwen2-1.5B requires ~3 GB GPU VRAM or significant RAM on CPU.
