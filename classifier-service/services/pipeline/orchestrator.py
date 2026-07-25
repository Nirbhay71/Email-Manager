import os
import logging
from services.pipeline import db_service
from services.pipeline.retrieval import RetrievalStrategy
from services.pipeline.confidence_scorer import ConfidenceScorerStrategy
from services.pipeline.summary_generator import SummaryGeneratorStrategy
from services.pipeline.reasoning_engine import ReasoningEngineStrategy

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

    def classify(
        self,
        user_email: str,
        email_subject: str,
        email_body: str,
        email_sender: str,
        email_embedding: list[float]
    ) -> dict:
        # 1. Retrieve similar labeled emails (isolated to current user)
        matches = self.retrieval_strategy.retrieve(user_email, email_embedding, self.top_k)
        if not matches:
            logger.info(f"No semantic matches found in vector DB for user: {user_email}. Cold start.")
            return {
                "predicted_category": "Unclassified",
                "confidence": 0.0,
                "needs_review": True,
                "reasoning": "No historical examples found to guide classification.",
                "candidate_categories": [],
                "cold_start": True
            }

        # 2. Evaluate using confidence scorer
        is_high_conf, predicted_cat, confidence, candidate_cats = self.confidence_scorer.evaluate(matches)

        if is_high_conf:
            logger.info(f"High confidence prediction for user {user_email}: {predicted_cat} (score: {confidence:.2f}). Bypassing LLM.")
            return {
                "predicted_category": predicted_cat,
                "confidence": confidence,
                "needs_review": False,
                "reasoning": "High confidence semantic match to a prior example.",
                "candidate_categories": [cat for cat in candidate_cats if cat != predicted_cat],
                "cold_start": False
            }

        # 3. Low confidence / Ambiguous case -> Lazy Summary Update + Gemini Reasoning
        logger.info(f"Ambiguous prediction for user {user_email} among candidates {candidate_cats}. Invoking Gemini reasoning.")
        
        # Resolve summaries for candidate categories
        candidate_summaries = []
        for cat_name in candidate_cats:
            cat_doc = db_service.get_category(user_email, cat_name)
            
            # Check if summary needs lazy update
            needs_update = False
            current_summary = ""
            pending_ids = []
            
            if cat_doc:
                current_summary = cat_doc.get("summary", "")
                pending_ids = cat_doc.get("pendingEmailIds", [])
                needs_update = cat_doc.get("summaryNeedsUpdate", False) or not current_summary
            else:
                # Category doesn't exist in DB; create it
                needs_update = True

            if needs_update:
                logger.info(f"Summary for category '{cat_name}' needs update. Regenerating lazily.")
                # Retrieve emails for updating
                new_emails = []
                if pending_ids:
                    new_emails = db_service.get_emails_by_ids(pending_ids)
                
                # Fallback: if no pending IDs but summary is empty, load all historical labeled emails for this category
                if not new_emails and not current_summary:
                    emails_col = db_service.get_emails_col()
                    new_emails = list(emails_col.find({"userEmail": user_email, "category": cat_name}).limit(20))
                
                updated_summary = self.summary_generator.generate_or_update(cat_name, current_summary, new_emails)
                db_service.update_category_summary(user_email, cat_name, updated_summary)
                current_summary = updated_summary

            candidate_summaries.append({
                "name": cat_name,
                "summary": current_summary
            })

        # 4. Reason candidate categories using Gemini
        reasoned = self.reasoning_engine.reason(
            email_subject=email_subject,
            email_body=email_body,
            email_sender=email_sender,
            candidate_categories_with_summaries=candidate_summaries
        )

        predicted_category = reasoned.get("category", candidate_cats[0])
        confidence_score = reasoned.get("confidence", 0.0)
        reasoning_text = reasoned.get("reason", "Ambiguous classification resolved by reasoning.")

        return {
            "predicted_category": predicted_category,
            "confidence": confidence_score,
            "needs_review": True,
            "reasoning": reasoning_text,
            "candidate_categories": [cat for cat in candidate_cats if cat != predicted_category],
            "cold_start": False
        }
