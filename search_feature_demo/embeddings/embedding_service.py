"""
Embedding service wrapping ``gte-Qwen2-1.5B-instruct``.

Provides :meth:`embed_query` and :meth:`embed_documents` with
GPU/CPU device selection, batching support, and an in-memory
LRU cache for repeated identical queries.
"""

from __future__ import annotations

import hashlib
import logging
import time
from typing import TYPE_CHECKING

from cachetools import TTLCache

import config as cfg

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# Module-level singleton
_instance: EmbeddingService | None = None


class EmbeddingService:
    """
    Wraps a SentenceTransformer model for text embedding.

    The model is loaded once at construction time and reused.
    A short-TTL LRU cache avoids re-embedding identical query strings.

    Args:
        model_name: HuggingFace model identifier.
        fallback_model: Model to try if the primary fails to load.
        device: Compute device (``"cuda"``, ``"cpu"``, or ``"auto"``).
        cache_ttl: Cache time-to-live in seconds.
        cache_maxsize: Maximum number of cached embeddings.
    """

    def __init__(
        self,
        model_name: str = cfg.EMBEDDING_MODEL,
        fallback_model: str = cfg.EMBEDDING_MODEL_FALLBACK,
        device: str | None = None,
        cache_ttl: int = 120,
        cache_maxsize: int = 256,
    ) -> None:
        self._device = device or cfg.resolve_device()
        self._model = self._load_model(model_name, fallback_model)
        self._cache: TTLCache[str, list[float]] = TTLCache(
            maxsize=cache_maxsize, ttl=cache_ttl
        )
        logger.info(
            "EmbeddingService ready — model=%s, device=%s",
            self._model.get_sentence_embedding_dimension(),
            self._device,
        )

    def _load_model(
        self, primary: str, fallback: str
    ) -> "SentenceTransformer":
        """Load the embedding model with automatic fallback."""
        from sentence_transformers import SentenceTransformer

        try:
            logger.info("Loading primary embedding model: %s on %s", primary, self._device)
            model = SentenceTransformer(primary, device=self._device, trust_remote_code=True, local_files_only=True)
            logger.info("Primary embedding model loaded successfully.")
            return model
        except Exception as exc:
            logger.warning("Failed to load primary model (%s): %s", primary, exc)
            logger.info("Loading fallback embedding model: %s", fallback)
            model = SentenceTransformer(fallback, device=self._device, local_files_only=True)
            logger.info("Fallback embedding model loaded successfully.")
            return model

    @staticmethod
    def _cache_key(text: str) -> str:
        """Produce a short hash key for cache lookup."""
        return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]

    def embed_query(self, text: str) -> list[float]:
        """
        Embed a single query string into a dense vector.

        Results are cached so repeated identical queries are free.

        Args:
            text: The text to embed.

        Returns:
            A list of floats representing the embedding vector.
        """
        if not text or not text.strip():
            text = "(empty query)"

        key = self._cache_key(text)
        cached = self._cache.get(key)
        if cached is not None:
            logger.debug("Cache hit for query embedding (key=%s)", key)
            return cached

        t0 = time.perf_counter()
        vector = self._model.encode(text, convert_to_numpy=True).tolist()
        elapsed_ms = (time.perf_counter() - t0) * 1000
        logger.debug("Embedded query in %.1f ms (dim=%d)", elapsed_ms, len(vector))

        self._cache[key] = vector
        return vector

    def embed_documents(self, texts: list[str], batch_size: int = 32) -> list[list[float]]:
        """
        Embed a batch of document texts into dense vectors.

        Args:
            texts: List of texts to embed.
            batch_size: Inference batch size (tuned for GPU memory).

        Returns:
            A list of embedding vectors, one per input text.
        """
        if not texts:
            return []

        # Replace empty strings
        cleaned = [t if t and t.strip() else "(empty text)" for t in texts]

        t0 = time.perf_counter()
        vectors = self._model.encode(
            cleaned, convert_to_numpy=True, batch_size=batch_size, show_progress_bar=False
        )
        elapsed_ms = (time.perf_counter() - t0) * 1000
        logger.info(
            "Embedded %d documents in %.1f ms (batch_size=%d)",
            len(cleaned),
            elapsed_ms,
            batch_size,
        )
        return [v.tolist() for v in vectors]

    @property
    def dimension(self) -> int:
        """Return the embedding vector dimensionality."""
        return self._model.get_sentence_embedding_dimension()


def get_embedding_service() -> EmbeddingService:
    """
    Return the module-level singleton EmbeddingService.

    Initializes on first call. Subsequent calls return the same instance.
    """
    global _instance
    if _instance is None:
        _instance = EmbeddingService()
    return _instance
