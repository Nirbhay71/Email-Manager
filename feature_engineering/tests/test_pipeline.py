import pytest
import time
from pymongo import MongoClient
from feature_engineering.pipeline import extract_features_batch, get_or_compute_centroids, get_db

@pytest.fixture(scope="module")
def setup_db():
    # Setup test DB connection
    db = get_db()
    test_email = "test_pipeline@example.com"
    
    # Clean up old test data
    db.emails.delete_many({"userEmail": test_email})
    db.emaillabels.delete_many({"userEmail": test_email})
    db.usercentroids.delete_many({"userEmail": test_email})
    db.emailfeatures.delete_many({"userEmail": test_email})
    db.users.delete_many({"email": test_email})
    
    # Create test user
    db.users.insert_one({"email": test_email, "labelVersion": 1})
    
    # Seed 6 emails
    emails = []
    labels = []
    for i in range(6):
        eid = f"msg_{i}"
        emails.append({
            "userEmail": test_email,
            "messageId": eid,
            "from": "test@domain.com",
            "subject": f"Subject {i}",
            "body": "Body content",
            "createdAt": "2025-01-01T10:00:00Z"
        })
        # 3 important, 3 not_important
        labels.append({
            "userEmail": test_email,
            "emailId": eid,
            "label": "important" if i < 3 else "not_important",
            "source": "onboarding"
        })
        
    db.emails.insert_many(emails)
    db.emaillabels.insert_many(labels)
    
    yield {"userEmail": test_email, "db": db}
    
    # Teardown
    db.emails.delete_many({"userEmail": test_email})
    db.emaillabels.delete_many({"userEmail": test_email})
    db.usercentroids.delete_many({"userEmail": test_email})
    db.emailfeatures.delete_many({"userEmail": test_email})
    db.users.delete_many({"email": test_email})

def test_relabel_cache_invalidation(setup_db):
    """
    Tests the exact caching edge case requested:
    Label email as important -> compute centroids -> re-label as not_important ->
    assert cache invalidates because labelVersion bumped.
    """
    db = setup_db["db"]
    user_email = setup_db["userEmail"]
    
    # 1. Compute initial centroids (cold start because count < 5 for both classes)
    centroids = get_or_compute_centroids(user_email)
    assert centroids["important"] is None # 3 < 5
    
    # Check cache state
    cache_doc = db.usercentroids.find_one({"userEmail": user_email})
    assert cache_doc is not None
    assert cache_doc["importantCount"] == 3
    assert cache_doc["notImportantCount"] == 3
    assert cache_doc["labelVersion"] == 1
    
    # 2. Re-label one email (important -> not_important). In Node.js, this bumps labelVersion.
    db.emaillabels.update_one(
        {"userEmail": user_email, "emailId": "msg_0"},
        {"$set": {"label": "not_important"}}
    )
    # Simulate the Node.js POST /label route behavior
    db.users.update_one(
        {"email": user_email},
        {"$inc": {"labelVersion": 1}}
    )
    
    # 3. Call get_or_compute_centroids again
    centroids2 = get_or_compute_centroids(user_email)
    
    # Assert cache was invalidated and updated
    cache_doc2 = db.usercentroids.find_one({"userEmail": user_email})
    assert cache_doc2["labelVersion"] == 2
    assert cache_doc2["importantCount"] == 2      # 3 - 1
    assert cache_doc2["notImportantCount"] == 4   # 3 + 1
    
def test_pipeline_schema_mapping(setup_db):
    """
    Tests that the output dict mapped into MongoDB matches the expected camelCase schema exactly.
    """
    db = setup_db["db"]
    user_email = setup_db["userEmail"]
    
    email_ids = ["msg_1", "msg_2"]
    
    features = extract_features_batch(user_email, email_ids)
    
    assert len(features) == 2
    f1 = features[0]
    
    # Check EXACT camelCase keys
    assert "userEmail" in f1
    assert "emailId" in f1
    
    assert "senderFeatures" in f1
    assert "domain" in f1["senderFeatures"]
    assert "historicalCount" in f1["senderFeatures"]
    assert "knownContact" in f1["senderFeatures"]
    
    assert "contentFeatures" in f1
    assert "isDeadline" in f1["contentFeatures"]
    assert "bodyLength" in f1["contentFeatures"]
    
    assert "timeFeatures" in f1
    assert "dayOfWeek" in f1["timeFeatures"]
    assert "isWorkingHours" in f1["timeFeatures"]
    assert "daysUntilDeadline" in f1["timeFeatures"]
    
    assert "embeddingFeatures" in f1
    assert "cosineToImportantCentroid" in f1["embeddingFeatures"]
    assert "cosineToNotImportantCentroid" in f1["embeddingFeatures"]
    
    assert "behavioralFeatures" in f1
    assert "openedSimilarBefore" in f1["behavioralFeatures"]
    
    # Verify it was inserted into MongoDB successfully
    mongo_doc = db.emailfeatures.find_one({"userEmail": user_email, "emailId": "msg_1"})
    assert mongo_doc is not None
    assert mongo_doc["senderFeatures"]["domain"] == "domain.com"
