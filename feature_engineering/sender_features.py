import re

def extract_sender_domain(from_field: str) -> str:
    if not from_field:
        return "unknown"
    match = re.search(r"@([a-zA-Z0-9.-]+)", from_field)
    return match.group(1).lower() if match else "unknown"

def extract_sender_features(email_doc: dict, history_counts: dict, known_contact_threshold: int = 3) -> dict:
    """
    Extracts sender-related features.
    
    Args:
        email_doc: Raw email document from MongoDB.
        history_counts: Dictionary mapping userEmail to their total historical email counts, 
                        or domain to counts, depending on how it's queried.
                        For sender features, we typically want the count of emails from this specific sender domain.
                        We expect history_counts to be a mapping like: { "domain.com": count }
        known_contact_threshold: Number of previous emails required to be considered a known contact.
    """
    domain = extract_sender_domain(email_doc.get("from", ""))
    historical_count = history_counts.get(domain, 0)
    
    return {
        "domain": domain,
        "historical_count": historical_count,
        "known_contact": historical_count >= known_contact_threshold
    }
