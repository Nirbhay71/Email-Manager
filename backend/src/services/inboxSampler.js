import { Email } from "../models/email.model.js";
import { OnboardingSample } from "../models/onboardingSample.model.js";

// ──────────────────────────────────────────────────────────────────────
// Named constants
// ──────────────────────────────────────────────────────────────────────

/** Default number of emails to sample for onboarding. */
export const TARGET_SAMPLE_SIZE = 75;

/** Maximum fraction of the total sample any single cluster may occupy. */
export const MAX_CLUSTER_FRACTION = 0.25;

// ──────────────────────────────────────────────────────────────────────
// Clustering heuristics
// ──────────────────────────────────────────────────────────────────────

/** Keyword-based content type patterns — order matters (first match wins). */
const CONTENT_TYPE_PATTERNS = [
    { type: "otp",          regex: /\b(otp|verification code|one.time.pass|security code|verify your|2fa)\b/i },
    { type: "invoice",      regex: /\b(invoice|payment|receipt|billing|amount due|pay now)\b/i },
    { type: "deadline",     regex: /\b(deadline|due date|due by|last date|expires? on|expir(ing|ation))\b/i },
    { type: "interview",    regex: /\b(interview|shortlist(ed)?|selection|round [0-9]|coding (test|challenge))\b/i },
    { type: "meeting",      regex: /\b(meeting|calendar invite|agenda|standup|sync|zoom|teams|google meet)\b/i },
    { type: "newsletter",   regex: /(unsubscribe|email preferences|opt.out|mailing list|newsletter)/i },
    { type: "general",      regex: /.*/ }  // fallback — always matches
];

/**
 * Extract sender domain from a "from" field.
 * Handles formats like: "Darshan <darshan@gmail.com>" → "gmail.com"
 */
export function extractSenderDomain(from) {
    if (!from) return "unknown";
    const match = from.match(/@([a-zA-Z0-9.-]+)/);
    return match ? match[1].toLowerCase() : "unknown";
}

/**
 * Detect the content type of an email using keyword heuristics.
 * Returns the first matching type.
 */
export function detectContentType(subject, body) {
    const text = `${subject || ""} ${(body || "").slice(0, 2000)}`; // cap body scan for perf
    for (const pattern of CONTENT_TYPE_PATTERNS) {
        if (pattern.regex.test(text)) {
            return pattern.type;
        }
    }
    return "general";
}

/**
 * Assign a recency bucket based on email creation timestamp.
 */
