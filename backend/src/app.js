import express from "express";
import authRoutes from "./routes/auth.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import askRoutes from "./routes/ask.routes.js";
import searchRoutes from "./routes/search.routes.js";
import onboardingRoutes from "./routes/onboarding.routes.js";
import interactionRoutes from "./routes/interaction.routes.js";
import inboxRoutes from "./routes/inbox.routes.js";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/webhook", webhookRoutes);
app.use("/ask", askRoutes);
app.use("/search", searchRoutes);
app.use("/onboarding", onboardingRoutes);
app.use("/interaction", interactionRoutes);
app.use("/inbox", inboxRoutes);

app.get("/", (req, res) => {
    res.send("AI Email Manager — go to /auth/google to register.");
});

app.get("/test-ai", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Email Assistant - Live Console</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0b0816;
            --card-bg: rgba(20, 16, 38, 0.6);
            --border-color: rgba(255, 255, 255, 0.08);
            --accent-primary: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
            --accent-hover: linear-gradient(135deg, #c084fc 0%, #818cf8 100%);
            --text-primary: #f3f4f6;
            --text-secondary: #9ca3af;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: var(--bg-color);
            background-image: 
                radial-gradient(at 0% 0%, rgba(168, 85, 247, 0.15) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(99, 102, 241, 0.15) 0px, transparent 50%);
            font-family: 'Outfit', sans-serif;
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2rem;
            overflow-x: hidden;
        }

        .container {
            width: 100%;
            max-width: 800px;
            background: var(--card-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border-color);
            border-radius: 24px;
            padding: 2.5rem;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        }

        h1 {
            font-size: 2.5rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
            background: var(--accent-primary);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.025em;
        }

        p.subtitle {
            color: var(--text-secondary);
            margin-bottom: 2rem;
            font-size: 1.1rem;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        label {
            display: block;
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-secondary);
        }

        input {
            width: 100%;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border-color);
            padding: 1rem 1.25rem;
            border-radius: 12px;
            color: var(--text-primary);
            font-family: inherit;
            font-size: 1rem;
            transition: all 0.3s ease;
        }

        input:focus {
            outline: none;
            border-color: #a855f7;
            background: rgba(255, 255, 255, 0.06);
            box-shadow: 0 0 15px rgba(168, 85, 247, 0.15);
        }

        button {
            width: 100%;
            background: var(--accent-primary);
            border: none;
            padding: 1.1rem;
            border-radius: 12px;
            color: white;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 20px rgba(99, 102, 241, 0.25);
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.5rem;
        }

        button:hover {
            background: var(--accent-hover);
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(168, 85, 247, 0.35);
        }

        button:active {
            transform: translateY(0);
        }

        button:disabled {
            background: rgba(255, 255, 255, 0.1);
            color: var(--text-secondary);
            cursor: not-allowed;
            box-shadow: none;
            transform: none;
        }

        .terminal-wrapper {
            margin-top: 2rem;
            background: #05030a;
            border: 1px solid var(--border-color);
            border-radius: 16px;
            overflow: hidden;
            display: none;
        }

        .terminal-header {
            background: rgba(255, 255, 255, 0.02);
            padding: 0.75rem 1.25rem;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .dots {
            display: flex;
            gap: 6px;
        }

        .dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }

        .dot.red { background-color: #ef4444; }
        .dot.yellow { background-color: #eab308; }
        .dot.green { background-color: #22c55e; }

        .terminal-title {
            font-size: 0.8rem;
            font-family: 'Fira Code', monospace;
            color: var(--text-secondary);
        }

        .terminal-body {
            padding: 1.5rem;
            font-family: 'Fira Code', monospace;
            font-size: 0.95rem;
            line-height: 1.6;
            max-height: 350px;
            overflow-y: auto;
            white-space: pre-wrap;
        }

        .cursor {
            display: inline-block;
            width: 8px;
            height: 15px;
            background-color: #a855f7;
            margin-left: 2px;
            animation: blink 1s infinite;
        }

        @keyframes blink {
            50% { opacity: 0; }
        }

        .sources-section {
            margin-top: 2rem;
            display: none;
        }

        .sources-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .sources-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        .source-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1rem 1.25rem;
            transition: all 0.3s ease;
        }

        .source-card:hover {
            border-color: rgba(168, 85, 247, 0.3);
            background: rgba(255, 255, 255, 0.04);
        }

        .source-subject {
            font-weight: 600;
            margin-bottom: 0.25rem;
        }

        .source-meta {
            font-size: 0.85rem;
            color: var(--text-secondary);
            display: flex;
            justify-content: space-between;
        }

        .loader {
            display: inline-block;
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>AI Email Assistant</h1>
        <p class="subtitle">Live response and streaming testing panel</p>

        <div class="form-group">
            <label for="userEmail">Registered Email</label>
            <input type="email" id="userEmail" value="nirbhayshingala71@gmail.com" placeholder="e.g. nirbhayshingala71@gmail.com">
        </div>

        <div class="form-group">
            <label for="question">Your Question</label>
            <input type="text" id="question" value="mail from unstop" placeholder="What would you like to ask about your emails?">
        </div>

        <button id="askBtn" onclick="askAI()">
            <span>Ask Gemini</span>
        </button>

        <div class="terminal-wrapper" id="terminalWrapper">
            <div class="terminal-header">
                <div class="dots">
                    <div class="dot red"></div>
                    <div class="dot yellow"></div>
                    <div class="dot green"></div>
                </div>
                <div class="terminal-title">gemini-stream.log</div>
            </div>
            <div class="terminal-body" id="terminalBody"></div>
        </div>

        <div class="sources-section" id="sourcesSection">
            <div class="sources-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                <span>Sources Used (<span id="sourceCount">0</span>)</span>
            </div>
            <div class="sources-grid" id="sourcesGrid"></div>
        </div>
    </div>

    <script>
        async function askAI() {
            const userEmail = document.getElementById('userEmail').value.trim();
            const question = document.getElementById('question').value.trim();
            const askBtn = document.getElementById('askBtn');
            const terminalWrapper = document.getElementById('terminalWrapper');
            const terminalBody = document.getElementById('terminalBody');
            const sourcesSection = document.getElementById('sourcesSection');
            const sourcesGrid = document.getElementById('sourcesGrid');

            if (!userEmail || !question) {
                alert('Please provide both your email and a question!');
                return;
            }

            // Reset UI
            askBtn.disabled = true;
            askBtn.innerHTML = '<span class="loader"></span> Generating...';
            terminalWrapper.style.display = 'block';
            sourcesSection.style.display = 'none';
            sourcesGrid.innerHTML = '';
            terminalBody.innerHTML = 'Connecting to gRPC pipeline...<span class="cursor"></span>';

            try {
                const response = await fetch('/ask', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question, userEmail })
                });

                if (!response.ok) {
                    throw new Error(\`Server returned \${response.status}\`);
                }

                terminalBody.innerHTML = ''; // Clear connecting status
                const reader = response.body.getReader();
                const decoder = new TextDecoder('utf-8');
                let buffer = '';

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\\n');
                    buffer = lines.pop(); // Keep the last partial line

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataStr = line.slice(6);
                            if (dataStr.trim()) {
                                try {
                                    const parsed = JSON.parse(dataStr);
                                    
                                    if (parsed.error) {
                                        terminalBody.innerHTML += \`\\n[Error]: \${parsed.error}\`;
                                        break;
                                    }

                                    if (parsed.text_delta) {
                                        // Remove cursor if present, add text, then re-append cursor
                                        const cursor = terminalBody.querySelector('.cursor');
                                        if (cursor) cursor.remove();
                                        terminalBody.innerHTML += parsed.text_delta;
                                        terminalBody.innerHTML += '<span class="cursor"></span>';
                                        
                                        // Auto scroll terminal
                                        terminalBody.scrollTop = terminalBody.scrollHeight;
                                    }

                                    if (parsed.is_final && parsed.sources && parsed.sources.length > 0) {
                                        // Remove final cursor
                                        const cursor = terminalBody.querySelector('.cursor');
                                        if (cursor) cursor.remove();

                                        // Render sources
                                        document.querySelector('.sources-title span').textContent = \`Sources Used (\${parsed.sources.length})\`;
                                        parsed.sources.forEach(src => {
                                            const scorePercent = Math.min(Math.round(src.score * 10000) / 100, 100);
                                            const card = document.createElement('div');
                                            card.className = 'source-card';
                                            card.innerHTML = \`
                                                <div class="source-subject">\${src.subject || 'No Subject'}</div>
                                                <div class="source-meta">
                                                    <span>ID: \${src.message_id}</span>
                                                    <span>Relevance Rank Score: \${src.score.toFixed(4)}</span>
                                                </div>
                                            \`;
                                            sourcesGrid.appendChild(card);
                                        });
                                        sourcesSection.style.display = 'block';
                                    }
                                } catch (e) {
                                    console.error('Error parsing chunk JSON:', e);
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                terminalBody.innerHTML = \`\\n[Connection Error]: \${err.message}\`;
            } finally {
                askBtn.disabled = false;
                askBtn.innerHTML = 'Ask Gemini';
                const cursor = terminalBody.querySelector('.cursor');
                if (cursor) cursor.remove();
            }
        }
    </script>
</body>
</html>
    `);
});

export default app;