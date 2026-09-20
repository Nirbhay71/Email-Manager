import { useEffect, useRef, useState } from "react";
import { AssistantIcon, getStoredUser, goTo } from "../NavRail.tsx";
import { createChatSession, streamAnswer } from "../../utils/askStream.ts";
import type { InboxEmail } from "./InboxCard.tsx";

interface Turn { id: number; role: "user" | "ai"; content: string; streaming?: boolean }

function shorten(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Suggested prompts built from what is actually in the mailbox. */
function buildSuggestions(latest: InboxEmail | null, deadlines: number): string[] {
  const out: string[] = [];
  if (latest?.subject) out.push(`Summarize “${shorten(latest.subject, 34)}”`);
  if (deadlines > 0) out.push(deadlines === 1 ? "What is my upcoming deadline?" : `What are my ${deadlines} deadlines?`);
  if (latest) out.push("What arrived most recently?");
  return out.slice(0, 3);
}

export default function AssistantCard({ latest, deadlines }: { latest: InboxEmail | null; deadlines: number }) {
  const user = getStoredUser();
  const name = user.name || (user.email ? user.email.split("@")[0] : "there");

  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const sessionRef = useRef<string | null>(null);
  const nextId = useRef(1);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  const ask = async (raw: string) => {
    const question = raw.trim();
    if (!question || busy) return;
    setInput("");
    setBusy(true);

    const aiId = nextId.current + 1;
    setTurns((t) => [
      ...t,
      { id: nextId.current, role: "user", content: question },
      { id: aiId, role: "ai", content: "", streaming: true },
    ]);
    nextId.current += 2;

    // First question creates a saved session so it also appears in the AI chat History
    if (!sessionRef.current) sessionRef.current = await createChatSession(question);

    try {
      await streamAnswer(question, sessionRef.current, (delta) =>
        setTurns((t) => t.map((m) => (m.id === aiId ? { ...m, content: m.content + delta } : m)))
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setTurns((t) => t.map((m) => (m.id === aiId ? { ...m, content: `Sorry, I couldn't answer that. (${msg})` } : m)));
    } finally {
      setTurns((t) => t.map((m) => (m.id === aiId ? { ...m, streaming: false } : m)));
      setBusy(false);
    }
  };

  const suggestions = buildSuggestions(latest, deadlines);

  return (
    <section className="bg-[#111] text-white rounded-[32px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] flex flex-col min-h-0 h-full p-[24px]">
      {/* Header */}
      <div className="flex items-center gap-[14px] shrink-0">
        <span
          aria-hidden
          className={`w-[44px] h-[44px] rounded-full shrink-0 bg-[radial-gradient(circle_at_30%_25%,#93c5fd,#e5e7eb_55%,#6b7280)] ${busy ? "animate-pulse" : ""}`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] tracking-[1.5px] uppercase text-[#9ca3af] truncate">{busy ? "Thinking…" : "Assistant"}</p>
          <p className="text-[16px] font-semibold truncate">Hello, {name}</p>
        </div>
        <button
          onClick={() => goTo("/ai-chat")}
          className="text-[12px] font-semibold text-[#d1d5db] hover:text-white border border-white/15 hover:border-white/40 rounded-full px-[12px] py-[6px] transition shrink-0"
          type="button"
        >
          Open chat
        </button>
      </div>

      {/* Conversation */}
      <div ref={scroller} className="flex-1 min-h-0 overflow-y-auto mt-[16px] flex flex-col gap-[12px] pr-[4px]">
        {turns.length === 0 ? (
          <div className="m-auto text-center px-[12px]">
            <span className="inline-flex text-[#9ca3af] mb-[8px]"><AssistantIcon size={28} /></span>
            <p className="text-[14px] text-[#d1d5db]">
              {latest ? "Ask me anything about your mail." : "Once mail arrives, ask me anything about it."}
            </p>
          </div>
        ) : (
          turns.map((m) => (
            <div key={m.id} className={m.role === "user" ? "self-end max-w-[85%]" : "self-start max-w-[92%] flex gap-[8px]"}>
              {m.role === "ai" && (
                <span className="w-[24px] h-[24px] rounded-full bg-white/10 text-[#d1d5db] flex items-center justify-center shrink-0 mt-[2px]">
                  <AssistantIcon size={14} />
                </span>
              )}
              <p className={`text-[13px] leading-[20px] whitespace-pre-wrap rounded-[18px] px-[14px] py-[10px] ${m.role === "user" ? "bg-white text-black" : "bg-white/10 text-[#e5e7eb]"}`}>
                {m.content || (m.streaming ? "…" : "")}
                {m.streaming && m.content && <span className="inline-block w-[2px] h-[12px] bg-[#e5e7eb] ml-[2px] align-middle animate-pulse" />}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Suggestions */}
      {turns.length === 0 && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-[8px] mt-[12px] shrink-0">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              disabled={busy}
              className="text-[12px] text-[#d1d5db] border border-white/15 hover:border-white/40 hover:text-white rounded-full px-[12px] py-[6px] transition text-left"
              type="button"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); ask(input); }}
        className="flex items-center gap-[8px] mt-[12px] pt-[12px] border-t border-white/10 shrink-0"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your emails…"
          disabled={busy}
          className="flex-1 min-w-0 bg-transparent outline-none text-[14px] placeholder-[#6b7280] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send"
          className="w-[36px] h-[36px] rounded-full bg-white text-black flex items-center justify-center shrink-0 disabled:opacity-30 hover:opacity-90 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
      </form>
    </section>
  );
}
