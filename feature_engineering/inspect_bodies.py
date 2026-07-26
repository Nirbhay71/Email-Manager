import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__)))
from feature_engineering.pipeline import get_db

def inspect():
    db = get_db()
    
    # Get labels for real user
    labels = list(db.emaillabels.find({
        "userEmail": "buddhdevdarshan1478@gmail.com", 
        "label": "important",
        "source": "onboarding"
    }))
    
    if not labels:
        print("No important labels found for user.")
        return
        
    eids = [l["emailId"] for l in labels]
    emails = list(db.emails.find({"messageId": {"$in": eids}}))
    
    for i, e in enumerate(emails):
        print(f"--- Email {i+1} ---")
        print(f"Message ID: {e.get('messageId')}")
        print(f"Subject: {e.get('subject')}")
        body = e.get("body", "")
        print(f"Body Length (chars): {len(body)}")
        print(f"Body Length (words): {len(body.split())}")
        print(f"Body snippet (first 200 chars): {repr(body[:200])}")
        print(f"Raw Body: {repr(body)}")
        print("\n")

if __name__ == "__main__":
    inspect()
