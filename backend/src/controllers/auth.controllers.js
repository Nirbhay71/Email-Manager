import { google } from "googleapis";
import { getOAuthClient } from "../config/google.config.js";
import { User } from "../models/user.model.js";
import { startWatch } from "../service/gmail.service.js";

const SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/userinfo.email"
];

export const googleLogin = (req, res) => {
    const oAtuth2Client = getOAuthClient();
    const url = oAtuth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: SCOPES
    });

    res.redirect(url);
}

export const googleCallback = async (req, res) => {
    try {

        const { code } = req.query;
        const oAtuth2Client = getOAuthClient();
        const { tokens } = await oAtuth2Client.getToken(code);
        oAtuth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({ auth: oAtuth2Client, version: "v2" });

        const { data } = await oauth2.userinfo.get();

        const email = data.email;

        let user = await User.findOne({ email });

        if (user) {
            user.tokens = tokens;
            await user.save();
        } else {
            user = await User.create({
                email,
                avtar: data.picture || "",
                tokens
            });
        }

        const watchResult = await startWatch(tokens);
        user.historyId = watchResult.historyId;
        await user.save();

        console.log(`[auth] ${email} registered. historyId=${watchResult.historyId}`);

        res.send(`Logged in as ${email}. Gmail watch is active — send a test email now.`);


    } catch (error) {

        console.error("[auth] callback error:", error);
        res.status(500).send("OAuth callback failed, check server logs");

    }
}