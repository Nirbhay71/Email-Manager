import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__)))
from feature_engineering.pipeline import get_db

def check():
    db = get_db()
    total = db.emaillabels.count_documents({})
    users = db.emaillabels.distinct("userEmail")
    
    print(f"Total Labels: {total}")
    for u in users:
        c = db.emaillabels.count_documents({"userEmail": u})
        print(f"User {u}: {c} labels")
        
if __name__ == "__main__":
    check()
