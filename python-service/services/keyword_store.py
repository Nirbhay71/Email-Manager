import os
import logging
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("KeywordStore")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/ai_email_manager")

client = MongoClient(MONGO_URI)
# Parse DB name from URI or fallback
db_name = MONGO_URI.split("/")[-1].split("?")[0] or "ai_email_manager"
db = client[db_name]
emails_collection = db["emails"]

def search_keyword_store(query_str: str, user_email: str, top_k: int = 5) -> list[dict]:
    """
    Performs MongoDB $text keyword search filtered by userEmail.
    """
    try:
        cursor = emails_collection.find(
            {
                "userEmail": user_email,
                "$text": {"$search": query_str}
            },
            {
                "messageId": 1,
                "subject": 1,
                "score": {"$meta": "textScore"}
            }
        ).sort([("score", {"$meta": "textScore"})]).limit(top_k)

        results = []
        for doc in cursor:
            results.append({
                "message_id": doc.get("messageId"),
                "score": float(doc.get("score", 0.0)),
                "subject": doc.get("subject", "")
            })
        return results
    except Exception as e:
        logger.error(f"MongoDB keyword search error: {e}")
        return []
