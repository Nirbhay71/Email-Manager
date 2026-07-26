import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';

// Connect to MongoDB for direct model assertions
await mongoose.connect('mongodb://localhost:27017/ai_email_manager');
import { User } from './src/models/user.model.js';
import { OnboardingSample } from './src/models/onboardingSample.model.js';
import { EmailLabel } from './src/models/emailLabel.model.js';

// ─────────────────────────────────────────────────────────────────────
// Integration tests for onboarding API routes.
// Requires: backend server running on localhost:5000 + MongoDB connected.
// Uses a dedicated test email to avoid polluting real user data.
// ─────────────────────────────────────────────────────────────────────

const API_URL = 'http://localhost:5000';
const TEST_USER_EMAIL = 'buddhdevdarshan1478@gmail.com'; // Real synced account with emails

// ── Helpers ─────────────────────────────────────────────────────────

async function resetOnboarding() {
    await fetch(`${API_URL}/onboarding/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: TEST_USER_EMAIL })
    });
}

// ═══════════════════════════════════════════════════════════════════
// GET /onboarding/sample
// ═══════════════════════════════════════════════════════════════════

test('GET /onboarding/sample — returns email array', async () => {
    await resetOnboarding(); // start clean

    const res = await fetch(`${API_URL}/onboarding/sample?userEmail=${encodeURIComponent(TEST_USER_EMAIL)}`);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(data.emails), 'emails should be an array');
    assert.strictEqual(typeof data.total, 'number');

    if (data.emails.length > 0) {
        const email = data.emails[0];
        assert.ok(email.emailId, 'email should have emailId');
        assert.ok(email.subject !== undefined, 'email should have subject');
        assert.ok(email.from, 'email should have from');
        assert.ok(email.clusterId, 'email should have clusterId');
    }
});

test('GET /onboarding/sample — 400 without userEmail', async () => {
    const res = await fetch(`${API_URL}/onboarding/sample`);
    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.ok(data.error);
});

test('GET /onboarding/sample — idempotent (same set on repeat calls)', async () => {
    const res1 = await fetch(`${API_URL}/onboarding/sample?userEmail=${encodeURIComponent(TEST_USER_EMAIL)}`);
    const data1 = await res1.json();

    const res2 = await fetch(`${API_URL}/onboarding/sample?userEmail=${encodeURIComponent(TEST_USER_EMAIL)}`);
    const data2 = await res2.json();

    assert.strictEqual(data1.total, data2.total, 'Total should be identical on repeat calls');

    // Same email IDs (order may differ)
    const ids1 = data1.emails.map(e => e.emailId).sort();
    const ids2 = data2.emails.map(e => e.emailId).sort();
    assert.deepStrictEqual(ids1, ids2, 'Same emails should be returned');
});

// ═══════════════════════════════════════════════════════════════════
// POST /onboarding/label
// ═══════════════════════════════════════════════════════════════════

test('POST /onboarding/label — valid label succeeds', async () => {
    // Get a sample email to label
    const sampleRes = await fetch(`${API_URL}/onboarding/sample?userEmail=${encodeURIComponent(TEST_USER_EMAIL)}`);
    const sampleData = await sampleRes.json();

    if (sampleData.emails.length === 0) {
        console.log('  ⚠ No emails to label — skipping');
        return;
    }

    const emailId = sampleData.emails[0].emailId;

    const res = await fetch(`${API_URL}/onboarding/label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userEmail: TEST_USER_EMAIL,
            emailId,
            label: 'important'
        })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.label.label, 'important');
});

test('POST /onboarding/label — invalid label returns 400', async () => {
    const res = await fetch(`${API_URL}/onboarding/label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userEmail: TEST_USER_EMAIL,
            emailId: 'any_id',
            label: 'invalid_label'
        })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.ok(data.error.includes('Invalid label'));
});

test('POST /onboarding/label — re-labeling same email (upsert)', async () => {
    const sampleRes = await fetch(`${API_URL}/onboarding/sample?userEmail=${encodeURIComponent(TEST_USER_EMAIL)}`);
    const sampleData = await sampleRes.json();

    if (sampleData.emails.length === 0) {
        console.log('  ⚠ No emails to label — skipping');
        return;
    }

    const emailId = sampleData.emails[0].emailId;

    // Label as important
    await fetch(`${API_URL}/onboarding/label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: TEST_USER_EMAIL, emailId, label: 'important' })
    });

    // Re-label as not_important
    const res = await fetch(`${API_URL}/onboarding/label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: TEST_USER_EMAIL, emailId, label: 'not_important' })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.label.label, 'not_important', 'Label should be updated to not_important');
});

test('POST /onboarding/label — missing fields returns 400', async () => {
    const res = await fetch(`${API_URL}/onboarding/label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: TEST_USER_EMAIL })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.ok(data.error);
});

// ═══════════════════════════════════════════════════════════════════
// GET /onboarding/progress
// ═══════════════════════════════════════════════════════════════════

test('POST /onboarding/reset — clears sample and onboarding labels', async () => {
    // Check it's clean at the end
    await resetOnboarding();
    const sample = await OnboardingSample.findOne({ userEmail: TEST_USER_EMAIL });
    const labels = await EmailLabel.countDocuments({ userEmail: TEST_USER_EMAIL, source: 'onboarding' });
    
    assert.strictEqual(sample, null);
    assert.strictEqual(labels, 0);
});

