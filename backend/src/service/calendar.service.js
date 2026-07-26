import { google } from "googleapis";
import { getOAuthClient } from "../config/google.config.js";

export async function createDeadlineEvent(tokens, {title, isoDate, description}) {
    const auth = getOAuthClient();
    auth.setCredentials(tokens);

    const calendar = google.calendar({version: "v3", auth});

    const event = {
        summary: title,
        description,
        start: { date: isoDate },
        end: { date: isoDate },
        reminders: {
            useDefault: false,
            overrides: [
                {method: "popup", minutes: 24*60},
                {method: "email", minutes: 24*60}
            ]
        }
    };

    const res = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event
    });

    return res.data;
}

export async function listCalendarEvents(tokens, { timeMin, timeMax }) {
    const auth = getOAuthClient();
    auth.setCredentials(tokens);

    const calendar = google.calendar({version: "v3", auth});
    const res = await calendar.events.list({
        calendarId: "primary",
        maxResults: 50,
        orderBy: "startTime",
        singleEvents: true,
        timeMax,
        timeMin,
    });

    return (res.data.items || []).map((event) => ({
        id: event.id,
        title: event.summary || "Untitled event",
        description: event.description || "",
        htmlLink: event.htmlLink || "",
        start: event.start?.dateTime || event.start?.date || "",
        end: event.end?.dateTime || event.end?.date || "",
        allDay: Boolean(event.start?.date),
    }));
}
