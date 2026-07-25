import test from 'node:test';
import assert from 'node:assert';

const API_URL = 'http://localhost:5000';

test('Integration Test: /ask - Success Path', async (t) => {
    const res = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'what is my budget?', userEmail: 'bench@test.com' })
    });
    
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('Content-Type'), 'text/event-stream');
    
    // Read the stream
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let output = '';
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        output += chunk;
        if (output.includes('data: {"is_final":true')) break;
    }
    
    assert.ok(output.includes('data: {'));
});
