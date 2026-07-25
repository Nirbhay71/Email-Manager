import os
import json
import logging
from abc import ABC, abstractmethod
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

logger = logging.getLogger("ReasoningEngine")

class ReasonedClassification(BaseModel):
    category: str = Field(description="The chosen category from the candidates list")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0")
    reason: str = Field(description="Short sentence explaining why the email fits this category summary")

class ReasoningEngineStrategy(ABC):
    @abstractmethod
    def reason(
        self,
        email_subject: str,
        email_body: str,
        email_sender: str,
        candidate_categories_with_summaries: list[dict]
    ) -> dict:
        """
        Reason between candidate categories using their summaries.
        Returns a dict matching the ReasonedClassification schema.
        """
        pass

class GeminiReasoningEngine(ReasoningEngineStrategy):
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        self.client = genai.Client(api_key=api_key) if api_key else None

    def reason(
        self,
        email_subject: str,
        email_body: str,
        email_sender: str,
        candidate_categories_with_summaries: list[dict]
    ) -> dict:
        if not self.client:
            logger.warning("Gemini client not initialized. Cannot run reasoning.")
            return {
                "category": candidate_categories_with_summaries[0]["name"] if candidate_categories_with_summaries else "Unclassified",
                "confidence": 0.0,
                "reason": "Gemini client not initialized."
            }

        candidates_formatted = "\n\n".join(
            f"Category Name: {cat['name']}\nSummary: {cat['summary']}"
            for cat in candidate_categories_with_summaries
        )

        user_message = f"""Candidate Categories:
{candidates_formatted}

Incoming Email:
From: {email_sender}
Subject: {email_subject}
Body: {email_body}"""

        system_instruction = """You are classifying an incoming email.
Compare the incoming email against the candidate categories and their summaries.
Choose exactly one category from the candidate list that best matches the incoming email.
If the email doesn't clearly match any candidate's summary, still pick the closest category but give a low confidence score (below 0.5).
Return the result matching the response schema."""

        try:
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=ReasonedClassification,
                temperature=0.1,
            )
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=user_message,
                config=config,
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Gemini reasoning error: {e}")
            return {
                "category": candidate_categories_with_summaries[0]["name"] if candidate_categories_with_summaries else "Unclassified",
                "confidence": 0.0,
                "reason": f"Reasoning failed: {str(e)}"
            }
