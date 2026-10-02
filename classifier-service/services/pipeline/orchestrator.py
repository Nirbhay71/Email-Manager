import os
import logging
from services.pipeline import db_service
from services.pipeline.retrieval import RetrievalStrategy
from services.pipeline.confidence_scorer import ConfidenceScorerStrategy
from services.pipeline.summary_generator import SummaryGeneratorStrategy
from services.pipeline.reasoning_engine import ReasoningEngineStrategy
from services.gemini_limiter import GeminiUnavailable

logger = logging.getLogger("ClassificationOrchestrator")

class ClassificationOrchestrator:
    def __init__(
        self,
        retrieval_strategy: RetrievalStrategy,
        confidence_scorer: ConfidenceScorerStrategy,
        summary_generator: SummaryGeneratorStrategy,
        reasoning_engine: ReasoningEngineStrategy
    ):
        self.retrieval_strategy = retrieval_strategy
        self.confidence_scorer = confidence_scorer
        self.summary_generator = summary_generator
        self.reasoning_engine = reasoning_engine
        self.top_k = int(os.getenv("RETRIEVAL_TOP_K", "8"))

    # ── Step 1: vector-only screening (no LLM) ──────────────────────────────
    def prescreen(self, user_email: str, email_embedding: list[float]) -> dict:
        """
        Returns {"final": result} when k-NN alone decides (cold start or a
        clear match), or {"ambiguous": True, "candidates": [...]} when the
        email needs LLM reasoning.
        """
        matches = self.retrieval_strategy.retrieve(user_email, email_embedding, self.top_k)
        if not matches:
            return {"final": {
                "predicted_category": "Unclassified",
                "confidence": 0.0,
                "needs_review": True,
                "reasoning": "No historical examples found to guide classification.",
                "candidate_categories": [],
                "cold_start": True
            }}

        is_high_conf, predicted_cat, confidence, candidate_cats = self.confidence_scorer.evaluate(matches)
        if is_high_conf:
            logger.info(f"High confidence prediction: {predicted_cat} (score: {confidence:.2f}). Bypassing LLM.")
            return {"final": {
                "predicted_category": predicted_cat,
                "confidence": confidence,
                "needs_review": False,
                "reasoning": "High confidence semantic match to a prior example.",
                "candidate_categories": [cat for cat in candidate_cats if cat != predicted_cat],
                "cold_start": False
            }}

        return {"ambiguous": True, "candidates": candidate_cats}

    # ── Step 2: category summaries for the LLM, refreshed lazily ────────────
    def resolve_summaries(self, user_email: str, category_names: list[str]) -> dict[str, str]:
        summaries: dict[str, str] = {}
        for cat_name in category_names:
            cat_doc = db_service.get_category(user_email, cat_name)
            current_summary = cat_doc.get("summary", "") if cat_doc else ""
            pending_ids = cat_doc.get("pendingEmailIds", []) if cat_doc else []
            needs_update = (cat_doc.get("summaryNeedsUpdate", False) if cat_doc else True) or not current_summary

            if needs_update:
                logger.info(f"Summary for category '{cat_name}' needs update. Regenerating lazily.")
                new_emails = db_service.get_emails_by_ids(pending_ids) if pending_ids else []
                # No pending ids and no summary yet: seed from this category's labeled emails.
                if not new_emails and not current_summary:
                    emails_col = db_service.get_emails_col()
                    new_emails = list(emails_col.find({"userEmail": user_email, "category": cat_name}).limit(20))

                updated_summary = self.summary_generator.generate_or_update(cat_name, current_summary, new_emails)
                # None = Gemini unavailable: keep pending ids for the next try
                # and reason with whatever summary we already have.
                if updated_summary is not None:
                    db_service.update_category_summary(user_email, cat_name, updated_summary)
                    current_summary = updated_summary

            summaries[cat_name] = current_summary
        return summaries

    # ── Single-email path (Classify RPC) ────────────────────────────────────
    def classify(
        self,
        user_email: str,
        email_subject: str,
        email_body: str,
        email_sender: str,
        email_embedding: list[float]
    ) -> dict:
        screened = self.prescreen(user_email, email_embedding)
        if "final" in screened:
            return screened["final"]

        candidate_cats = screened["candidates"]
        logger.info(f"Ambiguous prediction among candidates {candidate_cats}. Invoking Gemini reasoning.")
        summaries = self.resolve_summaries(user_email, candidate_cats)

        try:
            reasoned = self.reasoning_engine.reason(
                email_subject=email_subject,
                email_body=email_body,
                email_sender=email_sender,
                candidate_categories_with_summaries=[{"name": n, "summary": s} for n, s in summaries.items()]
            )
        except GeminiUnavailable as exc:
            # Don't guess: leave it unclassified for the user rather than
            # silently filing it under the first candidate.
            logger.warning(f"Reasoning unavailable, leaving email unclassified: {exc}")
            return {
                "predicted_category": "Unclassified",
                "confidence": 0.0,
                "needs_review": True,
                "reasoning": "Couldn't auto-classify right now.",
                "candidate_categories": candidate_cats,
                "cold_start": False
            }

        predicted_category = reasoned.get("category")
        if predicted_category not in candidate_cats:
            predicted_category = "Unclassified"

        return {
            "predicted_category": predicted_category,
            "confidence": reasoned.get("confidence", 0.0),
            "needs_review": True,
            "reasoning": reasoned.get("reason", "Ambiguous classification resolved by reasoning."),
            "candidate_categories": [cat for cat in candidate_cats if cat != predicted_category],
            "cold_start": False
        }
