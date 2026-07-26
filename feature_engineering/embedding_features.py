import numpy as np
from typing import Dict, Any, Tuple
import sys
import os

# Add search_feature_demo to path to import embedding_service
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'search_feature_demo'))

try:
    from embeddings.embedding_service import get_embedding_service
except ImportError as e:
    # Fallback for testing without the full environment
    print(f"Warning: Could not import embedding_service ({e}). Cold start logic will still function.")
    def get_embedding_service():
        return None

def cosine_similarity(v1: list[float], v2: list[float]) -> float:
    """Computes cosine similarity between two vectors."""
    if not v1 or not v2:
        return None
    arr1 = np.array(v1)
    arr2 = np.array(v2)
    norm1 = np.linalg.norm(arr1)
    norm2 = np.linalg.norm(arr2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(arr1, arr2) / (norm1 * norm2))


def extract_embedding_features(email_doc: dict, centroids: dict, label: str = None) -> dict:
    """
    Extracts embedding features: cosine similarity to the user's important 
    and not_important centroids.
    
    If the email being extracted was used to build the centroid (i.e. it has a label),
    it computes a Leave-One-Out (LOO) centroid to prevent self-leakage inflation.
    """
    text = f"{email_doc.get('subject', '')}\n\n{email_doc.get('body', '')[:2000]}"
    
    try:
        from embeddings.embedding_service import get_embedding_service
        service = get_embedding_service()
        if service:
            vector = service.embed_query(text)
        else:
            vector = [0.0] * 1536
    except Exception as e:
        print(f"Warning: Failed to load embedding service: {e}")
        vector = [0.0] * 1536
        
    important_centroid = centroids.get("important")
    not_important_centroid = centroids.get("not_important")
    important_count = centroids.get("importantCount", 0)
    not_important_count = centroids.get("notImportantCount", 0)

    # Apply Leave-One-Out (LOO) correction if this email contributed to the centroid
    if label == "important" and important_centroid and important_count > 1:
        C = np.array(important_centroid)
        V = np.array(vector)
        if C.shape == V.shape:
            # Recompute mean without this vector
            LOO_C = (C * important_count - V) / (important_count - 1)
            important_centroid = LOO_C.tolist()
            
    elif label == "not_important" and not_important_centroid and not_important_count > 1:
        C = np.array(not_important_centroid)
        V = np.array(vector)
        if C.shape == V.shape:
            # Recompute mean without this vector
            LOO_C = (C * not_important_count - V) / (not_important_count - 1)
            not_important_centroid = LOO_C.tolist()

    cosine_important = cosine_similarity(vector, important_centroid) if important_centroid else None
    cosine_not_important = cosine_similarity(vector, not_important_centroid) if not_important_centroid else None
    
    return {
        "cosine_to_important_centroid": cosine_important,
        "cosine_to_not_important_centroid": cosine_not_important
    }
