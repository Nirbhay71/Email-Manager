/**
 * Repairs emails stored with an empty body. Before HTML extraction existed,
 * HTML-only emails (most recruiting/ATS mail) were saved with body "", so
 * search and the AI assistant could only see their subject line.
 *
 *   node scripts/refetch-empty-bodies.js           # dry run: count affected emails
 *   node scripts/refetch-empty-bodies.js --apply   # re-fetch from Gmail, save, re-index for search
 *
 * Re-indexing needs search_feature_demo running (EmbedAndStore over gRPC);
 * if it isn't, bodies are still saved and the script says which weren't indexed.
 */
import dotenv from "dotenv";
dotenv.config({ path: "./src/.env" });
import mongoose from "mongoose";
import { User } from "../src/models/user.model.js";
import { Email } from "../src/models/email.model.js";
import { getMessage } from "../src/service/gmail.service.js";
import { extractDate } from "../src/service/dateExtractor.service.js";
import { embedAndStoreEmail } from "../src/service/embeddingClient.js";

const apply = process.argv.includes("--apply");
await mongoose.connect(process.env.MONGO_URI);

const empty = await Email.find({ $or: [{ body: "" }, { body: null }] })
    .select("userEmail messageId subject receivedAt createdAt calendarEventId detectedDate")
    .lean();
console.log(`${empty.length} emails have an empty body`);

if (!apply) {
    console.log("Dry run — re-run with --apply to re-fetch them from Gmail.");
    await mongoose.disconnect();
    process.exit(0);
}

const tokensByUser = new Map();
let repaired = 0, stillEmpty = 0, failed = 0, notIndexed = 0;

for (const [i, e] of empty.entries()) {
    if (!tokensByUser.has(e.userEmail)) {
        const user = await User.findOne({ email: e.userEmail }).select("tokens");
        tokensByUser.set(e.userEmail, user?.tokens ? user.tokensPlain : null);
    }
    const tokens = tokensByUser.get(e.userEmail);
    if (!tokens) { failed++; continue; }

    try {
        const msg = await getMessage(tokens, e.messageId);
        if (!msg.body.trim()) { stillEmpty++; continue; }

        const update = { body: msg.body };
        if (!e.receivedAt) update.receivedAt = msg.receivedAt;
        // The text is new, so deadline detection gets a real look at it too
        // (dates the user already put on their calendar are left alone).
        if (!e.calendarEventId) update.detectedDate = extractDate(`${msg.subject} ${msg.body}`, msg.receivedAt);
        await Email.updateOne({ _id: e._id }, { $set: update });
        repaired++;

        try {
            await embedAndStoreEmail({ messageId: e.messageId, userEmail: e.userEmail, subject: msg.subject, body: msg.body });
        } catch {
            notIndexed++;
        }
    } catch (err) {
        failed++;
        console.warn(`  could not fetch one email: ${err.message}`);
    }
    if ((i + 1) % 10 === 0) console.log(`  ${i + 1}/${empty.length}…`);
}

console.log(`Repaired ${repaired}, still empty in Gmail too ${stillEmpty}, failed ${failed}.`);
if (notIndexed) console.log(`${notIndexed} repaired emails weren't re-indexed (is search_feature_demo running?) — re-run to retry.`);
await mongoose.disconnect();
process.exit(0);
