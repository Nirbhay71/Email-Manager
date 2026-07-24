import os
import torch
import logging
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Embedder")

PRIMARY_MODEL = os.getenv("EMBEDDING_MODEL", "Alibaba-NLP/gte-Qwen2-1.5B-instruct")
FALLBACK_MODEL = os.getenv("EMBEDDING_MODEL_FALLBACK", "BAAI/bge-large-en-v1.5")

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
logger.info(f"=== Initializing SentenceTransformer on device: {DEVICE.upper()} ===")

try:
    logger.info(f"Loading primary model: {PRIMARY_MODEL}...")
    model = SentenceTransformer(PRIMARY_MODEL, device=DEVICE)
    logger.info("Primary embedding model loaded successfully.")
except Exception as e:
    logger.warning(f"Failed to load primary model ({PRIMARY_MODEL}): {e}")
    logger.info(f"Loading fallback model: {FALLBACK_MODEL}...")
    model = SentenceTransformer(FALLBACK_MODEL, device=DEVICE)
    logger.info("Fallback embedding model loaded successfully.")

def embed(text: str) -> list[float]:
    """
    Generates dense vector embeddings for the provided text.
    """
    if not text or not text.strip():
        text = "(empty text)"
    
    vector = model.encode(text, convert_to_numpy=True).tolist()
    return vector