export function getRecencyBucket(createdAt) {
    if (!createdAt) return "unknown";
    const now = Date.now();
    const ageMs = now - new Date(createdAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    if (ageDays < 7)   return "0-7d";
    if (ageDays < 30)  return "7-30d";
    if (ageDays < 90)  return "30-90d";
    return "90d+";
}

/**
 * Build a composite cluster ID for an email.
 */
export function buildClusterId(email) {
    const domain = extractSenderDomain(email.from);
    const contentType = detectContentType(email.subject, email.body);
    const recency = getRecencyBucket(email.createdAt);
    return `${domain}_${contentType}_${recency}`;
}

// ──────────────────────────────────────────────────────────────────────
// Core sampling logic
// ──────────────────────────────────────────────────────────────────────

/**
 * Given an array of emails, cluster and sample them proportionally.
 *
 * EDGE-CASE HANDLING (user addition):
 *   If every cluster hits its 25% cap and the total capped capacity is
 *   still below the target, we do a second pass: proportionally relax
 *   the cap to fill the remaining slots. The relaxation is logged so
 *   it never happens invisibly.
 *
 * @param {Array} emails - Raw email documents from MongoDB.
 * @param {number} targetSize - Desired sample size.
 * @returns {{ sampled: Array<{emailId, clusterId}>, note: string|null }}
 */
export function clusterAndSample(emails, targetSize = TARGET_SAMPLE_SIZE) {
    if (!emails || emails.length === 0) {
        return { sampled: [], note: "User has no emails." };
    }

    // If total emails <= target, return all — no sampling needed
    if (emails.length <= targetSize) {
        const sampled = emails.map(e => ({
            emailId: e.messageId,
            clusterId: buildClusterId(e),
            _email: e  // carry full doc for response building
        }));
        return {
            sampled,
            note: `User has only ${emails.length} emails (target was ${targetSize}). Returning all.`
        };
    }

    // ── Step 1: Group by cluster ────────────────────────────────────
    const clusters = new Map(); // clusterId → [email, ...]
    for (const email of emails) {
        const cid = buildClusterId(email);
        if (!clusters.has(cid)) clusters.set(cid, []);
        clusters.get(cid).push(email);
    }

    const clusterCap = Math.max(1, Math.floor(targetSize * MAX_CLUSTER_FRACTION));
    let note = null;

    // ── Step 2: First pass — cap each cluster ───────────────────────
    let sampled = [];
    const leftoverPool = []; // emails that didn't make first pass

    for (const [cid, members] of clusters) {
        // Shuffle members deterministically (Fisher-Yates with seeded index)
        const shuffled = shuffleArray([...members]);
        const take = Math.min(shuffled.length, clusterCap);
        for (let i = 0; i < take; i++) {
            sampled.push({
                emailId: shuffled[i].messageId,
                clusterId: cid,
                _email: shuffled[i]
            });
        }
        // Remainder goes to leftover pool for potential second pass
        for (let i = take; i < shuffled.length; i++) {
            leftoverPool.push({ email: shuffled[i], clusterId: cid });
        }
    }

    // ── Step 3: Check if we hit the target ──────────────────────────
    if (sampled.length >= targetSize) {
        // We overshot — trim back to target (spread across clusters)
        sampled = sampled.slice(0, targetSize);
    } else if (sampled.length < targetSize && leftoverPool.length > 0) {
        // EDGE CASE: All clusters were capped but combined < target.
        // Relax cap — pull more from leftover pool proportionally.
        const deficit = targetSize - sampled.length;

        console.log(
            `[inboxSampler] Cluster-cap edge case: first pass yielded ${sampled.length}/${targetSize}. ` +
            `${clusters.size} clusters all hit the ${clusterCap}-email cap. ` +
            `Relaxing cap to fill ${deficit} remaining slots from ${leftoverPool.length} leftover emails.`
        );
        note = `Cluster caps relaxed: first pass yielded ${sampled.length}/${targetSize}, then ${deficit} more drawn from leftover pool.`;

        // Shuffle leftover pool and take what we need
        const shuffledLeftover = shuffleArray([...leftoverPool]);
        const extraTake = Math.min(deficit, shuffledLeftover.length);
        for (let i = 0; i < extraTake; i++) {
            sampled.push({
                emailId: shuffledLeftover[i].email.messageId,
                clusterId: shuffledLeftover[i].clusterId,
                _email: shuffledLeftover[i].email
            });
        }

        // Check if any clusters exceeded the cap after relaxation (which happens when there are no other emails)
        const clusterCounts = new Map();
        for (const s of sampled) {
            clusterCounts.set(s.clusterId, (clusterCounts.get(s.clusterId) || 0) + 1);
        }
        
        let overflowNote = '';
        for (const [cid, count] of clusterCounts) {
            if (count > clusterCap) {
                const fraction = Math.round((count / targetSize) * 100);
                overflowNote += ` [Unavoidable cap violation: ${cid} comprises ${fraction}% (${count}/${targetSize}) due to insufficient emails in other clusters.]`;
            }
        }

        if (overflowNote) {
            console.log(`[inboxSampler]${overflowNote}`);
            note += overflowNote;
        }

        if (sampled.length < targetSize) {
            // Still short even after relaxing — genuinely not enough distinct emails
            const finalNote = `After relaxing cluster caps, sample is ${sampled.length}/${targetSize}. Not enough distinct emails.`;
            console.log(`[inboxSampler] ${finalNote}`);
            note += ` ${finalNote}`;
        }
    }

    return { sampled, note };
}

/**
 * Deterministic-ish shuffle using Fisher-Yates.
 * Not cryptographically seeded, but good enough for sampling diversity.
 */
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ──────────────────────────────────────────────────────────────────────
// Public API — used by onboarding routes
// ──────────────────────────────────────────────────────────────────────

/**
 * Get the onboarding sample for a user. Idempotent:
 *   - If a persisted sample exists, return it (re-fetching email details).
 *   - Otherwise, compute a new sample and persist it.
 *
 * @param {string} userEmail
 * @returns {Promise<{ emails: Array, total: number, note: string|null }>}
 */
export async function getOnboardingSample(userEmail) {
    // ── Check for existing persisted sample ─────────────────────────
    const existing = await OnboardingSample.findOne({ userEmail });
    if (existing) {
        const emailIds = existing.emailIds.map(e => e.emailId);
        const emails = await Email.find({
            userEmail,
            messageId: { $in: emailIds }
        }).lean();

        // Build a lookup to attach clusterIds
        const clusterMap = new Map(existing.emailIds.map(e => [e.emailId, e.clusterId]));

        const result = emails.map(e => ({
            emailId: e.messageId,
            subject: e.subject,
            from: e.from,
            date: e.createdAt,
            snippet: (e.body || "").slice(0, 250),
            clusterId: clusterMap.get(e.messageId) || "unknown"
        }));

        return { emails: result, total: result.length, note: existing.sampleNote };
    }

    // ── Compute new sample ──────────────────────────────────────────
    const allEmails = await Email.find({ userEmail }).lean();
    const { sampled, note } = clusterAndSample(allEmails);

    if (note) {
        console.log(`[inboxSampler] User=${userEmail}: ${note}`);
    }

    // Persist for idempotency
    const sampleDoc = await OnboardingSample.create({
        userEmail,
        emailIds: sampled.map(s => ({ emailId: s.emailId, clusterId: s.clusterId })),
        sampleNote: note
    });

    const result = sampled.map(s => ({
        emailId: s.emailId,
        subject: s._email.subject,
        from: s._email.from,
        date: s._email.createdAt,
        snippet: (s._email.body || "").slice(0, 250),
        clusterId: s.clusterId
    }));

    return { emails: result, total: result.length, note };
}
