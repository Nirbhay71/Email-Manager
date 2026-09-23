import os
import logging
from pymongo import MongoClient

logger = logging.getLogger("DBService")

_mongo_client = None

def get_db():
    global _mongo_client
    if _mongo_client is None:
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/test")
        _mongo_client = MongoClient(mongo_uri)
    
    db_name = "test"
    uri = os.getenv("MONGO_URI", "")
    if uri:
        # Strip query parameters
        path_part = uri.split("?")[0]
        parts = path_part.split("/")
        if len(parts) > 3 and parts[-1]:
            db_name = parts[-1]
    return _mongo_client[db_name]

def get_categories_col():
    return get_db()["categories"]

def get_emails_col():
    return get_db()["emails"]

def get_category(user_email: str, category_name: str) -> dict:
    col = get_categories_col()
    return col.find_one({"userEmail": user_email, "name": category_name})

def add_to_pending_queue(user_email: str, category_name: str, email_id: str) -> None:
    col = get_categories_col()
    
    # Check if category exists. If not, upsert it.
    cat = get_category(user_email, category_name)
    if not cat:
        logger.info(f"Category {category_name} not found in DB for {user_email}. Creating it.")
        col.update_one(
            {"userEmail": user_email, "name": category_name},
            {"$setOnInsert": {
                "summary": "",
                "pendingCount": 0,
                "pendingEmailIds": [],
                "summaryNeedsUpdate": False
            }},
            upsert=True
        )

    # Now add email to pending queue
    col.update_one(
        {"userEmail": user_email, "name": category_name},
        {
            "$addToSet": {"pendingEmailIds": email_id},
            "$inc": {"pendingCount": 1}
        }
    )
    
    # Refetch and check count
    updated = col.find_one({"userEmail": user_email, "name": category_name})
    if updated and updated.get("pendingCount", 0) >= 10:
        col.update_one(
            {"userEmail": user_email, "name": category_name},
            {"$set": {"summaryNeedsUpdate": True}}
        )
        logger.info(f"Category {category_name} marked as needing summary update (pendingCount: {updated.get('pendingCount')})")

def mark_summary_dirty(user_email: str, category_name: str) -> None:
    col = get_categories_col()
    col.update_one(
        {"userEmail": user_email, "name": category_name},
        {"$set": {"summaryNeedsUpdate": True}}
    )
    logger.info(f"Category {category_name} summary marked dirty.")

def update_category_summary(user_email: str, category_name: str, summary: str) -> None:
    col = get_categories_col()
    col.update_one(
        {"userEmail": user_email, "name": category_name},
        {
            "$set": {
                "summary": summary,
                "pendingCount": 0,
                "pendingEmailIds": [],
                "summaryNeedsUpdate": False
            }
        }
    )
    logger.info(f"Category {category_name} summary updated.")

def get_emails_by_ids(email_ids: list[str]) -> list[dict]:
    col = get_emails_col()
    cursor = col.find({"messageId": {"$in": email_ids}})
    return list(cursor)

def update_email_category(user_email: str, email_id: str, category_name: str) -> None:
    col = get_emails_col()
    col.update_one(
        {"userEmail": user_email, "messageId": email_id},
        {"$set": {"category": category_name}}
    )
