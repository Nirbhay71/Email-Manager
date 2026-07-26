import pytest
import requests
import os

FLASK_URL = os.environ.get("FLASK_URL", "http://localhost:5000/inbox")

def test_scorer_cold_start():
    # Use a mock email ID or one that we know exists.
    # The system should return "Still learning your preferences" because
    # the user is not calibrated (cold start).
    payload = {
        "userEmail": "buddhdevdarshan1478@gmail.com",
        "emailId": "19f997724f8d6f13" # The one we saw earlier
    }
    
    try:
        response = requests.post(f"{FLASK_URL}/score", json=payload)
        response.raise_for_status()
        data = response.json()
        
        assert "score" in data
        assert "reasons" in data
        assert isinstance(data["reasons"], list)
        
        # We expect cold-start behavior or fallback behavior since global model is absent
        if data.get("fallback"):
            assert data["score"] == 0
            assert "fallback" in data
        elif not data.get("calibrated"):
            assert "Still learning your preferences" in data["reasons"]
            
        print("Scorer test passed. Reasons:", data["reasons"])
    except requests.exceptions.ConnectionError:
        pytest.skip("Flask service is not running")

def test_scorer_invalid_request():
    response = requests.post(f"{FLASK_URL}/score", json={"userEmail": "buddhdevdarshan1478@gmail.com"})
    # Should handle gracefully
    assert response.status_code == 200 or response.status_code == 400
