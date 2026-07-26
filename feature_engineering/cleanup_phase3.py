import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__)))
from feature_engineering.pipeline import get_db

def cleanup():
    db = get_db()
    
    # 1. Delete synthetic users' labels and emails
    synthetic_users = ["tech_lover@example.com", "casual_user@example.com"]
    db.emaillabels.delete_many({"userEmail": {"$in": synthetic_users}})
    db.emails.delete_many({"userEmail": {"$in": synthetic_users}})
    db.usercalibrations.delete_many({"userEmail": {"$in": synthetic_users}})
    
    # 2. Delete the 5 "nirma" test emails from the main user
    # From earlier output, the IDs are known or we can just delete where subject is "nirma" or "(No Subject)" with short body
    bad_ids = [
        "19f997724f8d6f13",
        "19f997e3e66234cd",
        "19f997e530a38095",
        "19f997e58e5fe9c1",
        "19f998f9be703121"
    ]
    db.emaillabels.delete_many({"emailId": {"$in": bad_ids}})
    # No need to delete the raw emails themselves from the DB since they are real synced emails, just their labels!
    
    # 3. Purge old OOF predictions
    db.oof_predictions.delete_many({})
    
    print("Cleanup complete. Removed synthetic users and 5 test artifact labels.")

if __name__ == "__main__":
    cleanup()
