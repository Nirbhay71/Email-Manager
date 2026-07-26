import os
import sys
import pytest
from datetime import datetime
from mongomock import MongoClient

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from feature_engineering.behavioral_labeler import run_behavioral_labeler

@pytest.fixture
def mock_db():
    client = MongoClient()
    return client.test_db

def test_explicit_labels_never_overwritten(mock_db):
    mock_db.emaillabels.insert_one({
        "userEmail": "test@test.com",
        "emailId": "msg1",
        "label": "not_important",
        "source": "onboarding"
    })
    
    # User replies to msg1 (which would normally yield "important")
    mock_db.emailinteractions.insert_one({
        "userEmail": "test@test.com",
        "emailId": "msg1",
        "eventType": "reply",
        "timestamp": datetime.utcnow()
    })
    
    run_behavioral_labeler(mock_db)
    
    # Assert it was NOT overwritten
    labels = list(mock_db.emaillabels.find({"userEmail": "test@test.com", "emailId": "msg1"}))
    assert len(labels) == 1
    assert labels[0]["label"] == "not_important"
    assert labels[0]["source"] == "onboarding"

def test_heuristics_positive(mock_db):
    mock_db.emailinteractions.insert_one({
        "userEmail": "test@test.com",
        "emailId": "msg2",
        "eventType": "star",
        "timestamp": datetime.utcnow()
    })
    
    run_behavioral_labeler(mock_db)
    labels = list(mock_db.emaillabels.find({"emailId": "msg2"}))
    assert len(labels) == 1
    assert labels[0]["label"] == "important"
    assert labels[0]["source"] == "behavioral"

def test_heuristics_negative_no_open(mock_db):
    mock_db.emailinteractions.insert_one({
        "userEmail": "test@test.com",
        "emailId": "msg3",
        "eventType": "delete",
        "timestamp": datetime.utcnow()
    })
    
    run_behavioral_labeler(mock_db)
    labels = list(mock_db.emaillabels.find({"emailId": "msg3"}))
    assert len(labels) == 1
    assert labels[0]["label"] == "not_important"

def test_heuristics_neutral_after_open(mock_db):
    mock_db.emailinteractions.insert_many([
        {
            "userEmail": "test@test.com",
            "emailId": "msg4",
            "eventType": "open",
            "timestamp": datetime.utcnow()
        },
        {
            "userEmail": "test@test.com",
            "emailId": "msg4",
            "eventType": "archive",
            "timestamp": datetime.utcnow()
        }
    ])
    
    run_behavioral_labeler(mock_db)
    labels = list(mock_db.emaillabels.find({"emailId": "msg4"}))
    assert len(labels) == 0 # No label derived because it's neutral

def test_heuristics_neutral_bare_open(mock_db):
    mock_db.emailinteractions.insert_one({
        "userEmail": "test@test.com",
        "emailId": "msg5",
        "eventType": "open",
        "timestamp": datetime.utcnow()
    })
    
    run_behavioral_labeler(mock_db)
    labels = list(mock_db.emaillabels.find({"emailId": "msg5"}))
    assert len(labels) == 0 # Bare open is neutral
