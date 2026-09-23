import os
import uuid
import chromadb

CHROMA_PATH = os.getenv("CHROMA_PERSIST_DIR", "./chroma_data_classifier")
_client = chromadb.PersistentClient(path=CHROMA_PATH)

def _collection_name(user_email: str) -> str:
    # Sanitize user email to meet ChromaDB collection naming rules:
    # 3-63 chars, alphanumeric, underscores or hyphens.
    sanitized = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in user_email)
    name = f"clf_{sanitized}"
    # Truncate and strip edge symbols to make sure it's valid
    valid_name = name[:63].strip("_").strip("-")
    # In case the result is too short, pad it
    if len(valid_name) < 3:
        valid_name = f"clf_{valid_name}"
    return valid_name

def get_collection(user_email: str):
    return _client.get_or_create_collection(
        name=_collection_name(user_email),
        metadata={"hnsw:space": "cosine"},
    )

def add_example(
    user_email: str,
    email_id: str,
    embedding: list[float],
    category: str,
    subject: str,
    sender: str,
    source: str,
) -> None:
    collection = get_collection(user_email)
    # Use a UUID as the Chroma id so re-labeling the same email doesn't overwrite it.
    # The original email_id is kept in metadata.
    doc_id = str(uuid.uuid4())
    collection.add(
        ids=[doc_id],
        embeddings=[embedding],
        metadatas=[
            {
                "email_id": email_id,
                "category": category,
                "subject": subject,
                "sender": sender,
                "source": source,
            }
        ],
    )

def query_similar(user_email: str, embedding: list[float], top_k: int = 8):
    collection = get_collection(user_email)
    count = collection.count()
    if count == 0:
        return []

    results = collection.query(
        query_embeddings=[embedding],
        n_results=min(top_k, count),
    )

    matches = []
    if results and "ids" in results and results["ids"] and results["ids"][0]:
        for i in range(len(results["ids"][0])):
            matches.append(
                {
                    "category": results["metadatas"][0][i]["category"],
                    "subject": results["metadatas"][0][i]["subject"],
                    "sender": results["metadatas"][0][i]["sender"],
                    "source": results["metadatas"][0][i]["source"],
                    "distance": results["distances"][0][i],
                    "similarity": 1.0 - results["distances"][0][i] if results["distances"][0][i] is not None else 0.0,
                }
            )
    return matches

def category_count(user_email: str, category: str) -> int:
    collection = get_collection(user_email)
    result = collection.get(where={"category": category})
    return len(result["ids"]) if result and "ids" in result else 0

def all_category_counts(user_email: str) -> dict[str, int]:
    collection = get_collection(user_email)
    all_docs = collection.get()
    counts: dict[str, int] = {}
    if all_docs and "metadatas" in all_docs and all_docs["metadatas"]:
        for meta in all_docs["metadatas"]:
            cat = meta.get("category")
            if cat:
                counts[cat] = counts.get(cat, 0) + 1
    return counts

def delete_example(user_email: str, email_id: str) -> None:
    collection = get_collection(user_email)
    collection.delete(where={"email_id": email_id})

