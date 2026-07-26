"""
Vector semantic search via ChromaDB.

Embeds the free-text portion of the query using the EmbeddingService,
then queries ChromaDB for top-K nearest email embeddings filtered by
``user_email``. Returns candidate email IDs with cosine similarity scores.

Assumption: Emails are embedded and stored in ChromaDB at ingestion time
by the existing python-service ``EmbedAndStore`` gRPC method (or by a
future batch-embedding pipeline). The ChromaDB collection is named
``"emails"`` with metadata field ``user_email``.
"""

from __future__ import annotations

import logging
import time
from typing import Any

import chromadb

import config as cfg
from embeddings.embedding_service import get_embedding_service

logger = logging.getLogger(__name__)

# Module-level ChromaDB client and collection (lazy-init)
_client: chromadb.PersistentClient | None = None
_collection: chromadb.Collection | None = None


def _get_collection() -> chromadb.Collection:
    """Lazy-initialize and return the ChromaDB emails collection."""
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path=cfg.CHROMA_PERSIST_DIR)
        _collection = _client.get_or_create_collection(
            name="emails",
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(
            "ChromaDB collection 'emails' ready (count=%d)",
            _collection.count(),
        )
    return _collection


def search_vectors(
    query_text: str,
    user_email: str,
    top_k: int | None = None,
) -> list[dict[str, Any]]:
    """
    Perform semantic vector search for a query.

    Embeds the query text and finds the nearest email vectors in ChromaDB,
    strictly filtered by ``user_email``.

    Args:
        query_text: Free-text query to embed and search for.
        user_email: User whose emails to search (security filter).
        top_k: Number of nearest results to return (default from config).

    Returns:
        List of dicts with ``message_id``, ``score`` (cosine similarity),
        and ``subject``. Sorted by score descending.
    """
    if top_k is None:
        top_k = cfg.VECTOR_TOP_K

    if not query_text.strip():
        return []

    t0 = time.perf_counter()

    # Embed the query
    embedder = get_embedding_service()
    query_vector = embedder.embed_query(query_text)

    # Query ChromaDB with user_email filter
    collection = _get_collection()
    results = collection.query(
        query_embeddings=[query_vector],
        n_results=top_k,
        where={"user_email": user_email},
    )

    formatted: list[dict[str, Any]] = []
    if results and "ids" in results and results["ids"]:
        ids = results["ids"][0]
        distances = results.get("distances", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]

        for msg_id, dist, meta in zip(ids, distances, metadatas):
            # ChromaDB cosine distance -> similarity score
            score = 1.0 - dist if dist is not None else 0.0
            formatted.append(
                {
                    "message_id": msg_id,
                    "score": float(max(score, 0.0)),
                    "subject": meta.get("subject", "") if meta else "",
                }
            )

    elapsed_ms = (time.perf_counter() - t0) * 1000
    logger.info(
        "Vector search returned %d results in %.1f ms (query='%s')",
        len(formatted),
        elapsed_ms,
        query_text[:50],
    )
    return formatted


def store_email_vector(
    message_id: str,
    vector: list[float],
    user_email: str,
    subject: str,
) -> None:
    """
    Store an email vector in ChromaDB.

    Args:
        message_id: Unique email ID.
        vector: Dense embedding vector.
        user_email: User whose email this is (used for filtering).
        subject: Email subject for metadata.
    """
    collection = _get_collection()
    collection.upsert(
        ids=[message_id],
        embeddings=[vector],
        metadatas=[{"user_email": user_email, "subject": subject}],
    )
    logger.info("Stored vector for email %s", message_id)
