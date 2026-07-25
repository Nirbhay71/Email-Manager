import os
import json
import logging
from google import genai
from google.genai import types

logger = logging.getLogger("GeminiClassifier")

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY or API_KEY == "YOUR_GEMINI_API_KEY_HERE":
    logger.warning("GEMINI_API_KEY is not set! Set it in classifier-service/.env")

client = genai.Client(api_key=API_KEY) if API_KEY else None

SYSTEM_PROMPT = """You are a personalized email categorization engine. You will be given:
1. A new email that needs a category.
2. A handful of examples of how THIS SPECIFIC USER has categorized similar emails before.

Your job is to decide which category the new email belongs to, based ONLY on the patterns in the examples provided. Do not use generic assumptions about what a category name "should" mean -- infer meaning purely from how this user has used it.

Respond with ONLY a JSON object matching this schema:
{
  "category": "<one of the categories seen in the examples>",
  "confidence": <float 0.0-1.0>,
  "reasoning": "<one short sentence>",
  "runner_up_categories": ["<optional second-best category>", ...]
}

If the email doesn't clearly match any example pattern, still pick the closest category but give a low confidence score (below 0.5)."""

def classify_with_examples(
    email_subject: str,
    email_body_snippet: str,
    email_sender: str,
    examples: list[dict],
) -> dict:
    if not client:
        return {
            "category": examples[0]["category"] if examples else "Unclassified",
            "confidence": 0.0,
            "reasoning": "Gemini client not initialized (missing API key).",
            "runner_up_categories": [],
        }

    examples_text = "\n\n".join(
        f"Example {i + 1} (category: {ex['category']}, similarity: {ex['similarity']:.2f}, "
        f"labeled as: {ex['source']}):\n"
        f"From: {ex['sender']}\nSubject: {ex['subject']}"
        for i, ex in enumerate(examples)
    )

    user_message = f"""Past examples from this user's history:

{examples_text}

---

New email to categorize:
From: {email_sender}
Subject: {email_subject}
Body: {email_body_snippet}

Which category does this belong to?"""

    try:
        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            temperature=0.1,
            max_output_tokens=300,
        )
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_message,
            config=config,
        )

        raw_text = response.text.strip()
        parsed = json.loads(raw_text)
    except Exception as e:
        logger.error(f"Gemini classification error: {e}")
        # Fall back to nearest neighbor
        parsed = {
            "category": examples[0]["category"] if examples else "Unclassified",
            "confidence": 0.0,
            "reasoning": f"Failed to run Gemini reasoning: {str(e)}. Defaulted to nearest neighbor.",
            "runner_up_categories": [],
        }

    return parsed
