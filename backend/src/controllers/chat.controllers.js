import { ChatSession } from "../models/chatSession.model.js";

export const getSessions = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ error: "email is required" });
        }

        const sessions = await ChatSession.find({ userEmail: email }).sort({ updatedAt: -1 });
        res.status(200).json(sessions);
    } catch (error) {
        console.error("[getSessions] error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const createSession = async (req, res) => {
    try {
        const { email, title } = req.body;
        if (!email) {
            return res.status(400).json({ error: "email is required" });
        }

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

export const updateSessionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const session = await ChatSession.findByIdAndUpdate(
            id,
            { status },
            { new: true }
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
