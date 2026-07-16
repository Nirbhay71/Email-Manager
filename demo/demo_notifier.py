"""
Deadline Notifier - SMS/WhatsApp reminders 1 day before Calendar events
-------------------------------------------------------------------------
Checks your Google Calendar for events happening ~24 hours from now
(i.e. the ones reminder_bot.py created from your friend's emails) and
sends you an SMS or WhatsApp message via Twilio.

Keeps a local record (notified_events.json) of which events it already
texted you about, so you won't get the same reminder twice.

SETUP:
  1. pip install twilio
  2. Sign up at https://www.twilio.com/try-twilio (free trial works for testing)
  3. From the Twilio Console dashboard, copy your Account SID and Auth Token
     into the CONFIG section below
  4. For SMS: buy/use a Twilio phone number, put it in TWILIO_FROM_NUMBER
     For WhatsApp: use Twilio's WhatsApp sandbox number (shown in Console
     under Messaging -> Try it out -> Send a WhatsApp message), and you
     must first send the join code from your phone to that number once
  5. Put your own phone number in TWILIO_TO_NUMBER (with country code, e.g. +91...)
  6. Run: python deadline_notifier.py
  7. Schedule it with cron/Task Scheduler to run every hour (see README)

Uses the same credentials.json used by reminder_bot.py (must already be
in this folder, and Calendar API must be enabled on that Google Cloud project).
"""

import os
import json
import pickle
from datetime import datetime, timedelta, timezone

from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from twilio.rest import Client

# ============================ CONFIG ============================
CALENDAR_ID = "primary"
NOTIFY_WINDOW_HOURS = 24        # notify for events happening ~this many hours from now
CHECK_TOLERANCE_MINUTES = 30    # how wide a window each run checks (match to your run frequency)

NOTIFY_CHANNEL = "sms"     # "sms" or "whatsapp"

TWILIO_ACCOUNT_SID = ""     # <-- from Twilio Console
TWILIO_AUTH_TOKEN = ""       # <-- from Twilio Console
TWILIO_FROM_NUMBER = ""                # <-- Twilio number (SMS) or WhatsApp sandbox number
TWILIO_TO_NUMBER = ""                 # <-- YOUR phone number, with country code

SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]
CREDENTIALS_FILE = "credentials.json"
TOKEN_FILE = "token_calendar_read.pickle"   # separate token file (readonly scope)
NOTIFIED_LOG_FILE = "notified_events.json"
# ==================================================================


def get_credentials():
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


def load_notified_ids():
    if os.path.exists(NOTIFIED_LOG_FILE):
        with open(NOTIFIED_LOG_FILE, "r") as f:
            return set(json.load(f))
    return set()


def save_notified_ids(ids):
    with open(NOTIFIED_LOG_FILE, "w") as f:
        json.dump(list(ids), f)


def get_upcoming_events(calendar):
    now = datetime.now(timezone.utc)
    window_start = now + timedelta(hours=NOTIFY_WINDOW_HOURS) - timedelta(minutes=CHECK_TOLERANCE_MINUTES)
    window_end = now + timedelta(hours=NOTIFY_WINDOW_HOURS) + timedelta(minutes=CHECK_TOLERANCE_MINUTES)

    events_result = calendar.events().list(
        calendarId=CALENDAR_ID,
        timeMin=window_start.isoformat(),
        timeMax=window_end.isoformat(),
        singleEvents=True,
        orderBy="startTime",
    ).execute()

    return events_result.get("items", [])


def send_notification(event):
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    title = event.get("summary", "Untitled event")
    start = event["start"].get("dateTime", event["start"].get("date"))
    message_body = f"Reminder: '{title}' is due tomorrow ({start})."

    from_number = f"whatsapp:{TWILIO_FROM_NUMBER}" if NOTIFY_CHANNEL == "whatsapp" else TWILIO_FROM_NUMBER
    to_number = f"whatsapp:{TWILIO_TO_NUMBER}" if NOTIFY_CHANNEL == "whatsapp" else TWILIO_TO_NUMBER

    client.messages.create(body=message_body, from_=from_number, to=to_number)
    print(f"Sent {NOTIFY_CHANNEL} notification for: {title}")


def process_deadline_notifications():
    creds = get_credentials()
    calendar = build("calendar", "v3", credentials=creds)

    notified_ids = load_notified_ids()
    events = get_upcoming_events(calendar)

    if not events:
        print("No events in the notification window right now.")
        return

    for event in events:
        event_id = event["id"]
        if event_id in notified_ids:
            continue

        send_notification(event)
        notified_ids.add(event_id)

    save_notified_ids(notified_ids)


if __name__ == "__main__":
    process_deadline_notifications()
