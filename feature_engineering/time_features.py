from datetime import datetime
from typing import Dict, Any

def extract_time_features(email_doc: Dict[str, Any], work_hour_start: int = 9, work_hour_end: int = 18) -> Dict[str, Any]:
    """
    Extracts time-related features from the email.
    
    Args:
        email_doc: Raw email document from MongoDB.
        work_hour_start: Start of working hours (0-23).
        work_hour_end: End of working hours (0-23).
    """
    created_at = email_doc.get("createdAt")
    detected_date_str = email_doc.get("detectedDate")
    
    # Defaults
    day_of_week = 0
    is_working_hours = False
    days_until_deadline = None
    
    if created_at:
        # Handle both datetime objects (from pymongo) and ISO strings
        if isinstance(created_at, str):
            try:
                # Handle ISO 8601 strings
                created_dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            except ValueError:
                created_dt = datetime.utcnow()
        else:
            created_dt = created_at
            
        # 0 = Monday, 6 = Sunday. We align to 0=Sun, 6=Sat if desired, 
        # but Python's isoweekday() is 1=Mon, 7=Sun. Let's map to 0-6 where 0=Monday for simplicity.
        day_of_week = created_dt.weekday() 
        is_working_hours = (work_hour_start <= created_dt.hour < work_hour_end)
        
        if detected_date_str:
            try:
                # detectedDate might be ISO string
                detected_dt = datetime.fromisoformat(detected_date_str.replace('Z', '+00:00'))
                delta = detected_dt - created_dt
                days_until_deadline = max(0, delta.days) # Cap at 0 if deadline is in the past
            except (ValueError, TypeError):
                days_until_deadline = None
                
    return {
        "day_of_week": day_of_week,
        "is_working_hours": is_working_hours,
        "days_until_deadline": days_until_deadline
    }
