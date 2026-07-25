import os
import logging
from google import genai
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("GeminiService")
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY or API_KEY == "YOUR_GEMINI_API_KEY_HERE":
    logger.warning("GEMINI_API_KEY is not set! Set it in python-service/.env")

client = genai.Client(api_key=API_KEY) if API_KEY else None

def stream_answer(question: str, context_emails: list[dict]):
    """
    Streams tokens from Gemini 2.5 Flash using provided email context.
    Yields chunks of generated text as strings.
    """
    if not client:
        yield "Gemini API key is missing. Please configure GEMINI_API_KEY in python-service/.env."
        return

    context_text = ""
    for idx, email in enumerate(context_emails, 1):
        context_text += f"\n--- Email {idx}: {email.get('subject', 'No Subject')} ---\n"
        context_text += f"From: {email.get('from', 'Unknown')}\n"
        context_text += f"Content:\n{email.get('body', '')}\n"

    prompt = f"""You are an intelligent email assistant. Answer the user's question using ONLY the provided email excerpts below.
If the answer is not contained in these emails, state clearly: "I don't see that information in your emails." Do not guess or fabricate dates or details.

Email Excerpts:
{context_text}

User Question: {question}
Answer:"""

    try:
        response = client.models.generate_content_stream(
            model="gemini-2.5-flash",
            contents=prompt
        )
        for chunk in response:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        logger.error(f"Gemini streaming error: {e}")
        yield f"\n[Error generating answer: {str(e)}]"
