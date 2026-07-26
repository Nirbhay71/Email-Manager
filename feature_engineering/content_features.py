import re
from typing import Dict, Any

# Default configuration for keyword patterns
DEFAULT_CONTENT_CONFIG = {
    "otp_patterns": [r"\b(otp|verification code|one.time.pass|security code|verify your|2fa)\b"],
    "invoice_patterns": [r"\b(invoice|payment|receipt|billing|amount due|pay now)\b"],
    "deadline_patterns": [r"\b(deadline|due date|due by|last date|expires? on|expir(ing|ation))\b"],
    "interview_patterns": [r"\b(interview|shortlist(ed)?|selection|round [0-9]|coding (test|challenge))\b"],
    "attachment_patterns": [r"\b(attached|attachment|find the document|enclosed)\b"]
}

def _matches_any(text: str, patterns: list[str]) -> bool:
    if not text:
        return False
    for pattern in patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False

def extract_content_features(email_doc: Dict[str, Any], config: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Extracts content-related features using configurable regex patterns.
    
    Args:
        email_doc: Raw email document from MongoDB.
        config: Optional configuration dictionary for keywords. Uses DEFAULT_CONTENT_CONFIG if None.
    """
    if config is None:
        config = DEFAULT_CONTENT_CONFIG
        
    subject = email_doc.get("subject") or ""
    body = email_doc.get("body") or ""
    
    # Cap body scan for performance, similar to Phase 1 sampler
    text_to_scan = f"{subject} {body[:2000]}"
    
    return {
        "is_deadline": _matches_any(text_to_scan, config.get("deadline_patterns", [])),
        "is_interview": _matches_any(text_to_scan, config.get("interview_patterns", [])),
        "is_invoice": _matches_any(text_to_scan, config.get("invoice_patterns", [])),
        "is_otp": _matches_any(text_to_scan, config.get("otp_patterns", [])),
        "has_attachment": _matches_any(text_to_scan, config.get("attachment_patterns", [])),
        "subject_length": len(subject),
        "body_length": len(body)
    }
