/**
 * Verification script: Shows the actual cluster breakdown, cap engagement,
 * and GET /onboarding/sample response for real-data validation.
 *
 * Run: node verify_clustering.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './src/.env' });
import { Email } from './src/models/email.model.js';
import {
    buildClusterId,
    clusterAndSample,
    TARGET_SAMPLE_SIZE,
    MAX_CLUSTER_FRACTION,
    extractSenderDomain,
    detectContentType,
    getRecencyBucket
} from './src/services/inboxSampler.js';

const USER_EMAIL = 'buddhdevdarshan1478@gmail.com';

async function verify() {
    await mongoose.connect(process.env.MONGODB_URI);

    const allEmails = await Email.find({ userEmail: USER_EMAIL }).lean();
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`  CLUSTERING & SAMPLING VERIFICATION`);
    console.log(`  User: ${USER_EMAIL}`);
    console.log(`  Total emails: ${allEmails.length}`);
    console.log(`  Target sample size: ${TARGET_SAMPLE_SIZE}`);
    console.log(`  Max cluster fraction: ${MAX_CLUSTER_FRACTION} (cap = ${Math.floor(TARGET_SAMPLE_SIZE * MAX_CLUSTER_FRACTION)})`);
    console.log(`${'═'.repeat(70)}\n`);

    // ── Step 1: Show full cluster breakdown ─────────────────────────
    const clusters = new Map();
    for (const email of allEmails) {
        const cid = buildClusterId(email);
        if (!clusters.has(cid)) clusters.set(cid, []);
        clusters.get(cid).push(email);
    }

    console.log(`── ALL CLUSTERS (${clusters.size} total) ──\n`);
    console.log(`${'Cluster ID'.padEnd(50)} | Count`);
    console.log(`${'─'.repeat(50)}-+------`);

    const sortedClusters = [...clusters.entries()].sort((a, b) => b[1].length - a[1].length);
    for (const [cid, members] of sortedClusters) {
        const bar = '█'.repeat(members.length);
        console.log(`${cid.padEnd(50)} | ${String(members.length).padStart(3)}  ${bar}`);
    }

    // ── Step 2: Show content-type distribution ──────────────────────
    console.log(`\n── CONTENT-TYPE DISTRIBUTION ──\n`);
    const contentTypes = new Map();
    for (const email of allEmails) {
        const ct = detectContentType(email.subject, email.body);
        contentTypes.set(ct, (contentTypes.get(ct) || 0) + 1);
    }
    for (const [ct, count] of [...contentTypes.entries()].sort((a, b) => b[1] - a[1])) {
        console.log(`  ${ct.padEnd(15)} ${count} emails`);
    }

    // ── Step 3: Show sender domain distribution ─────────────────────
    console.log(`\n── SENDER DOMAIN DISTRIBUTION ──\n`);
    const domains = new Map();
    for (const email of allEmails) {
        const d = extractSenderDomain(email.from);
        domains.set(d, (domains.get(d) || 0) + 1);
    }
    for (const [d, count] of [...domains.entries()].sort((a, b) => b[1] - a[1])) {
        console.log(`  ${d.padEnd(30)} ${count} emails`);
    }

    // ── Step 4: Run actual sampling and show cap engagement ─────────
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`  SAMPLING RESULTS`);
    console.log(`${'═'.repeat(70)}\n`);

    const { sampled, note } = clusterAndSample(allEmails, TARGET_SAMPLE_SIZE);

    console.log(`  Sampled: ${sampled.length} / ${allEmails.length} total emails`);
    console.log(`  Target:  ${TARGET_SAMPLE_SIZE}`);
    console.log(`  Note:    ${note || '(none — target met without issues)'}`);

    // Show per-cluster counts in sample
    const sampleClusters = new Map();
    for (const s of sampled) {
        sampleClusters.set(s.clusterId, (sampleClusters.get(s.clusterId) || 0) + 1);
    }

    console.log(`\n── SAMPLE CLUSTER BREAKDOWN ──\n`);
    console.log(`${'Cluster ID'.padEnd(50)} | Orig | Sampled | Capped?`);
    console.log(`${'─'.repeat(50)}-+------+---------+--------`);

    const cap = Math.floor(TARGET_SAMPLE_SIZE * MAX_CLUSTER_FRACTION);
    let anyCapped = false;
    for (const [cid, members] of sortedClusters) {
        const sampledCount = sampleClusters.get(cid) || 0;
        const wasCapped = members.length > cap && sampledCount <= cap;
        if (wasCapped) anyCapped = true;
        console.log(
            `${cid.padEnd(50)} | ${String(members.length).padStart(4)} | ${String(sampledCount).padStart(7)} | ${wasCapped ? '  YES ⚠' : '  no'}`
        );
    }

    console.log(`\n  25% cap engaged: ${anyCapped ? 'YES ✓ — proportional sampling activated' : 'NO — no cluster exceeded cap'}`);
    console.log(`  Sample < total:  ${sampled.length < allEmails.length ? 'YES ✓ — sampling actually filtered' : 'NO — returned everything'}`);

    // ── Step 5: Simulate the actual API response ────────────────────
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`  SIMULATED GET /onboarding/sample RESPONSE (first 10 of ${sampled.length})`);
    console.log(`${'═'.repeat(70)}\n`);

    const response = sampled.slice(0, 10).map(s => ({
        emailId: s.emailId,
        subject: s._email.subject,
        from: s._email.from,
        date: s._email.createdAt,
        snippet: (s._email.body || '').slice(0, 120) + '...',
        clusterId: s.clusterId
    }));

    console.log(JSON.stringify(response, null, 2));

    process.exit(0);
}

verify().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});
