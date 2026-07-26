import { User } from "../models/user.model.js";
import { listCalendarEvents } from "../service/calendar.service.js";

export const getCalendarEvents = async (req, res) => {
    try {
        const { email, timeMin, timeMax } = req.query;

        if (!email) return res.status(400).json({ error: "email query param required" });
        if (!timeMin || !timeMax) return res.status(400).json({ error: "timeMin and timeMax query params required" });

        const user = await User.findOne({ email }).select("email tokens");
        if (!user) return res.status(404).json({ error: "User not found" });
        if (!user.tokens?.access_token && !user.tokens?.refresh_token) {
            return res.status(401).json({ error: "Google Calendar is not connected for this user" });
        }

        const events = await listCalendarEvents(user.tokens, { timeMin, timeMax });

        res.json({
            email: user.email,
            events,
            hasEvents: events.length > 0,
            total: events.length,
        });
    } catch (error) {
        console.error("[calendar] events error:", error);
        res.status(500).json({ error: "Unable to load calendar events" });
    }
};
