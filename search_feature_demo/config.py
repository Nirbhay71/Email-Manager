"""
Central configuration for the AI Email Search Service.

All settings are driven by environment variables with sensible defaults.
Import this module to access configuration values throughout the codebase.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/ai_email_manager")
MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "")  # Parsed from URI if empty
CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", "./chroma_data")

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
EMBEDDING_MODEL: str = os.getenv(
    "EMBEDDING_MODEL", "Alibaba-NLP/gte-Qwen2-1.5B-instruct"
)
EMBEDDING_MODEL_FALLBACK: str = os.getenv(
    "EMBEDDING_MODEL_FALLBACK", "BAAI/bge-large-en-v1.5"
)
RERANKER_MODEL: str = os.getenv("RERANKER_MODEL", "BAAI/bge-reranker-v2-m3")

# Device selection: "cuda", "cpu", or "auto" (auto = cuda if available)
DEVICE: str = os.getenv("DEVICE", "auto")

# ---------------------------------------------------------------------------
# Server Ports
# ---------------------------------------------------------------------------
GRPC_PORT: int = int(os.getenv("SEARCH_GRPC_PORT", "50052"))
HTTP_PORT: int = int(os.getenv("SEARCH_HTTP_PORT", "8001"))

# ---------------------------------------------------------------------------
# Retrieval Tuning
# ---------------------------------------------------------------------------
BM25_TOP_K: int = int(os.getenv("BM25_TOP_K", "200"))
VECTOR_TOP_K: int = int(os.getenv("VECTOR_TOP_K", "200"))
RRF_K: int = int(os.getenv("RRF_K", "60"))
RERANK_TOP_N: int = int(os.getenv("RERANK_TOP_N", "100"))
RERANK_BATCH_SIZE: int = int(os.getenv("RERANK_BATCH_SIZE", "32"))
FINAL_LIMIT: int = int(os.getenv("FINAL_LIMIT", "20"))

# ---------------------------------------------------------------------------
# Cache
# ---------------------------------------------------------------------------
CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "60"))
CACHE_MAX_SIZE: int = int(os.getenv("CACHE_MAX_SIZE", "512"))

# ---------------------------------------------------------------------------
# Timeouts (seconds) — per-stage budget for graceful degradation
# ---------------------------------------------------------------------------
TIMEOUT_METADATA_S: float = float(os.getenv("TIMEOUT_METADATA_S", "1.0"))
TIMEOUT_BM25_S: float = float(os.getenv("TIMEOUT_BM25_S", "2.0"))
TIMEOUT_VECTOR_S: float = float(os.getenv("TIMEOUT_VECTOR_S", "2.0"))
TIMEOUT_FUSION_S: float = float(os.getenv("TIMEOUT_FUSION_S", "0.5"))
TIMEOUT_RERANK_S: float = float(os.getenv("TIMEOUT_RERANK_S", "3.0"))

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT: str = os.getenv("LOG_FORMAT", "json")  # "json" or "console"


def resolve_device() -> str:
    """Resolve the compute device based on config and hardware availability."""
    if DEVICE == "auto":
        try:
            import torch

            return "cuda" if torch.cuda.is_available() else "cpu"
        except ImportError:
            return "cpu"
    return DEVICE


def resolve_mongo_db_name() -> str:
    """Parse the database name from MONGO_URI, or use the explicit override."""
    if MONGO_DB_NAME:
        return MONGO_DB_NAME
    # Extract DB name from URI: mongodb://host:port/dbname?params
    path_part = MONGO_URI.split("/")[-1]
    db_name = path_part.split("?")[0]
    return db_name or "ai_email_manager"
