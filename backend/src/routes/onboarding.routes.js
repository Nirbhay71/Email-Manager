import express from "express";
import { EmailLabel } from "../models/emailLabel.model.js";
import { OnboardingSample } from "../models/onboardingSample.model.js";
import { User } from "../models/user.model.js";
import { getOnboardingSample } from "../services/inboxSampler.js";

const router = express.Router();

const VALID_LABELS = ["important", "not_important", "skipped"];

// ──────────────────────────────────────────────────────────────────────
// GET /onboarding/sample?userEmail=...
// Returns the sampled email batch for labeling.
// Idempotent: repeated calls return the same set.
// ──────────────────────────────────────────────────────────────────────
router.get("/sample", async (req, res) => {
    try {
        const { userEmail } = req.query;
        if (!userEmail) {
            return res.status(400).json({ error: "userEmail query parameter is required" });
        }

        const result = await getOnboardingSample(userEmail);
        res.json(result);

    } catch (error) {
        console.error("[onboarding/sample] error:", error);
        res.status(500).json({ error: "Failed to generate onboarding sample" });
    }
});

// ──────────────────────────────────────────────────────────────────────
// POST /onboarding/label
// Upsert a label for a specific email.
// Body: { userEmail, emailId, label }
// ──────────────────────────────────────────────────────────────────────
router.post("/label", async (req, res) => {
    try {
        const { userEmail, emailId, label } = req.body;

        if (!userEmail || !emailId || !label) {
            return res.status(400).json({ error: "userEmail, emailId, and label are all required" });
        }

        if (!VALID_LABELS.includes(label)) {
            return res.status(400).json({
                error: `Invalid label "${label}". Must be one of: ${VALID_LABELS.join(", ")}`
            });
        }

        // Look up the clusterId from the persisted sample (if available)
        let clusterId = null;
        const sample = await OnboardingSample.findOne({ userEmail });
        if (sample) {
            const entry = sample.emailIds.find(e => e.emailId === emailId);
            if (entry) clusterId = entry.clusterId;
        }

        // Upsert: update if exists, create if not
        const result = await EmailLabel.findOneAndUpdate(
            { userEmail, emailId },
            {
                $set: {
                    label,
                    source: "onboarding",
                    clusterId,
                    createdAt: new Date()
                }
            },
            { upsert: true, returnDocument: 'after', runValidators: true }
        );

        // Increment the user's labelVersion to invalidate the centroid cache (Phase 2 requirement)
        await User.findOneAndUpdate(
            { email: userEmail },
            { $inc: { labelVersion: 1 } },
            { upsert: true }
        );

        res.json({
            success: true,
            label: result
        });

    } catch (error) {
        console.error("[onboarding/label] error:", error);
        res.status(500).json({ error: "Failed to save label" });
    }
});

// ──────────────────────────────────────────────────────────────────────
// GET /onboarding/progress?userEmail=...
// Returns labeling progress: labeled count, total sample size, complete flag.
// ──────────────────────────────────────────────────────────────────────
router.get("/progress", async (req, res) => {
    try {
        const { userEmail } = req.query;
        if (!userEmail) {
            return res.status(400).json({ error: "userEmail query parameter is required" });
        }

        const sample = await OnboardingSample.findOne({ userEmail });
        const total = sample ? sample.emailIds.length : 0;

        const labeled = await EmailLabel.countDocuments({
            userEmail,
            source: "onboarding"
        });

        res.json({
            labeled,
            total,
            complete: total > 0 && labeled >= total
        });

    } catch (error) {
        console.error("[onboarding/progress] error:", error);
        res.status(500).json({ error: "Failed to fetch progress" });
    }
});

// ──────────────────────────────────────────────────────────────────────
// POST /onboarding/skip-remaining
// Mark all unlabeled sample emails as "skipped".
// Body: { userEmail }
// ──────────────────────────────────────────────────────────────────────
router.post("/skip-remaining", async (req, res) => {
    try {
        const { userEmail } = req.body;
        if (!userEmail) {
            return res.status(400).json({ error: "userEmail is required" });
        }

        const sample = await OnboardingSample.findOne({ userEmail });
        if (!sample || sample.emailIds.length === 0) {
            return res.json({ skipped: 0, message: "No sample found for this user" });
        }

        // Find which emails already have labels
        const allSampleEmailIds = sample.emailIds.map(e => e.emailId);
        const existingLabels = await EmailLabel.find({
            userEmail,
            emailId: { $in: allSampleEmailIds },
            source: "onboarding"
        }).lean();

        const labeledIds = new Set(existingLabels.map(l => l.emailId));

        // Build a clusterId lookup
        const clusterMap = new Map(sample.emailIds.map(e => [e.emailId, e.clusterId]));

        // Mark unlabeled ones as skipped via bulkWrite for efficiency
        const unlabeled = allSampleEmailIds.filter(id => !labeledIds.has(id));
        if (unlabeled.length === 0) {
            return res.json({ skipped: 0, message: "All emails already labeled" });
        }

        const ops = unlabeled.map(emailId => ({
            updateOne: {
                filter: { userEmail, emailId },
                update: {
                    $set: {
                        label: "skipped",
                        source: "onboarding",
                        clusterId: clusterMap.get(emailId) || null,
                        createdAt: new Date()
                    }
                },
                upsert: true
            }
        }));

        await EmailLabel.bulkWrite(ops);

        // Increment labelVersion to invalidate cache
        await User.findOneAndUpdate(
            { email: userEmail },
            { $inc: { labelVersion: 1 } },
            { upsert: true }
        );

        console.log(`[onboarding/skip-remaining] User=${userEmail}: skipped ${unlabeled.length} emails`);
        res.json({ skipped: unlabeled.length });

    } catch (error) {
        console.error("[onboarding/skip-remaining] error:", error);
        res.status(500).json({ error: "Failed to skip remaining emails" });
    }
});

// ──────────────────────────────────────────────────────────────────────
// POST /onboarding/reset
// Clears a user's OnboardingSample and all non-behavioral EmailLabel
// entries, allowing onboarding to be redone from scratch.
// Body: { userEmail }
// ──────────────────────────────────────────────────────────────────────
router.post("/reset", async (req, res) => {
    try {
        const { userEmail } = req.body;
        if (!userEmail) {
            return res.status(400).json({ error: "userEmail is required" });
        }

        // Delete the persisted sample
        const sampleResult = await OnboardingSample.deleteOne({ userEmail });

        // Delete all onboarding labels (preserve behavioral ones from Phase 4)
        const labelResult = await EmailLabel.deleteMany({
            userEmail,
            source: "onboarding"
        });

        console.log(
            `[onboarding/reset] User=${userEmail}: ` +
            `deleted ${sampleResult.deletedCount} sample doc(s), ` +
            `${labelResult.deletedCount} onboarding label(s). ` +
            `Behavioral labels preserved.`
        );

        res.json({
            success: true,
            deletedSamples: sampleResult.deletedCount,
            deletedLabels: labelResult.deletedCount
        });

    } catch (error) {
        console.error("[onboarding/reset] error:", error);
        res.status(500).json({ error: "Failed to reset onboarding" });
    }
});

export default router;
