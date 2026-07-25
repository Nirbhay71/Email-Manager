import os
import json
import logging
from abc import ABC, abstractmethod
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

logger = logging.getLogger("SummaryGenerator")

class SummaryUpdateResult(BaseModel):
    updated_summary: str = Field(description="The updated category summary under 80 words, incorporating the new email concepts.")

class SummaryGeneratorStrategy(ABC):
    @abstractmethod
    def generate_or_update(self, category_name: str, current_summary: str, new_emails: list[dict]) -> str:
        """
        Regenerate/update the summary for a category based on new emails.
        """
        pass

class GeminiSummaryGenerator(SummaryGeneratorStrategy):
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        self.client = genai.Client(api_key=api_key) if api_key else None

    def generate_or_update(self, category_name: str, current_summary: str, new_emails: list[dict]) -> str:
        if not self.client:
            logger.warning("Gemini client not initialized (missing API key). Skipping summary update.")
            return current_summary

        if not new_emails:
            return current_summary

        # Format new emails
        emails_text = "\n\n".join(
            f"From: {email.get('from', '')}\nSubject: {email.get('subject', '')}\nSnippet: {email.get('body', '')[:250]}"
            for email in new_emails
        )

        user_message = f"""Category:
{category_name}

Current Summary:
{current_summary if current_summary else "(No current summary)"}

Below are newly added emails:
{emails_text}"""

        system_instruction = """You maintain summaries of personalized email categories.
Update the summary based on the new emails provided.
Keep previous information.
Add only genuinely new concepts.
Remove redundancy.
Keep under 80 words.
Return the result matching the response schema."""

        try:
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=SummaryUpdateResult,
                temperature=0.2,
            )
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=user_message,
                config=config,
            )
            parsed = json.loads(response.text)
            return parsed.get("updated_summary", current_summary).strip()
        except Exception as e:
            logger.error(f"Gemini summary generation error: {e}")
            return current_summary
