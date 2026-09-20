---
okf_version: "1.0"
title: "gRPC Protocol Contract"
description: "Protobuf service definition and gRPC client/server mapping"
---

# gRPC Protocol Contract

## Overview

Two proto files exist — one for each service variant. The **python-service** proto is canonical for the currently running server.

---

## `python-service/protos/search.proto` (Active)

**Package**: `emailsearch`  
**Service**: `EmailSearchService`

```protobuf
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
  int32 top_k = 3;
}

message AskResponseChunk {
  string text_delta = 1;
  bool is_final = 2;
  repeated SourceEmail sources = 3;
}

message SourceEmail {
  string message_id = 1;
  string subject = 2;
  float score = 3;
}
```

**Server implements**: `python-service/server.py → EmailSearchServicer`  
**Generated stubs**: `python-service/generated/` (gitignored — must regenerate)

---

## `search_feature_demo/grpc_app/search.proto` (Used by Backend)

**Location**: Gitignored directory `search_feature_demo/` — cannot be read directly  
**Package**: `emailsearch_v2` (confirmed from `hybridSearchClient.js` line 21)  
**Service**: `SearchService` (confirmed from `hybridSearchClient.js` line 26)  
**RPCs used by backend**:
- `Search()` — called in `search.routes.js`
- `AskQuestion()` — called in `ask.routes.js`
- `EmbedAndStore()` — called in `services/embeddingClient.js`

> ⚠️ This proto is **gitignored** and not accessible from the repository. This is a critical documentation gap and may indicate that the backend is pointing to a *different* Python service implementation than what exists in `python-service/`. See [operations/known-issues.md](../operations/known-issues.md).

---

## gRPC Client (`backend/src/grpc/hybridSearchClient.js`)

```javascript
const PROTO_PATH = path.resolve(__dirname, '../../../search_feature_demo/grpc_app/search.proto');
const HYBRID_SEARCH_GRPC_HOST = process.env.HYBRID_SEARCH_GRPC_HOST || 'localhost:50052';

export const hybridSearchClient = new emailSearchV2Proto.SearchService(
  HYBRID_SEARCH_GRPC_HOST,
  grpc.credentials.createInsecure()
);
```

**Consumed by**:
- `backend/src/services/embeddingClient.js` — `EmbedAndStore()`
- `backend/src/routes/ask.routes.js` — `AskQuestion()` (streaming)
- `backend/src/routes/search.routes.js` — `Search()`

---

## Generating Stubs

To regenerate Python stubs from `python-service/protos/search.proto`:

```bash
cd python-service
python -m grpc_tools.protoc \
  --proto_path=protos \
  --python_out=generated \
  --grpc_python_out=generated \
  protos/search.proto
```

The `generated/` directory is gitignored; stubs must be generated before running the Python server.
