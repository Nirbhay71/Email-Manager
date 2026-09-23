import os
from functools import lru_cache
import torch
from sentence_transformers import SentenceTransformer

MODEL_NAME = os.getenv("EMBEDDING_MODEL", "BAAI/bge-large-en-v1.5")
QUERY_INSTRUCTION = "Represent this sentence for searching relevant passages: "

# Default to CPU so this service doesn't compete for VRAM with python-service (search).
# On deployment, both services run in separate containers with their own GPU — set CLASSIFIER_DEVICE=cuda there.
_env_device = os.getenv("CLASSIFIER_DEVICE", "cpu")
DEVICE = _env_device if _env_device in ("cuda", "cpu") else ("cuda" if torch.cuda.is_available() else "cpu")

print(f"=== Classifier Embedder loading model {MODEL_NAME} on device: {DEVICE.upper()} ===")
model = SentenceTransformer(MODEL_NAME, device=DEVICE)

def _email_to_text(subject: str, body_snippet: str, sender: str) -> str:
    return f"From: {sender}\nSubject: {subject}\n\n{body_snippet}".strip()

def embed_document(subject: str, body_snippet: str, sender: str) -> list[float]:
    """Embed an email for storage. No instruction prefix (BGE convention)."""
    text = _email_to_text(subject, body_snippet, sender)
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()

def embed_query(subject: str, body_snippet: str, sender: str) -> list[float]:
    """Embed an incoming email to search against stored examples."""
    text = QUERY_INSTRUCTION + _email_to_text(subject, body_snippet, sender)
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()

