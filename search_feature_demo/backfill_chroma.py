import os
import sys
import time
import logging

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pymongo import MongoClient
import config as cfg
from retrieval.vector_search import store_email_vector
from embeddings.embedding_service import get_embedding_service

logging.basicConfig(level=logging.INFO)

def run_backfill():
    print("Connecting to MongoDB...")
    client = MongoClient(cfg.MONGO_URI)
    db_name = cfg.resolve_mongo_db_name()
    coll = client[db_name]["emails"]
    
    docs = list(coll.find({}))
    if not docs:
        print("No emails found in MongoDB to backfill.")
        return
        
    print(f"Found {len(docs)} emails in MongoDB.")
    
    print("Loading embedding model (this may take a few seconds)...")
    embedder = get_embedding_service()
    
    print("Backfilling into the new ChromaDB...")
    success_count = 0
    for i, doc in enumerate(docs):
        mid = doc.get("messageId")
        if not mid: continue
        
        user_email = doc.get("userEmail")
        subject = doc.get("subject", "")
        body = doc.get("body", "")
        
        text_to_embed = f"{subject} {body}"
        
        try:
            vector = embedder.embed_query(text_to_embed)
            store_email_vector(
                message_id=mid,
                vector=vector,
                user_email=user_email,
                subject=subject
            )
            success_count += 1
            if success_count % 5 == 0:
                print(f"Processed {success_count}/{len(docs)} emails...")
        except Exception as e:
            print(f"Failed to embed email {mid}: {e}")
            
    print(f"Backfill complete! Successfully embedded and stored {success_count} emails into the new vector database.")

if __name__ == "__main__":
    run_backfill()
