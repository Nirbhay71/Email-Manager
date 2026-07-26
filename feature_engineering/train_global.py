import os
import sys
import numpy as np
import pandas as pd
import lightgbm as lgb
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, accuracy_score
import joblib

sys.path.append(os.path.join(os.path.dirname(__file__)))
from feature_engineering.pipeline import get_db
from feature_engineering.sender_features import extract_sender_features, extract_sender_domain
from feature_engineering.content_features import extract_content_features
from feature_engineering.time_features import extract_time_features
from feature_engineering.embedding_features import extract_embedding_features

def get_vectors_for_emails(db, emails):
    """Batch embed all texts to save time during CV"""
    texts = [f"{e.get('subject', '')}\n\n{e.get('body', '')[:2000]}" for e in emails]
    
    try:
        from embeddings.embedding_service import get_embedding_service
        service = get_embedding_service()
        if service:
            return service.embed_documents(texts)
    except Exception as e:
        pass
    return [[0.0]*1536 for _ in texts]

def compute_centroids_from_subset(user_email, subset_emails, subset_labels, email_vectors):
    """Computes centroids exactly like cache, but strictly on the provided subset."""
    imp_vecs = []
    not_imp_vecs = []
    
    for i, e in enumerate(subset_emails):
        if e["userEmail"] != user_email: continue
        eid = e["messageId"]
        if eid not in subset_labels: continue
        
        lbl_data = subset_labels[eid]
        lbl = lbl_data.get("label") if isinstance(lbl_data, dict) else lbl_data
        
        if lbl == "important":
            imp_vecs.append(email_vectors[e["messageId"]])
        elif lbl == "not_important":
            not_imp_vecs.append(email_vectors[e["messageId"]])
            
    res = {
        "importantCount": len(imp_vecs),
        "notImportantCount": len(not_imp_vecs),
        "important": np.mean(imp_vecs, axis=0).tolist() if len(imp_vecs) >= 5 else None,
        "not_important": np.mean(not_imp_vecs, axis=0).tolist() if len(not_imp_vecs) >= 5 else None
    }
    return res

def extract_features_offline(db, emails, labels_dict, train_indices, test_indices, email_vectors):
    """Extracts features explicitly preventing test leakage into centroids."""
    # Split data
    train_emails = [emails[i] for i in train_indices]
    
    # Compute centroids PER USER strictly on train_emails
    users = set(e["userEmail"] for e in emails)
    user_centroids = {}
    for u in users:
        user_centroids[u] = compute_centroids_from_subset(u, train_emails, labels_dict, email_vectors)
        
    rows = []
    for idx, is_train in zip(list(train_indices) + list(test_indices), [True]*len(train_indices) + [False]*len(test_indices)):
        e = emails[idx]
        u = e["userEmail"]
        eid = e["messageId"]
        
        lbl_data = labels_dict.get(eid, {})
        lbl = lbl_data.get("label")
        source = lbl_data.get("source", "behavioral")
        
        domain = extract_sender_domain(e.get("from", ""))
        
        # Strictly fold-aware: Count only emails visible in the train_emails set
        count = 0
        for tr_e in train_emails:
            if tr_e.get("userEmail") == u:
                tr_domain = extract_sender_domain(tr_e.get("from", ""))
                if tr_domain == domain:
                    count += 1
        history_counts = {domain: count}
        
        sf = extract_sender_features(e, history_counts)
        cf = extract_content_features(e)
        tf = extract_time_features(e)
        
        label_for_loo = lbl if is_train else None
        
        vec = email_vectors[eid]
        c = user_centroids[u]
        
        important_centroid = c.get("important")
        not_important_centroid = c.get("not_important")
        imp_cnt = c.get("importantCount", 0)
        not_imp_cnt = c.get("notImportantCount", 0)
        
        if label_for_loo == "important" and important_centroid and imp_cnt > 1:
            C = np.array(important_centroid)
            V = np.array(vec)
            important_centroid = ((C * imp_cnt - V) / (imp_cnt - 1)).tolist()
        elif label_for_loo == "not_important" and not_important_centroid and not_imp_cnt > 1:
            C = np.array(not_important_centroid)
            V = np.array(vec)
            not_important_centroid = ((C * not_imp_cnt - V) / (not_imp_cnt - 1)).tolist()
            
        def cos_sim(v1, v2):
            if not v1 or not v2: return None
            a, b = np.array(v1), np.array(v2)
            n1, n2 = np.linalg.norm(a), np.linalg.norm(b)
            if n1==0 or n2==0: return 0.0
            return float(np.dot(a, b)/(n1*n2))
            
        ef = {
            "cosineToImportantCentroid": cos_sim(vec, important_centroid),
            "cosineToNotImportantCentroid": cos_sim(vec, not_important_centroid)
        }
        
        rows.append({
            "emailId": eid,
            "userEmail": u,
            "is_train": is_train,
            "source": source,
            "domain": sf["domain"],
            "knownContact": 1 if sf["known_contact"] else 0,
            "historicalCount": sf["historical_count"],
            "isDeadline": 1 if cf["is_deadline"] else 0,
            "isInterview": 1 if cf["is_interview"] else 0,
            "isInvoice": 1 if cf["is_invoice"] else 0,
            "isOtp": 1 if cf["is_otp"] else 0,
            "hasAttachment": 1 if cf["has_attachment"] else 0,
            "subjectLength": cf["subject_length"],
            "bodyLength": cf["body_length"],
            "dayOfWeek": tf["day_of_week"],
            "isWorkingHours": 1 if tf["is_working_hours"] else 0,
            "daysUntilDeadline": tf["days_until_deadline"],
            "cosineToImportantCentroid": ef["cosineToImportantCentroid"],
            "cosineToNotImportantCentroid": ef["cosineToNotImportantCentroid"],
            "label": 1 if lbl == "important" else 0
        })
        
    df = pd.DataFrame(rows)
    cat_cols = ["domain", "dayOfWeek"]
    for c in cat_cols: df[c] = df[c].astype('category')
    num_cols = [c for c in df.columns if c not in cat_cols + ["emailId", "userEmail", "label", "source", "is_train"]]
    for c in num_cols: df[c] = pd.to_numeric(df[c], errors='coerce')
    
    return df

