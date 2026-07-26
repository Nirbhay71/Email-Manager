from datetime import datetime, timedelta
from pymongo import MongoClient
import sys
import os

# Ensure we can import the pipeline
sys.path.append(os.path.join(os.path.dirname(__file__)))
from feature_engineering.pipeline import extract_features_batch

db = MongoClient('mongodb://localhost:27017/ai_email_manager').get_database()

users = ["tech_lover@example.com", "casual_user@example.com"]

# Clear old data for these users
for u in users:
    db.emails.delete_many({"userEmail": u})
    db.emaillabels.delete_many({"userEmail": u})
    db.emailfeatures.delete_many({"userEmail": u})
    db.usercentroids.delete_many({"userEmail": u})
    db.users.update_one({"email": u}, {"$set": {"labelVersion": 1}}, upsert=True)

# Generate synthetic emails
now = datetime.utcnow()

synthetic_data = [
    # User A: Tech lover
    (users[0], "github@github.com", "PR #123 merged", "Your PR has been merged into main.", "important"),
    (users[0], "aws@amazon.com", "AWS Billing", "Your monthly invoice is $12.50", "important"),
    (users[0], "newsletter@marketing.com", "Buy our stuff", "Discount code for 50%", "not_important"),
    (users[0], "noreply@spam.com", "You won a prize", "Click here to claim", "not_important"),
    (users[0], "alerts@datadog.com", "Monitor triggered", "CPU > 90%", "important"),
    (users[0], "info@random.com", "Weekly update", "Here is what happened this week", "not_important"),
    (users[0], "security@github.com", "New login", "Login from unknown device", "important"),
    (users[0], "sales@spam.com", "Last chance", "Sale ends today", "not_important"),
    (users[0], "friend@gmail.com", "Lunch?", "Want to grab lunch?", "not_important"), # tech user ignores friend lol
    (users[0], "jira@atlassian.com", "Ticket updated", "Ticket PROJ-123 transitioned to done", "important"),
    
    # User B: Casual user
    (users[1], "github@github.com", "PR #123 merged", "Your PR has been merged into main.", "not_important"),
    (users[1], "aws@amazon.com", "AWS Billing", "Your monthly invoice is $12.50", "not_important"),
    (users[1], "friend@gmail.com", "Lunch?", "Want to grab lunch?", "important"),
    (users[1], "mom@yahoo.com", "Call me", "Please call me when you have time", "important"),
    (users[1], "newsletter@marketing.com", "Buy our stuff", "Discount code for 50%", "important"), # likes shopping
    (users[1], "bank@chase.com", "Statement ready", "Your statement is ready", "important"),
    (users[1], "noreply@spam.com", "You won a prize", "Click here to claim", "not_important"),
    (users[1], "school@university.edu", "Deadline approaching", "Submit your assignment", "important"),
    (users[1], "jira@atlassian.com", "Ticket updated", "Ticket PROJ-123 transitioned to done", "not_important"),
    (users[1], "doctor@clinic.com", "Appointment", "Your appointment is tomorrow", "important")
]

emails = []
labels = []
for i, (user, sender, subject, body, label) in enumerate(synthetic_data):
    eid = f"syn_p3_{i}"
    emails.append({
        "userEmail": user,
        "messageId": eid,
        "from": sender,
        "to": user,
        "subject": subject,
        "body": body,
        "createdAt": now - timedelta(hours=i),
        "detectedDate": now - timedelta(hours=i) if "Deadline" in subject else None
    })
    labels.append({
        "userEmail": user,
        "emailId": eid,
        "label": label,
        "source": "onboarding"
    })

db.emails.insert_many(emails)
db.emaillabels.insert_many(labels)

print(f"Seeded {len(emails)} emails and labels across {len(users)} users.")

# Extract features so they are ready for training
for u in users:
    eids = [e["messageId"] for e in emails if e["userEmail"] == u]
    print(f"Extracting features for {u} ({len(eids)} items)...")
    extract_features_batch(u, eids)
print("Done seeding and extracting.")
