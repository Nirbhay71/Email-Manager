import os
import sys
import unittest
from datetime import datetime

sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))
from feature_engineering.pipeline import get_db
from feature_engineering.scheduler import orchestration_job

class TestPhase4Integration(unittest.TestCase):
    def setUp(self):
        self.db = get_db()
        self.user_email = "phase4_test@example.com"
        
        # Clean up
        self.db.emailinteractions.delete_many({"userEmail": self.user_email})
        self.db.emaillabels.delete_many({"userEmail": self.user_email})
        self.db.emails.delete_many({"userEmail": self.user_email})
        
    def test_behavioral_pipeline_integration(self):
        # 1. Insert a mock email
        self.db.emails.insert_one({
            "messageId": "p4_msg1",
            "userEmail": self.user_email,
            "subject": "Behavioral test",
            "from": "behavioral@test.com",
            "body": "Test body",
            "date": datetime.utcnow().isoformat(),
            "snippet": "Test snippet"
        })
        
        # 2. Insert an interaction (star -> positive)
        self.db.emailinteractions.insert_one({
            "userEmail": self.user_email,
            "emailId": "p4_msg1",
            "eventType": "star",
            "timestamp": datetime.utcnow()
        })
        
        # 3. Run orchestration (simulating the scheduler)
        # We will override THRESHOLDS temporarily or just call run_behavioral_labeler directly?
        # Let's call the orchestration job. By default, it might not trigger retrain if volume is too low,
        # but we can verify the behavioral label is created.
        import feature_engineering.scheduler as sched
        
        # Force the orchestration job to think volume threshold is met for test
        old_threshold = sched.THRESHOLD_NEW_LABELS
        sched.THRESHOLD_NEW_LABELS = 0 
        
        try:
            sched.orchestration_job()
            
            # 4. Verify behavioral label was created
            labels = list(self.db.emaillabels.find({"userEmail": self.user_email}))
            self.assertEqual(len(labels), 1)
            self.assertEqual(labels[0]["label"], "important")
            self.assertEqual(labels[0]["source"], "behavioral")
            
            # Since THRESHOLD_NEW_LABELS = 0, it should have triggered retrain.
            # We can verify retraining ran by checking the retraining_logs
            log = self.db.retraining_logs.find_one(sort=[("timestamp", -1)])
            self.assertIsNotNone(log)
            self.assertIn("Volume threshold reached", log["triggerReason"])
            
        finally:
            sched.THRESHOLD_NEW_LABELS = old_threshold
            # Clean up
            self.db.emailinteractions.delete_many({"userEmail": self.user_email})
            self.db.emaillabels.delete_many({"userEmail": self.user_email})
            self.db.emails.delete_many({"userEmail": self.user_email})

if __name__ == "__main__":
    unittest.main()
