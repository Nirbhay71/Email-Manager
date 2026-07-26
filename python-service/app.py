import os
import sys
import pandas as pd
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
import logging

# Ensure we can import feature_engineering
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from feature_engineering.pipeline import extract_features, get_db
from feature_engineering.scheduler import orchestration_job

app = Flask(__name__)
CORS(app)

# --- Scheduler Setup ---
if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
    scheduler = BackgroundScheduler()
    # Run daily at 2am
    scheduler.add_job(func=orchestration_job, trigger="cron", hour=2, minute=0)
    scheduler.start()
    print("APScheduler started (guarded against double-fire).")

# Enable verbose logging for debugging
logging.basicConfig(level=logging.DEBUG)

model_path = os.path.join(os.path.dirname(__file__), "..", "feature_engineering", "global_model.pkl")
try:
    model = joblib.load(model_path)
    print("Loaded LightGBM model successfully.")
except Exception as e:
    print(f"Failed to load model: {e}")
    model = None

@app.route("/score", methods=["POST"])
def score_email():
    if model is None:
        return jsonify({
            "score": 0,
            "calibrated": False,
            "prediction": "not_important",
            "reasons": ["Still learning your preferences"],
            "features_extracted": {}
        })
        
    data = request.json
    if not data or "userEmail" not in data or "emailId" not in data:
        return jsonify({"error": "Missing userEmail or emailId"}), 400
        
    user_email = data["userEmail"]
    email_id = data["emailId"]
    
    try:
        # Extract features (this handles the full pipeline including centroids)
        # Note: If no labels exist yet, cosine similarities will be None.
        f = extract_features(user_email, email_id)
        
        # Transform exactly like training
        row = {
            "domain": f["senderFeatures"]["domain"],
            "knownContact": 1 if f["senderFeatures"]["knownContact"] else 0,
            "historicalCount": f["senderFeatures"]["historicalCount"],
            
            "isDeadline": 1 if f["contentFeatures"]["isDeadline"] else 0,
            "isInterview": 1 if f["contentFeatures"]["isInterview"] else 0,
            "isInvoice": 1 if f["contentFeatures"]["isInvoice"] else 0,
            "isOtp": 1 if f["contentFeatures"]["isOtp"] else 0,
            "hasAttachment": 1 if f["contentFeatures"]["hasAttachment"] else 0,
            "subjectLength": f["contentFeatures"]["subjectLength"],
            "bodyLength": f["contentFeatures"]["bodyLength"],
            
            "dayOfWeek": f["timeFeatures"]["dayOfWeek"],
            "isWorkingHours": 1 if f["timeFeatures"]["isWorkingHours"] else 0,
            "daysUntilDeadline": f["timeFeatures"]["daysUntilDeadline"],
            
            "cosineToImportantCentroid": f["embeddingFeatures"]["cosineToImportantCentroid"],
            "cosineToNotImportantCentroid": f["embeddingFeatures"]["cosineToNotImportantCentroid"],
        }
        
        df = pd.DataFrame([row])
        
        # Categoricals
        cat_cols = ["domain", "dayOfWeek"]
        for c in cat_cols:
            df[c] = df[c].astype('category')
            
        # Numerics coercion
        num_cols = [c for c in df.columns if c not in cat_cols]
        for c in num_cols:
            df[c] = pd.to_numeric(df[c], errors='coerce')
            
        prob = model.predict_proba(df)[0][1]
        pred = model.predict(df)[0]
        
        # Clean up ObjectIds for JSON serialization
        if "_id" in f:
            del f["_id"]
        if "labelId" in f and hasattr(f["labelId"], "__str__"):
            f["labelId"] = str(f["labelId"])
            
        # ---------------------------------------------
        # Calibration Layer (Platt Scaling)
        # ---------------------------------------------
        db = get_db()
        cal = db.usercalibrations.find_one({"userEmail": user_email})
        
        is_calibrated = False
        final_score = float(prob)
        
        if cal:
            import math
            slope = cal.get("slope", 1.0)
            intercept = cal.get("intercept", 0.0)
            
            z = slope * final_score + intercept
            final_score = 1.0 / (1.0 + math.exp(-z))
            is_calibrated = True

        # ---------------------------------------------
        # Feature Attribution (Explainability)
        # ---------------------------------------------
        reasons = []
        if is_calibrated:
            try:
                import sys
                import os
                sys.path.append(os.path.join(os.path.dirname(__file__), "..", "feature_engineering"))
                from explanation_labels import EXPLANATION_LABELS
                
                # Get the underlying booster to compute SHAP / pred_contrib
                if hasattr(model, "booster_"):
                    booster = model.booster_
                    # df must be passed exactly as features
                    contribs = booster.predict(df, pred_contrib=True)[0]
                    # The last element is the base expected value
                    feature_contribs = contribs[:-1]
                    feature_names = booster.feature_name()
                    
                    # We want features that positively pushed the score towards "important"
                    # Combine feature names with their contributions
                    fc_pairs = [(feature_names[i], feature_contribs[i]) for i in range(len(feature_names))]
                    
                    # Sort by contribution descending
                    fc_pairs.sort(key=lambda x: x[1], reverse=True)
                    
                    # Pick top 2-3 positive contributors
                    for fname, fval in fc_pairs:
                        if fval > 0.05 and fname in EXPLANATION_LABELS:  # small threshold to avoid noise
                            reasons.append(EXPLANATION_LABELS[fname])
                        if len(reasons) >= 3:
                            break
                            
                # Fallback if no specific positive features jump out
                if not reasons:
                    reasons.append("Matches patterns of important emails")
            except Exception as ex:
                print(f"Explainability Error: {ex}")
        else:
            reasons = ["Still learning your preferences"]
            
        return jsonify({
            "score": final_score,
            "prediction": "important" if final_score > 0.5 else "not_important",
            "calibrated": is_calibrated,
            "raw_global_score": float(prob),
            "reasons": reasons,
            "features_extracted": f
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