test('POST /onboarding/label — upserts new User with labelVersion=1 for brand new user', async () => {
    const brandNewUser = "new_user_no_doc@example.com";
    
    // Ensure user doesn't exist
    await User.deleteOne({ email: brandNewUser });
    
    const res = await fetch(`${API_URL}/onboarding/label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userEmail: brandNewUser,
            emailId: 'some_new_email_id',
            label: 'important'
        })
    });
    
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    
    // Check if the user document was actually created with labelVersion = 1
    const userDoc = await User.findOne({ email: brandNewUser });
    assert.ok(userDoc !== null, "User document should have been created by upsert");
    assert.strictEqual(userDoc.labelVersion, 1, "labelVersion should be 1 for brand new user");
    
    // Cleanup
    await User.deleteOne({ email: brandNewUser });
    await EmailLabel.deleteOne({ userEmail: brandNewUser });
});

test('GET /onboarding/progress — returns counts', async () => {
    const res = await fetch(`${API_URL}/onboarding/progress?userEmail=${encodeURIComponent(TEST_USER_EMAIL)}`);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(typeof data.labeled, 'number');
    assert.strictEqual(typeof data.total, 'number');
    assert.strictEqual(typeof data.complete, 'boolean');
});

test('GET /onboarding/progress — 400 without userEmail', async () => {
    const res = await fetch(`${API_URL}/onboarding/progress`);
    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.ok(data.error);
});

// ═══════════════════════════════════════════════════════════════════
// POST /onboarding/skip-remaining
// ═══════════════════════════════════════════════════════════════════

test('POST /onboarding/skip-remaining — marks remaining as skipped', async () => {
    // Ensure a clean sample exists for this test
    await resetOnboarding();
    const sampleRes = await fetch(`${API_URL}/onboarding/sample?userEmail=${encodeURIComponent(TEST_USER_EMAIL)}`);
    const sampleData = await sampleRes.json();

    if (sampleData.emails.length === 0) {
        console.log('  ⚠ No emails for skip test — skipping');
        return;
    }

    const res = await fetch(`${API_URL}/onboarding/skip-remaining`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: TEST_USER_EMAIL })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(typeof data.skipped, 'number');
    assert.ok(data.skipped > 0, 'Should have skipped at least 1 email');

    // After skipping, progress should show complete
    const progressRes = await fetch(`${API_URL}/onboarding/progress?userEmail=${encodeURIComponent(TEST_USER_EMAIL)}`);
    const progressData = await progressRes.json();
    assert.strictEqual(progressData.complete, true, 'Should be complete after skip-remaining');
});

test('POST /onboarding/skip-remaining — 400 without userEmail', async () => {
    const res = await fetch(`${API_URL}/onboarding/skip-remaining`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });

    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.ok(data.error);
});

// ═══════════════════════════════════════════════════════════════════
// POST /onboarding/reset
// ═══════════════════════════════════════════════════════════════════

test('POST /onboarding/reset — clears onboarding data', async () => {
    const res = await fetch(`${API_URL}/onboarding/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: TEST_USER_EMAIL })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(typeof data.deletedSamples, 'number');
    assert.strictEqual(typeof data.deletedLabels, 'number');

    // After reset, progress should show 0
    const progressRes = await fetch(`${API_URL}/onboarding/progress?userEmail=${encodeURIComponent(TEST_USER_EMAIL)}`);
    const progressData = await progressRes.json();
    assert.strictEqual(progressData.labeled, 0, 'Labeled should be 0 after reset');
    assert.strictEqual(progressData.total, 0, 'Total should be 0 after reset (sample cleared)');
});

test('POST /onboarding/reset — 400 without userEmail', async () => {
    const res = await fetch(`${API_URL}/onboarding/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });

    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.ok(data.error);
});

// ═══════════════════════════════════════════════════════════════════
// End-to-end flow: sample → label → progress → reset → re-sample
// ═══════════════════════════════════════════════════════════════════

test('E2E: full onboarding flow — sample, label, check progress, reset, re-sample', async () => {
    // 1. Reset to clean state
    await resetOnboarding();

    // 2. Get sample
    const sampleRes = await fetch(`${API_URL}/onboarding/sample?userEmail=${encodeURIComponent(TEST_USER_EMAIL)}`);
    const sampleData = await sampleRes.json();
    assert.strictEqual(sampleRes.status, 200);

    if (sampleData.emails.length === 0) {
        console.log('  ⚠ No emails for E2E flow — skipping');
        return;
    }

    const firstEmailId = sampleData.emails[0].emailId;
    const originalTotal = sampleData.total;

    // 3. Label first email
    const labelRes = await fetch(`${API_URL}/onboarding/label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userEmail: TEST_USER_EMAIL,
            emailId: firstEmailId,
            label: 'important'
        })
    });
    assert.strictEqual(labelRes.status, 200);

    // 4. Check progress
    const progressRes = await fetch(`${API_URL}/onboarding/progress?userEmail=${encodeURIComponent(TEST_USER_EMAIL)}`);
    const progressData = await progressRes.json();
    assert.ok(progressData.labeled >= 1, 'Should have at least 1 labeled');

    // 5. Reset
    const resetRes = await fetch(`${API_URL}/onboarding/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: TEST_USER_EMAIL })
    });
    assert.strictEqual(resetRes.status, 200);

    // 6. Re-sample — should generate a new sample (not necessarily identical since reset clears it)
    const reSampleRes = await fetch(`${API_URL}/onboarding/sample?userEmail=${encodeURIComponent(TEST_USER_EMAIL)}`);
    const reSampleData = await reSampleRes.json();
    assert.strictEqual(reSampleRes.status, 200);
    assert.ok(Array.isArray(reSampleData.emails), 'Should return emails after reset + re-sample');

    // 7. Verify progress is back to 0
    const finalProgressRes = await fetch(`${API_URL}/onboarding/progress?userEmail=${encodeURIComponent(TEST_USER_EMAIL)}`);
    const finalProgressData = await finalProgressRes.json();
    assert.strictEqual(finalProgressData.labeled, 0, 'Should be 0 labeled after reset');
});
