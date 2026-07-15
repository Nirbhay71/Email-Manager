"""
Email -> Google Calendar Reminder Bot
--------------------------------------
Scans Gmail for new emails from a specific friend, extracts a date
mentioned in the email, and creates a Google Calendar event/reminder
for that date. Uses the official Gmail API and Google Calendar API.

SETUP:
  See README.md for full step-by-step instructions.
  Quick version:
    1. pip install -r requirements.txt
    2. Put your downloaded credentials.json in this folder
    3. Edit FRIEND_EMAIL below
    4. Run: python reminder_bot.py
       (first run opens a browser to authorize access; after that,
       a token.json is saved and it won't ask again)
    5. Schedule it to run every 15 min with cron / Task Scheduler
"""

import os
import re
import base64
import pickle
from datetime import datetime, timedelta

from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# ============================ CONFIG ============================
FRIEND_EMAIL = "kamdardarshit2006@gmail.com"     # <-- change this
LABEL_NAME = "Reminder-Processed"       # Gmail label to mark handled emails
CALENDAR_ID = "primary"                 # "primary" = your main calendar
REMINDER_MINUTES_BEFORE = 60            # pop-up reminder X minutes before event
DEFAULT_EVENT_HOUR = 9                  # used when email has date but no time
DEFAULT_EVENT_DURATION_MIN = 30
TIMEZONE = "Asia/Kolkata"               # change to your timezone if different

SCOPES = [
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/calendar.events",
]

CREDENTIALS_FILE = "credentials.json"
TOKEN_FILE = "token.pickle"
# ==================================================================


def get_credentials():
    """Handles OAuth login, reusing saved token if available."""
    creds = None
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "rb") as f:
            creds = pickle.load(f)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, "wb") as f:
            pickle.dump(creds, f)

    return creds


MONTHS = {
    "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
    "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6, "jul": 7, "july": 7,
    "aug": 8, "august": 8, "sep": 9, "sept": 9, "september": 9, "oct": 10,
    "october": 10, "nov": 11, "november": 11, "dec": 12, "december": 12,
}


def extract_date_from_text(text):
    """Tries several common date formats, returns a datetime or None."""

    # ISO: 2026-07-20
    m = re.search(r"\b(\d{4})-(\d{1,2})-(\d{1,2})\b", text)
    if m:
        return safe_date(int(m.group(1)), int(m.group(2)), int(m.group(3)))

    # DD/MM/YYYY or DD-MM-YYYY (2 or 4 digit year)
    m = re.search(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b", text)
    if m:
        year = int(m.group(3))
        if year < 100:
            year += 2000
        return safe_date(year, int(m.group(2)), int(m.group(1)))

    # "20 July 2026" / "20 Jul 2026"
    m = re.search(r"\b(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\b", text)
    if m and m.group(2).lower() in MONTHS:
        return safe_date(int(m.group(3)), MONTHS[m.group(2).lower()], int(m.group(1)))

    # "July 20, 2026" / "July 20 2026"
    m = re.search(r"\b([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})\b", text)
    if m and m.group(1).lower() in MONTHS:
        return safe_date(int(m.group(3)), MONTHS[m.group(1).lower()], int(m.group(2)))

    return None


def safe_date(year, month, day):
    try:
        return datetime(year, month, day, DEFAULT_EVENT_HOUR, 0, 0)
    except ValueError:
        return None


def get_or_create_label(gmail, name):
    labels = gmail.users().labels().list(userId="me").execute().get("labels", [])
    for label in labels:
        if label["name"] == name:
            return label["id"]
    new_label = gmail.users().labels().create(
        userId="me",
        body={"name": name, "labelListVisibility": "labelShow", "messageListVisibility": "show"},
    ).execute()
    return new_label["id"]


def get_message_text(gmail, msg_id):
    """Fetches subject + plain text body of a message."""
    msg = gmail.users().messages().get(userId="me", id=msg_id, format="full").execute()
    headers = msg["payload"].get("headers", [])
    subject = next((h["value"] for h in headers if h["name"] == "Subject"), "")

    body = ""

    def walk_parts(part):
        nonlocal body
        if part.get("mimeType") == "text/plain" and "data" in part.get("body", {}):
            body += base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8", errors="ignore")
        for sub in part.get("parts", []):
            walk_parts(sub)

    walk_parts(msg["payload"])
    return subject, body, msg["id"]


def create_calendar_event(calendar, dt, subject, gmail_link):
    end_dt = dt + timedelta(minutes=DEFAULT_EVENT_DURATION_MIN)
    event = {
        "summary": f"Reminder: {subject}",
        "description": f"Auto-created from email.\nOpen email: {gmail_link}",
        "start": {"dateTime": dt.isoformat(), "timeZone": TIMEZONE},
        "end": {"dateTime": end_dt.isoformat(), "timeZone": TIMEZONE},
        "reminders": {
            "useDefault": False,
            "overrides": [{"method": "popup", "minutes": REMINDER_MINUTES_BEFORE}],
        },
    }
    calendar.events().insert(calendarId=CALENDAR_ID, body=event).execute()
    print(f"Created calendar event: '{subject}' on {dt}")


def process_reminder_emails():
    creds = get_credentials()
    gmail = build("gmail", "v1", credentials=creds)
    calendar = build("calendar", "v3", credentials=creds)

    label_id = get_or_create_label(gmail, LABEL_NAME)

    query = f"from:{FRIEND_EMAIL} -label:{LABEL_NAME}"
    results = gmail.users().messages().list(userId="me", q=query, maxResults=20).execute()
    messages = results.get("messages", [])

    if not messages:
        print("No new emails to process.")
        return

    for m in messages:
        subject, body, msg_id = get_message_text(gmail, m["id"])
        combined_text = f"{subject}\n{body}"

        found_date = extract_date_from_text(combined_text)
        gmail_link = f"https://mail.google.com/mail/u/0/#inbox/{msg_id}"

        if found_date:
            create_calendar_event(calendar, found_date, subject, gmail_link)
        else:
            print(f"No date found in email: '{subject}' (skipped)")

        # Mark as processed either way, so we don't rescan it forever
        gmail.users().messages().modify(
            userId="me", id=msg_id, body={"addLabelIds": [label_id]}
        ).execute()


if __name__ == "__main__":
    process_reminder_emails()
