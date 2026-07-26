import os
import sys
import numpy as np
from datetime import datetime
from pymongo import MongoClient, UpdateOne
from typing import List, Dict, Any, Tuple

from .sender_features import extract_sender_features, extract_sender_domain
from .content_features import extract_content_features
from .time_features import extract_time_features
from .behavioral_features import extract_behavioral_features
from .embedding_features import extract_embedding_features

# MongoDB initialization
_client = None
_db = None

def get_db():
    global _client, _db
    if _client is None:
        from dotenv import load_dotenv
        # Try to load backend/.env or python-service/.env
        env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'src', '.env')
        if not os.path.exists(env_path):
            env_path = os.path.join(os.path.dirname(__file__), '..', 'python-service', '.env')
        load_dotenv(env_path)
        
        mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/ai_email_manager")
        _client = MongoClient(mongo_uri)
        _db = _client.get_database()
    return _db

def get_or_compute_centroids(user_email: str) -> Dict[str, list[float]]:
    """
    Implements the Centroid Caching Strategy.
    Checks the user's labelVersion. If it matches the cached labelVersion in usercentroids,
    returns the cached vectors (O(1)).
    Otherwise, re-fetches all labeled emails, computes embeddings, calculates centroids,
    and updates the cache.
    """
    db = get_db()
    
    # 1. Get the current labelVersion from the user document
    user_doc = db.users.find_one({"email": user_email}, {"labelVersion": 1})
    current_version = user_doc.get("labelVersion", 0) if user_doc else 0
    
    # 2. Check cache
    cache_doc = db.usercentroids.find_one({"userEmail": user_email})
    
    if cache_doc and cache_doc.get("labelVersion") == current_version:
        # Cache hit!
        return {
            "important": cache_doc.get("importantCentroid"),
            "not_important": cache_doc.get("notImportantCentroid"),
            "importantCount": cache_doc.get("importantCount", 0),
            "notImportantCount": cache_doc.get("notImportantCount", 0)
        }
        
    # 3. Cache miss or stale: Recompute
    print(f"[feature_pipeline] Recomputing centroids for {user_email} (cache version mismatch/missing)")
    
    # Fetch all labeled emails for this user
    # Join with emails collection to get subject and body
    labels = list(db.emaillabels.aggregate([
        { "$match": { "userEmail": user_email } },
        { "$lookup": {
            "from": "emails",
            "localField": "emailId",
            "foreignField": "messageId",
            "as": "email_details"
        }},
        { "$unwind": "$email_details" },
        { "$project": {
            "label": 1,
            "subject": "$email_details.subject",
            "body": "$email_details.body"
        }}
    ]))
    
    important_texts = []
    not_important_texts = []
    
    for l in labels:
        text = f"{l.get('subject', '')}\n\n{l.get('body', '')[:2000]}"
        if l["label"] == "important":
            important_texts.append(text)
        elif l["label"] == "not_important":
            not_important_texts.append(text)
            
    # Need minimum 5 labels for a centroid to be meaningful (Cold-start guard)
    important_centroid = None
    if len(important_texts) >= 5:
        important_vectors = embed_texts_batch(important_texts)
        if important_vectors:
            important_centroid = np.mean(important_vectors, axis=0).tolist()
            
    not_important_centroid = None
    if len(not_important_texts) >= 5:
        not_important_vectors = embed_texts_batch(not_important_texts)
        if not_important_vectors:
            not_important_centroid = np.mean(not_important_vectors, axis=0).tolist()
            
    # Upsert the cache
    db.usercentroids.update_one(
        {"userEmail": user_email},
        {"$set": {
            "labelVersion": current_version,
            "importantCount": len(important_texts),
            "notImportantCount": len(not_important_texts),
            "importantCentroid": important_centroid,
            "notImportantCentroid": not_important_centroid,
            "updatedAt": datetime.utcnow()
        }},
        upsert=True
    )
    
    return {
        "important": important_centroid,
        "not_important": not_important_centroid,
        "importantCount": len(important_texts),
        "notImportantCount": len(not_important_texts)
    }

def embed_texts_batch(texts: List[str]) -> List[List[float]]:
    try:
        from embeddings.embedding_service import get_embedding_service
        service = get_embedding_service()
        if service:
            return service.embed_documents(texts)
    except Exception as e:
        print(f"Warning: Failed to load embedding service for batch: {e}")
    # Fallback/mock
    return [[0.0] * 1536 for _ in texts]

