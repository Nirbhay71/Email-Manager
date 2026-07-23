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