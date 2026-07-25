import test from 'node:test';
import assert from 'node:assert';

const API_URL = 'http://localhost:5000';

test('Integration Test: /search/v2 - Success Path', async (t) => {
    const res = await fetch(`${API_URL}/search/v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'budget review', userEmail: 'bench@test.com' })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(data.results));
    assert.strictEqual(typeof data.degraded, 'boolean');
});

test('Integration Test: /search/v2 - 400 Bad Query', async (t) => {
    const res = await fetch(`${API_URL}/search/v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: 'bench@test.com' }) // missing query
    });
    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.error, 'query is required');
});

test('Integration Test: /search/v2 - 500 Internal Error (User Email missing)', async (t) => {
    const res = await fetch(`${API_URL}/search/v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'budget review' }) // missing userEmail
    });
    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.error, 'userEmail is required');
});

// For 503 testing, we'd need to mock or shut down the gRPC server. Since we can't easily shut it down here, 
// we'll run a request to a bad port to simulate 503. The route currently returns 500 on all gRPC errors.
// Wait, the spec said "503 (search service unreachable), ... and 500 (internal error)".
// In my search.routes.js I wrote:
// if (err) { return res.status(500).json({ error: "Internal search service error" }); }
// I should update search.routes.js to return 503 if the service is unreachable!
