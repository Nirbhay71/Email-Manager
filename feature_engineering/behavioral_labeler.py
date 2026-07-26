import os
import sys
from datetime import datetime, timedelta

sys.path.append(os.path.join(os.path.dirname(__file__)))
from feature_engineering.pipeline import get_db

def run_behavioral_labeler(db=None):
    if db is None:
        db = get_db()
        
    print("Running behavioral labeler...")
    
    # 1. Fetch all interactions
    interactions = list(db.emailinteractions.find({}))
    if not interactions:
        print("No interactions to process.")
        return 0
        
    # Group by (userEmail, emailId)
    grouped = {}
    for ev in interactions:
        key = (ev["userEmail"], ev["emailId"])
        if key not in grouped:
            grouped[key] = []
        grouped[key].append(ev)
        
    # 2. Fetch all EXPLICIT onboarding labels
    # We will NEVER overwrite these.
    explicit_labels = list(db.emaillabels.find({"source": "onboarding"}))
    explicit_set = set((l["userEmail"], l["emailId"]) for l in explicit_labels)
    
    new_labels_count = 0
    
    for (u, eid), events in grouped.items():
        if (u, eid) in explicit_set:
            continue # Explicit label takes precedence, do not overwrite
            
        # Sort events by time ascending
        events.sort(key=lambda x: x["timestamp"])
        
        # Heuristics
        label = None
        has_open = any(e["eventType"] == "open" for e in events)
        
        # Check for positive events first (they override negative)
        positive_events = [e for e in events if e["eventType"] in ("reply", "star", "snooze")]
        
        if positive_events:
            label = "important"
        else:
            # Negative: delete or archive without an associated open within N days.
            # In our simplified logic: if there is a delete/archive AND NO open AT ALL, it's negative.
            # If there IS an open, we treat it as neutral because read-then-delete is ambiguous.
            negative_events = [e for e in events if e["eventType"] in ("delete", "archive")]
            if negative_events and not has_open:
                label = "not_important"
                
        if label:
            # Upsert the behavioral label
            res = db.emaillabels.update_one(
                {"userEmail": u, "emailId": eid, "source": "behavioral"},
                {"$set": {
                    "label": label,
                    "createdAt": datetime.utcnow()
                }},
                upsert=True
            )
            if res.upserted_id or res.modified_count > 0:
                new_labels_count += 1
                
    print(f"Behavioral labeler finished. Derived/updated {new_labels_count} behavioral labels.")
    return new_labels_count

if __name__ == "__main__":
    run_behavioral_labeler()
