import json
from feature_engineering.pipeline import extract_features_batch, get_db

def run_real_data_test():
    db = get_db()
    test_user = "buddhdevdarshan1478@gmail.com"
    
    # Get the sample emails for this user
    labels = list(db.emaillabels.find({"userEmail": test_user}))
    email_ids = [l["emailId"] for l in labels]
    
    if not email_ids:
        print("No labels found for test user.")
        return
        
    print(f"Extracting features for {len(email_ids)} emails...")
    features = extract_features_batch(test_user, email_ids)
    
    print("\nSample Feature Document (Exact Schema Mapping):")
    if features:
        # We pop _id and updatedAt for cleaner JSON printing, or just print as is
        doc = features[0]
        if "_id" in doc:
            doc.pop("_id")
        
        # Convert ObjectId to string for JSON serialization
        if "labelId" in doc and doc["labelId"]:
            doc["labelId"] = str(doc["labelId"])
        if "updatedAt" in doc:
            doc["updatedAt"] = doc["updatedAt"].isoformat()
            
        print(json.dumps(doc, indent=2))
        
if __name__ == "__main__":
    run_real_data_test()
