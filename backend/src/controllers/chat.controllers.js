import { ChatSession } from "../models/chatSession.model.js";

export const getSessions = async (req, res) => {
    try {
        const email = req.user.email; // from verified JWT

        const sessions = await ChatSession.find({ userEmail: email }).sort({ updatedAt: -1 });
        res.status(200).json(sessions);
    } catch (error) {
        console.error("[getSessions] error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const createSession = async (req, res) => {
    try {
        const email = req.user.email; // from verified JWT
        const { title } = req.body;

        const newSession = await ChatSession.create({
            userEmail: email,
            title: title || "New Conversation",
            messages: []
        });

        res.status(201).json(newSession);
    } catch (error) {
        console.error("[createSession] error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const ALLOWED_STATUSES = ["ACTIVE", "ARCHIVED", "SHARED"];

export const updateSessionStatus = async (req, res) => {
    try {
        const email = req.user.email; // from verified JWT
        const { id } = req.params;
        const { status } = req.body;

        if (!ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const session = await ChatSession.findOneAndUpdate(
            { _id: id, userEmail: email },
            { status },
            { new: true, runValidators: true }
        );

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        res.status(200).json(session);
    } catch (error) {
        console.error("[updateSessionStatus] error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
