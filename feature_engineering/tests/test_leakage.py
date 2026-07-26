import pytest
import numpy as np

def test_centroid_leakage_prevention():
    """
    Tests that a validation email's features are identical regardless of 
    what labels exist elsewhere in the validation set. This proves no 
    cross-fold information can leak through the centroid.
    """
    # 1. Setup mock data
    # 4 train emails (2 important, 2 not important)
    # 2 validation emails
    emails = [
        {"userEmail": "u1", "messageId": f"t_imp_{i}", "subject": f"Train Imp {i}"} for i in range(1, 6)
    ] + [
        {"userEmail": "u1", "messageId": f"t_not_{i}", "subject": f"Train Not {i}"} for i in range(1, 6)
    ] + [
        {"userEmail": "u1", "messageId": "v_test_1", "subject": "Val Target"},
        {"userEmail": "u1", "messageId": "v_other", "subject": "Val Other"}
    ]
    
    # Base labels (val_other is important)
    labels_base = {
        "v_test_1": {"label": "important"},
        "v_other": {"label": "important"}
    }
    for i in range(1, 6):
        labels_base[f"t_imp_{i}"] = {"label": "important"}
        labels_base[f"t_not_{i}"] = {"label": "not_important"}

    # Alternate labels (val_other is changed to not_important)
    labels_alt = labels_base.copy()
    labels_alt["v_other"] = {"label": "not_important"}
    
    # Dummy mock vectors
    email_vectors = {
        "v_test_1": [0.8, 0.2],
        "v_other": [0.9, 0.1]
    }
    for i in range(1, 6):
        email_vectors[f"t_imp_{i}"] = [1.0, 0.0]
        email_vectors[f"t_not_{i}"] = [0.0, 1.0]
    
    train_indices = list(range(0, 10))
    test_indices = [10, 11]
    
    # Mock DB
    class MockDB:
        class MockEmails:
            def count_documents(self, q): return 1
        emails = MockEmails()
    db = MockDB()
    
    import feature_engineering.train_global as tg
    
    # Scenario A: v_other is labeled 'important'
    df_base = tg.extract_features_offline(db, emails, labels_base, train_indices, test_indices, email_vectors)
    
    # Scenario B: v_other is labeled 'not_important'
    df_alt = tg.extract_features_offline(db, emails, labels_alt, train_indices, test_indices, email_vectors)
    
    # Isolate features for v_test_1 (the target validation email)
    feat_base = df_base[df_base["emailId"] == "v_test_1"].iloc[0]
    feat_alt = df_alt[df_alt["emailId"] == "v_test_1"].iloc[0]
    
    # The cosine similarities should be EXACTLY identical, proving that changing v_other's label 
    # had zero impact on v_test_1's centroids, because centroids were built only on train_indices!
    assert feat_base["cosineToImportantCentroid"] == feat_alt["cosineToImportantCentroid"]
    assert feat_base["cosineToNotImportantCentroid"] == feat_alt["cosineToNotImportantCentroid"]
    assert feat_base["cosineToImportantCentroid"] is not None

