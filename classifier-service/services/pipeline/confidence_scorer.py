import os
from abc import ABC, abstractmethod

class ConfidenceScorerStrategy(ABC):
    @abstractmethod
    def evaluate(self, matches: list[dict]) -> tuple[bool, str, float, list[str]]:
        """
        Evaluate classification confidence from retrieved matches.
        Returns:
            is_high_confidence (bool)
            predicted_category (str)
            confidence (float)
            candidate_categories (list[str]) - top 2-3 categories
        """
        pass

class ThresholdDifferenceConfidenceScorer(ConfidenceScorerStrategy):
    def __init__(self, high_threshold: float = None, margin: float = None, dominant_threshold: float = None):
        self.high_threshold = high_threshold or float(os.getenv("FAST_PATH_SIMILARITY", "0.93"))
        self.margin = margin or 0.12
        self.dominant_threshold = dominant_threshold or 0.96

    def evaluate(self, matches: list[dict]) -> tuple[bool, str, float, list[str]]:
        if not matches:
            return False, "Unclassified", 0.0, []

        # 1. Group by category and find maximum similarity score for each category
        cat_scores = {}
        for m in matches:
            cat = m["category"]
            sim = m.get("similarity", 0.0)
            if cat not in cat_scores or sim > cat_scores[cat]:
                cat_scores[cat] = sim

        # 2. Sort by score descending
        sorted_candidates = sorted(cat_scores.items(), key=lambda x: x[1], reverse=True)
        
        # 3. Extract category names for top candidates (keep at most 3)
        candidate_names = [item[0] for item in sorted_candidates[:3]]
        
        if not sorted_candidates:
            return False, "Unclassified", 0.0, []

        top_cat, top_score = sorted_candidates[0]
        
        # 4. Check if top candidate is dominant
        is_high = False
        if top_score >= self.dominant_threshold:
            is_high = True
        elif top_score >= self.high_threshold:
            if len(sorted_candidates) == 1:
                is_high = True
            else:
                second_cat, second_score = sorted_candidates[1]
                if (top_score - second_score) >= self.margin:
                    is_high = True

        return is_high, top_cat, top_score, candidate_names
