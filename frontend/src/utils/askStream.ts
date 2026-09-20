import { apiFetch } from "./api.ts";

/** Creates a saved chat session (shows up in the AI chat History) and returns its id, or null on failure. */
export async function createChatSession(title: string): Promise<string | null> {
  try {
    const res = await apiFetch("/chat/sessions", {
      method: "POST",
      body: JSON.stringify({ title: title.length > 48 ? `${title.slice(0, 48)}…` : title }),
    });
    if (!res.ok) return null;
    return (await res.json())._id ?? null;
  } catch {
    return null;
  }
}

/**
 * Asks the assistant a question and streams the answer.
 * `onDelta` is called with each piece of text as it arrives. Throws on a
 * transport error or if the server reports one mid-stream.
 */
export async function streamAnswer(
  question: string,
  sessionId: string | null,
  onDelta: (text: string) => void
): Promise<void> {
  const res = await apiFetch("/ask", {
    method: "POST",
    body: JSON.stringify({ question, sessionId: sessionId ?? undefined }),
  });
  if (!res.ok || !res.body) throw new Error(`Server error ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (!json) continue;
      let chunk: { text_delta?: string; error?: string };
      try { chunk = JSON.parse(json); } catch { continue; }
      if (chunk.error) throw new Error(chunk.error);
      if (chunk.text_delta) onDelta(chunk.text_delta);
    }
  }
}
