import os
import sys
import pandas as pd
from datetime import datetime
from sklearn.linear_model import LogisticRegression

sys.path.append(os.path.join(os.path.dirname(__file__)))
from feature_engineering.pipeline import get_db

def run_calibration(target_user=None):
    db = get_db()
    
    # 1. Fetch OOF predictions
    oof_cursor = db.oof_predictions.find({})
    oof_data = list(oof_cursor)
    if not oof_data:
        print("No OOF predictions found for calibration.")
        return
        
    df = pd.DataFrame(oof_data)
    
    # 2. Group by user
    users = df["userEmail"].unique()
    
    if target_user:
        if target_user not in users:
            print(f"User {target_user} not found in OOF data.")
            return
        users = [target_user]
    
    calibrated_users = 0
    ops = []
    
    for u in users:
        user_df = df[df["userEmail"] == u]
        # Must have at least 20 labels and ideally both classes represented
        if len(user_df) >= 20 and len(user_df["label"].unique()) > 1:
            X = user_df[["raw_score"]]
            y = user_df["label"]
            
            lr = LogisticRegression(class_weight='balanced')
            lr.fit(X, y)
            
            slope = float(lr.coef_[0][0])
            intercept = float(lr.intercept_[0])
            
            ops.append({
                "userEmail": u,
                "slope": slope,
                "intercept": intercept,
                "updatedAt": datetime.utcnow()
            })
            calibrated_users += 1
        else:
            print(f"User {u} skipped (labels: {len(user_df)}, classes: {len(user_df['label'].unique())}). Threshold is 20.")
            
    # Save to MongoDB
    for op in ops:
        db.usercalibrations.update_one(
            {"userEmail": op["userEmail"]},
            {"$set": {
                "slope": op["slope"],
                "intercept": op["intercept"],
                "updatedAt": op["updatedAt"]
            }},
            upsert=True
        )
        
    print(f"Calibration completed. {calibrated_users}/{len(users)} users calibrated.")

if __name__ == "__main__":
    run_calibration()
