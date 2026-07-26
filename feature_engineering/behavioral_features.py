from typing import Dict, Any

def extract_behavioral_features(email_doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extracts behavioral features (e.g., user interaction history).
    
    Note: Phase 4 will populate real behavioral data. For now, this returns 
    explicit placeholder/null values so the schema and downstream code 
    account for these fields without needing a rewrite later.
    """
    return {
        # Phase 4 placeholder: indicates if a similar email was opened previously
        "opened_similar_before": None
    }
