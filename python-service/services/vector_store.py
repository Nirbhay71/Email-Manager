import os
import chromadb
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("VectorStore")
CHROMA_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_data")

client = chromadb.PersistentClient(path=CHROMA_DIR)
collection = client.get_or_create_collection(
    name="emails",
    metadata={"hnsw:space": "cosine"}
)

def store_email_vector(message_id: str, vector: list[float], user_email: str, subject: str):
    """
    Stores an email vector into ChromaDB with user_email and subject metadata.
    """
    collection.upsert(
        ids=[message_id],
        embeddings=[vector],
        metadatas=[{
            "user_email": user_email,
            "subject": subject
        }]
    )
    logger.info(f"Stored vector for messageId: {message_id} (user: {user_email})")

def query_vector_store(query_vector: list[float], user_email: str, top_k: int = 5) -> list[dict]:
    """
    Queries ChromaDB for nearest vectors matching the query, strictly filtered by user_email.
    """
    results = collection.query(
        query_embeddings=[query_vector],
        n_results=top_k,
        where={"user_email": user_email}
    )

    formatted = []
    if results and "ids" in results and results["ids"]:
        ids = results["ids"][0]
        distances = results.get("distances", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]

        for msg_id, dist, meta in zip(ids, distances, metadatas):
            # Cosine distance to similarity score
            score = 1.0 - dist if dist is not None else 0.0
            formatted.append({
                "message_id": msg_id,
                "score": float(score),
                "subject": meta.get("subject", "")
            })

    return formatted
