import pytest
from datetime import datetime
from feature_engineering.sender_features import extract_sender_features
from feature_engineering.content_features import extract_content_features
from feature_engineering.time_features import extract_time_features
from feature_engineering.behavioral_features import extract_behavioral_features
from feature_engineering.embedding_features import extract_embedding_features

def test_sender_features():
    email = {"from": "John Doe <john.doe@example.com>"}
    counts = {"example.com": 5, "other.com": 1}
    
    # Known contact (count 5 >= threshold 3)
    f1 = extract_sender_features(email, counts, known_contact_threshold=3)
    assert f1["domain"] == "example.com"
    assert f1["historical_count"] == 5
    assert f1["known_contact"] is True
    
    # Unknown sender domain
    f2 = extract_sender_features({"from": ""}, counts)
    assert f2["domain"] == "unknown"
    assert f2["historical_count"] == 0
    assert f2["known_contact"] is False

def test_content_features():
    # Deadline and invoice
    e1 = {"subject": "Invoice for project", "body": "Please pay by the due date."}
    f1 = extract_content_features(e1)
    assert f1["is_invoice"] is True
    assert f1["is_deadline"] is True
    assert f1["is_interview"] is False
    assert f1["subject_length"] == 19
    
    # Empty bodies
    f2 = extract_content_features({})
    assert f2["is_invoice"] is False
    assert f2["subject_length"] == 0

def test_time_features():
    # Wed, 01 Jan 2025 10:00:00 GMT (Wednesday, Working hour)
    e1 = {
        "createdAt": "2025-01-01T10:00:00Z",
        "detectedDate": "2025-01-05T10:00:00Z"
    }
    f1 = extract_time_features(e1)
    assert f1["day_of_week"] == 2 # Wednesday
    assert f1["is_working_hours"] is True
    assert f1["days_until_deadline"] == 4
    
    # Sun, 05 Jan 2025 23:00:00 GMT (Sunday, Non-working hour)
    e2 = {
        "createdAt": "2025-01-05T23:00:00Z"
    }
    f2 = extract_time_features(e2)
    assert f2["day_of_week"] == 6 # Sunday
    assert f2["is_working_hours"] is False
    assert f2["days_until_deadline"] is None

def test_behavioral_features():
    f = extract_behavioral_features({})
    assert f["opened_similar_before"] is None

def test_embedding_features_cold_start():
    # Test cold start handling explicitly
    email = {"subject": "Test", "body": "Hello"}
    
    # Both centroids missing (cold start)
    centroids = {"important": None, "not_important": None}
    f = extract_embedding_features(email, centroids)
    
    assert f["cosine_to_important_centroid"] is None
    assert f["cosine_to_not_important_centroid"] is None
    
def test_embedding_features_with_centroids(monkeypatch):
    email = {"subject": "Test", "body": "Hello"}
    centroids = {
        "important": [1.0, 0.0],
        "not_important": [0.0, 1.0]
    }
    
    # Mock the embedding service to return a dim=2 vector
    class MockService:
        def embed_query(self, text):
            return [1.0, 1.0]
            
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'search_feature_demo'))
    import embeddings.embedding_service
    monkeypatch.setattr(embeddings.embedding_service, "get_embedding_service", lambda: MockService())
    
    import feature_engineering.embedding_features as ef
    
    f = ef.extract_embedding_features(email, centroids)
    
    assert f["cosine_to_important_centroid"] is not None
    assert f["cosine_to_not_important_centroid"] is not None

def test_embedding_features_leave_one_out(monkeypatch):
    """
    Tests that a labeled email's own vector is subtracted from the centroid
    before computing cosine similarity (LOO correction).
    """
    email = {"subject": "Test LOO", "body": "Hello"}
    
    centroids = {
        "important": [2.0, 2.0],
        "importantCount": 2,
        "not_important": None,
        "notImportantCount": 0
    }
    
    class MockServiceLOO:
        def embed_query(self, text):
            return [4.0, 0.0]  # This email's vector
            
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'search_feature_demo'))
    import embeddings.embedding_service
    monkeypatch.setattr(embeddings.embedding_service, "get_embedding_service", lambda: MockServiceLOO())
    
    import feature_engineering.embedding_features as ef
    # 1. With label "important" (Should apply LOO)
    # LOO centroid = ( [2,2]*2 - [4,0] ) / 1 = [0, 4]
    # Cosine between V1=[4,0] and LOO_C=[0,4] is 0.0!
    f_loo = ef.extract_embedding_features(email, centroids, label="important")
    assert f_loo["cosine_to_important_centroid"] == 0.0
    
    # 2. Without label (Should NOT apply LOO, uses raw C=[2,2])
    # Cosine between V1=[4,0] and C=[2,2] is 0.707 (1/sqrt(2))
    f_no_loo = ef.extract_embedding_features(email, centroids, label=None)
    assert f_no_loo["cosine_to_important_centroid"] > 0.7
    assert f_no_loo["cosine_to_important_centroid"] < 0.71
