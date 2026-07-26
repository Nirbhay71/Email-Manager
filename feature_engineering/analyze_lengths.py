import os
import sys
import pandas as pd

sys.path.append(os.path.join(os.path.dirname(__file__)))
from feature_engineering.pipeline import get_db

def main():
    db = get_db()
    
    labels = list(db.emaillabels.find({"source": "onboarding"}))
    labels_dict = {l["emailId"]: l["label"] for l in labels}
    
    emails = list(db.emails.find({"messageId": {"$in": list(labels_dict.keys())}}))
    
    records = []
    for e in emails:
        eid = e["messageId"]
        lbl = labels_dict[eid]
        
        body = e.get("body", "")
        # The content feature logic for length splits by whitespace
        length = len(body.split())
        
        # Real synced emails typically have long hex IDs (like 19f...), synthetic usually have custom prefixes
        is_synthetic = eid.startswith("syn_") or eid.startswith("email_")
        
        records.append({
            "messageId": eid,
            "label": lbl,
            "bodyLength": length,
            "isSynthetic": is_synthetic,
            "user": e.get("userEmail")
        })
        
    df = pd.DataFrame(records)
    
    print("\n--- BODY LENGTH ANALYSIS ---")
    print(df.groupby(["isSynthetic", "label"])["bodyLength"].describe())
    
if __name__ == "__main__":
    main()