def train():
    db = get_db()
    # Fetch all labels, both onboarding and behavioral
    labels = list(db.emaillabels.find({"source": {"$in": ["onboarding", "behavioral"]}}))
    if not labels:
        print("No labels found.")
        return
        
    labels_dict = {l["emailId"]: {"label": l["label"], "source": l.get("source", "behavioral")} for l in labels}
    eids = list(labels_dict.keys())
    emails = list(db.emails.find({"messageId": {"$in": eids}}))
    
    # Pre-embed all
    print("Pre-embedding all emails...")
    vecs = get_vectors_for_emails(db, emails)
    email_vectors = {e["messageId"]: v for e, v in zip(emails, vecs)}
    
    # 5-Fold Stratified CV to get clean OOF predictions for calibration
    X_dummy = np.zeros(len(emails))
    y_dummy = [1 if labels_dict[e["messageId"]] == "important" else 0 for e in emails]
    
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    oof_preds = []
    all_y_true = []
    all_y_prob = []
    all_y_pred = []
    importances_list = []
    
    fold = 1
    for train_idx, test_idx in skf.split(X_dummy, y_dummy):
        print(f"--- Fold {fold} ---")
        df = extract_features_offline(db, emails, labels_dict, train_idx, test_idx, email_vectors)
        
        train_df = df[df["is_train"] == True]
        test_df = df[df["is_train"] == False]
        
        drop_cols = ["emailId", "userEmail", "label", "source", "is_train"]
        X_train = train_df.drop(columns=drop_cols)
        y_train = train_df["label"]
        w_train = train_df["source"].apply(lambda s: 1.0 if s == "onboarding" else 0.5)
        
        X_test = test_df.drop(columns=drop_cols)
        y_test = test_df["label"]
        
        neg_count = sum(y_train == 0)
        pos_count = sum(y_train == 1)
        scale_weight = neg_count / pos_count if pos_count > 0 else 1.0
        
        model = lgb.LGBMClassifier(n_estimators=50, learning_rate=0.1, scale_pos_weight=scale_weight, random_state=42, verbosity=-1)
        model.fit(X_train, y_train, sample_weight=w_train, categorical_feature=["domain", "dayOfWeek"])
        
        probs = model.predict_proba(X_test)[:, 1] if len(model.classes_) > 1 else np.zeros(len(X_test))
        preds = model.predict(X_test)
        
        all_y_true.extend(y_test)
        all_y_prob.extend(probs)
        all_y_pred.extend(preds)
        
        # Accumulate importances
        if hasattr(model, 'feature_importances_'):
            importances_list.append(model.feature_importances_)
            
        # Save OOF for calibration
        for e_id, prob, u, lbl in zip(test_df["emailId"], probs, test_df["userEmail"], test_df["label"]):
            oof_preds.append({"emailId": e_id, "userEmail": u, "raw_score": float(prob), "label": int(lbl)})
            
        fold += 1
        
    print("\n--- OOF Validation Metrics (Honest, Un-leaked) ---")
    acc = accuracy_score(all_y_true, all_y_pred)
    prec = precision_score(all_y_true, all_y_pred, zero_division=0)
    rec = recall_score(all_y_true, all_y_pred, zero_division=0)
    f1 = f1_score(all_y_true, all_y_pred, zero_division=0)
    try: auc = roc_auc_score(all_y_true, all_y_prob)
    except: auc = float('nan')
    print(f"Accuracy : {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall   : {rec:.4f}")
    print(f"F1-Score : {f1:.4f}")
    print(f"ROC-AUC  : {auc:.4f}")
    
    if importances_list:
        avg_imp = np.mean(importances_list, axis=0)
        features = X_train.columns
        df_imp = pd.DataFrame({"Feature": features, "Importance": avg_imp})
        df_imp = df_imp.sort_values("Importance", ascending=False)
        print("\n--- Un-leaked Feature Importances (Averaged across 5 Folds) ---")
        print(df_imp.to_string(index=False))
    
    # Save OOF preds to MongoDB
    db.oof_predictions.delete_many({})
    if oof_preds:
        db.oof_predictions.insert_many(oof_preds)
    
    # Finally, train global model on 100% of data (centroids built on 100%)
    print("\nTraining final production global model on 100% of data...")
    train_idx = np.arange(len(emails))
    df_full = extract_features_offline(db, emails, labels_dict, train_idx, [], email_vectors)
    
    drop_cols = ["emailId", "userEmail", "label", "source", "is_train"]
    X_full = df_full.drop(columns=drop_cols)
    y_full = df_full["label"]
    w_full = df_full["source"].apply(lambda s: 1.0 if s == "onboarding" else 0.5)
    
    scale_weight = sum(y_full == 0) / sum(y_full == 1) if sum(y_full == 1) > 0 else 1.0
    final_model = lgb.LGBMClassifier(n_estimators=50, learning_rate=0.1, scale_pos_weight=scale_weight, random_state=42, verbosity=-1)
    final_model.fit(X_full, y_full, sample_weight=w_full, categorical_feature=["domain", "dayOfWeek"])
    
    model_path = os.path.join(os.path.dirname(__file__), "global_model.pkl")
    joblib.dump(final_model, model_path)
    print(f"Production model saved to {model_path}")

if __name__ == "__main__":
    train()