def _map_to_mongoose_schema(user_email: str, email_id: str, label_id, sender_f, content_f, time_f, embed_f, behavior_f) -> Dict[str, Any]:
    """
    Transforms snake_case python dictionaries to exact camelCase schema.
    """
    return {
        "userEmail": user_email,
        "emailId": email_id,
        "labelId": label_id,
        "senderFeatures": {
            "domain": sender_f["domain"],
            "knownContact": sender_f["known_contact"],
            "historicalCount": sender_f["historical_count"]
        },
        "contentFeatures": {
            "isDeadline": content_f["is_deadline"],
            "isInterview": content_f["is_interview"],
            "isInvoice": content_f["is_invoice"],
            "isOtp": content_f["is_otp"],
            "hasAttachment": content_f["has_attachment"],
            "subjectLength": content_f["subject_length"],
            "bodyLength": content_f["body_length"]
        },
        "timeFeatures": {
            "dayOfWeek": time_f["day_of_week"],
            "isWorkingHours": time_f["is_working_hours"],
            "daysUntilDeadline": time_f["days_until_deadline"]
        },
        "embeddingFeatures": {
            "cosineToImportantCentroid": embed_f["cosine_to_important_centroid"],
            "cosineToNotImportantCentroid": embed_f["cosine_to_not_important_centroid"]
        },
        "behavioralFeatures": {
            "openedSimilarBefore": behavior_f["opened_similar_before"]
        },
        "updatedAt": datetime.utcnow()
    }

def extract_features(user_email: str, email_id: str) -> Dict[str, Any]:
    """
    Extracts features for a single email and saves it to MongoDB.
    """
    db = get_db()
    email_doc = db.emails.find_one({"userEmail": user_email, "messageId": email_id})
    if not email_doc:
        raise ValueError(f"Email {email_id} not found for user {user_email}")
        
    label_doc = db.emaillabels.find_one({"userEmail": user_email, "emailId": email_id})
    label_id = label_doc["_id"] if label_doc else None
    
    # 1. Get Centroids
    centroids = get_or_compute_centroids(user_email)
    
    # 2. Compute historical sender counts (simple aggregate for this specific sender)
    domain = extract_sender_domain(email_doc.get("from", ""))
    count = db.emails.count_documents({"userEmail": user_email, "from": {"$regex": f"@{domain}", "$options": "i"}})
    history_counts = {domain: count}
    
    # 3. Extract features
    sender_f = extract_sender_features(email_doc, history_counts)
    content_f = extract_content_features(email_doc)
    time_f = extract_time_features(email_doc)
    behavior_f = extract_behavioral_features(email_doc)
    embed_f = extract_embedding_features(email_doc, centroids, label=label_doc["label"] if label_doc else None)
    
    # 4. Map to schema
    feature_doc = _map_to_mongoose_schema(user_email, email_id, label_id, sender_f, content_f, time_f, embed_f, behavior_f)
    
    # 5. Upsert
    db.emailfeatures.update_one(
        {"userEmail": user_email, "emailId": email_id},
        {"$set": feature_doc, "$setOnInsert": {"createdAt": datetime.utcnow()}},
        upsert=True
    )
    
    return feature_doc

def extract_features_batch(user_email: str, email_ids: List[str]) -> List[Dict[str, Any]]:
    """
    Extracts features for a batch of emails efficiently.
    """
    db = get_db()
    emails = list(db.emails.find({"userEmail": user_email, "messageId": {"$in": email_ids}}))
    if not emails:
        return []
        
    # Get labels for batch
    labels = list(db.emaillabels.find({"userEmail": user_email, "emailId": {"$in": email_ids}}))
    label_map = {l["emailId"]: l["_id"] for l in labels}
    label_str_map = {l["emailId"]: l["label"] for l in labels}
    
    # 1. Ensure centroids are up to date
    centroids = get_or_compute_centroids(user_email)
    
    # 2. Get history counts for all domains in this batch
    domains = {extract_sender_domain(e.get("from", "")) for e in emails}
    history_counts = {}
    for d in domains:
        history_counts[d] = db.emails.count_documents({"userEmail": user_email, "from": {"$regex": f"@{d}", "$options": "i"}})
        
    feature_docs = []
    ops = []
    
    # 3. Extract in loop (could parallelize embedding later, but since batch embedding exists we can optimize later)
    for email_doc in emails:
        eid = email_doc["messageId"]
        sender_f = extract_sender_features(email_doc, history_counts)
        content_f = extract_content_features(email_doc)
        time_f = extract_time_features(email_doc)
        behavior_f = extract_behavioral_features(email_doc)
        embed_f = extract_embedding_features(email_doc, centroids, label=label_str_map.get(eid))
        
        f_doc = _map_to_mongoose_schema(user_email, eid, label_map.get(eid), sender_f, content_f, time_f, embed_f, behavior_f)
        feature_docs.append(f_doc)
        
        ops.append(UpdateOne(
            {"userEmail": user_email, "emailId": eid},
            {"$set": f_doc, "$setOnInsert": {"createdAt": datetime.utcnow()}},
            upsert=True
        ))
        
    # 4. Bulk write
    if ops:
        db.emailfeatures.bulk_write(ops)
        
    return feature_docs
