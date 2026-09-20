import React, { useState, useEffect, useRef } from "react";
import svgPaths from "../imports/Html→Body-2/svg-9eyoj0uxqg";
import imgUserAvatar from "../imports/Html→Body-2/3d16bb95b2a6f2c06c620b3e84b11991da111c9a.png";
import { apiFetch } from "../utils/api.ts";
import { useWeather, type WeatherData } from "../utils/weather.ts";
import NavRail, { Avatar, AssistantIcon, getStoredUser } from "../components/NavRail.tsx";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatSession {
  _id: string;
  title: string;
  status: "ACTIVE" | "ARCHIVED" | "SHARED";
  updatedAt: string;
  messages?: { role: MessageRole; content: string; timestamp: string }[];
}
type MessageRole = "user" | "ai";
interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  streaming?: boolean;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      // No email needed — backend reads it from the JWT cookie
      const res = await apiFetch('/chat/sessions');
      if (res.ok) setSessions(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);
  return { sessions, loading, refresh };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatSessionDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diff < 172800000) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ── TOP HEADER ────────────────────────────────────────────────────────────────
function TopHeader({ weather }: { weather: WeatherData | null }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }).toUpperCase();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="flex items-center justify-between pr-[16px] w-full shrink-0">
      {/* Title + Date */}
      <div className="flex flex-col gap-[3.5px]">
        <h1 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[36px] text-black tracking-[-0.9px] leading-[40px] whitespace-nowrap">
          MailSense
        </h1>
        <div className="flex items-center gap-[8px]">
          <span className="font-['Inter:Medium',sans-serif] font-medium text-[#6b7280] text-[14px] leading-[20px]">{dateStr}</span>
        </div>
      </div>
      {/* Controls */}
      <div className="flex items-center gap-[16px]">
        {/* Weather chip */}
        <div className="bg-white rounded-full drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex items-center gap-[12px] px-[16px] py-[8px] shrink-0">
          <div className="flex items-center gap-[4px]">
            <svg fill="none" viewBox="0 0 16 16" width="16" height="16">
              <path d={svgPaths.p80220e0} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
            </svg>
            <span className="font-['Inter:Medium',sans-serif] font-medium text-black text-[12px] leading-[16px]">{timeStr}</span>
          </div>
          <div className="flex items-center gap-[4px]">
            <svg fill="none" viewBox="0 0 16 16" width="16" height="16">
              <path d={svgPaths.p36e88e80} fill="#FB923C" />
            </svg>
            <span className="font-['Inter:Medium',sans-serif] font-medium text-black text-[12px] leading-[16px]">
              {weather ? `${weather.temp}° ${weather.label}` : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CHAT WORKSPACE ────────────────────────────────────────────────────────────
interface ChatWorkspaceProps {
  userEmail?: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isStreaming: boolean;
  setIsStreaming: (v: boolean) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  onSessionsChanged: () => void;
}

function ChatWorkspace({ userEmail, messages, setMessages, isStreaming, setIsStreaming, activeId, setActiveId, onSessionsChanged }: ChatWorkspaceProps) {
  const user = getStoredUser();
  const [inputValue, setInputValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const question = inputValue.trim();
    if (!question || isStreaming) return;
    const email = userEmail || user.email || "";
    if (!email) return;

    setInputValue("");
    setIsStreaming(true);

    // First message of a new chat: create the session (titled from the question) so it is saved to History
    let sessionId = activeId;
    if (!sessionId) {
      try {
        const created = await apiFetch("/chat/sessions", {
          method: "POST",
          body: JSON.stringify({ title: question.length > 48 ? `${question.slice(0, 48)}…` : question }),
        });
        if (created.ok) {
          sessionId = (await created.json())._id;
          setActiveId(sessionId);
        }
      } catch { /* chat still works, it just won't be saved */ }
    }

    // Append user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    // Append empty streaming AI message
    const aiId = `ai-${Date.now()}`;
    setMessages(prev => [...prev, { id: aiId, role: "ai", content: "", timestamp: new Date(), streaming: true }]);

    try {
      // No userEmail in body — backend reads it from the JWT cookie
      const res = await apiFetch('/ask', {
        method: "POST",
        body: JSON.stringify({ question, sessionId }),
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
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const chunk = JSON.parse(jsonStr);
            if (chunk.text_delta) {
              setMessages(prev =>
                prev.map(m =>
                  m.id === aiId ? { ...m, content: m.content + chunk.text_delta } : m
                )
              );
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setMessages(prev =>
        prev.map(m => m.id === aiId ? { ...m, content: `Error: ${msg}` } : m)
      );
    } finally {
      // Mark streaming done
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, streaming: false } : m));
      setIsStreaming(false);
      onSessionsChanged();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-white flex-1 min-w-0 rounded-[40px] border border-[rgba(255,255,255,0.5)] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-[32px] pt-[24px] pb-[25px] border-b border-[#f3f4f6] shrink-0">
        <div className="flex items-center gap-[16px]">
          <div className="bg-[#f9fafb] border border-[#f3f4f6] rounded-[24px] w-[48px] h-[48px] flex items-center justify-center shrink-0">
            <AssistantIcon size={26} />
          </div>
          <div>
            <p className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-black leading-[28px]">Itatshu, Your AI assistant</p>
            <div className="flex items-center gap-[8px] mt-[2px]">
              <div className={`w-[8px] h-[8px] rounded-full ${isStreaming ? "bg-yellow-400" : "bg-[#22c55e]"}`} />
              <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#9ca3af] text-[12px] tracking-[0.6px] uppercase leading-[16px]">
                {isStreaming ? "THINKING..." : "SYSTEMS LIVE"}
              </span>
            </div>
          </div>
        </div>
        <button className="p-[8px] rounded-full hover:bg-gray-100 transition">
          <svg fill="none" viewBox="0 0 24 24" width="24" height="24">
            <path d={svgPaths.p2e0fe800} stroke="#9CA3AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-0 py-0">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-[32px] gap-[8px]">
            <p className="font-['Inter:Bold',sans-serif] font-bold text-[18px] text-black">Ask anything about your emails</p>
            <p className="font-['Inter:Regular',sans-serif] text-[14px] text-[#9ca3af] max-w-[420px]">
              Search deadlines, senders or topics. Your conversations are saved to History on the right.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === "ai" ? (
              <div className="flex items-start gap-[16px] px-[32px] pt-[24px] pb-[8px]">
                <div className="bg-[#f3f4f6] border border-[#e5e7eb] rounded-[8px] w-[32px] h-[32px] flex items-center justify-center shrink-0 mt-[2px]">
                  <AssistantIcon size={18} />
                </div>
                <div className="bg-[#f9fafb] border border-[#f3f4f6] rounded-bl-[32px] rounded-br-[32px] rounded-tr-[32px] px-[25px] pt-[20px] pb-[20px] max-w-[600px]">
                  <p className="font-['Inter:Regular',sans-serif] font-normal text-[#374151] text-[14px] leading-[22px] whitespace-pre-wrap">
                    {msg.content}
                    {msg.streaming && (
                      <span className="inline-block w-[2px] h-[14px] bg-[#374151] ml-[2px] align-middle animate-pulse" />
                    )}
                  </p>
                  {!msg.streaming && (
                    <p className="font-['Inter:Bold',sans-serif] font-bold text-[#9ca3af] text-[10px] uppercase leading-[15px] mt-[12px]">
                      {fmtTime(msg.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-[16px] px-[32px] pt-[24px] pb-[8px] justify-end">
                <div className="bg-[#111] rounded-bl-[32px] rounded-br-[32px] rounded-tl-[32px] px-[24px] pt-[20px] pb-[20px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] max-w-[600px]">
                  <p className="font-['Inter:Regular',sans-serif] font-normal text-[#e5e7eb] text-[14px] leading-[22px] whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  <p className="font-['Inter:Bold',sans-serif] font-bold text-[#6b7280] text-[10px] uppercase leading-[15px] mt-[12px] text-right">
                    {fmtTime(msg.timestamp)}
                  </p>
                </div>
                <div className="w-[32px] h-[32px] rounded-full overflow-hidden shrink-0 border-2 border-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] mt-[2px]">
                  <Avatar src={user.avatar || imgUserAvatar} className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} className="h-[8px]" />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-[#f3f4f6] px-[32px] pt-[33px] pb-[32px] shrink-0">
        <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-full flex items-center p-[9px]">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your emails..."
            disabled={isStreaming}
            className="flex-1 px-[20px] bg-transparent outline-none font-['Inter:Regular',sans-serif] font-normal text-[#374151] text-[14px] placeholder-[#9ca3af] disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={isStreaming || !inputValue.trim()}
            className="bg-black rounded-full w-[48px] h-[48px] flex items-center justify-center shrink-0 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] disabled:opacity-40 transition"
          >
            <svg fill="none" viewBox="0 0 20 20" width="20" height="20">
              <path d={svgPaths.p25f63580} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── HISTORY PANEL ─────────────────────────────────────────────────────────────
interface HistoryPanelProps {
  sessions: ChatSession[];
  loading: boolean;
  activeId: string | null;
  disabled: boolean;
  onSelect: (s: ChatSession) => void;
  onNew: () => void;
}

function HistoryPanel({ sessions, loading, activeId, disabled, onSelect, onNew }: HistoryPanelProps) {
  return (
    <div className="shrink-0 w-[270px] h-full">
      <div className="backdrop-blur-[5px] bg-[rgba(255,255,255,0.7)] rounded-[40px] border border-[rgba(255,255,255,0.3)] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] h-full flex flex-col p-[33px] overflow-hidden">
        <div className="flex items-center justify-between mb-[24px] shrink-0">
          <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-black leading-[28px]">History</h2>
          <button
            onClick={onNew}
            disabled={disabled}
            title="New chat"
            className="w-[32px] h-[32px] rounded-full bg-black text-white flex items-center justify-center text-[20px] leading-none hover:opacity-80 disabled:opacity-40 transition"
            type="button"
          >
            +
          </button>
        </div>

        <div className="flex flex-col gap-[16px] overflow-y-auto">
          {loading && sessions.length === 0 && (
            <p className="font-['Inter:Regular',sans-serif] text-[#9ca3af] text-[12px]">Loading...</p>
          )}

          {!loading && sessions.length === 0 && (
            <p className="font-['Inter:Regular',sans-serif] text-[#9ca3af] text-[12px]">No conversations yet. Ask something to start one.</p>
          )}

          {sessions.map((session) => {
            const isActive = session._id === activeId;
            return (
              <button
                key={session._id}
                onClick={() => onSelect(session)}
                disabled={disabled}
                type="button"
                className={
                  (isActive
                    ? "bg-black rounded-[32px] p-[20px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]"
                    : "bg-[rgba(255,255,255,0.5)] border border-[#f3f4f6] rounded-[32px] p-[21px] hover:bg-white") +
                  " shrink-0 text-left w-full transition disabled:cursor-not-allowed"
                }
              >
                <p className={`font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] leading-[20px] mb-[12px] line-clamp-2 ${isActive ? "text-white" : "text-[#374151]"}`}>
                  {session.title}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-['Inter:Bold',sans-serif] font-bold text-[10px] uppercase leading-[15px] text-[#9ca3af]">
                    {(session.messages?.length ?? 0)} msgs
                  </span>
                  <span className={`font-['Inter:Regular',sans-serif] font-normal text-[10px] leading-[15px] ${isActive ? "text-[#6b7280]" : "text-[#9ca3af]"}`}>
                    {formatSessionDate(session.updatedAt)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── PAGE ROOT ─────────────────────────────────────────────────────────────────
export default function AIChatPage() {
  const user = getStoredUser();
  const weather = useWeather();
  const { sessions, loading, refresh } = useSessions(); // no email needed
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const selectSession = (session: ChatSession) => {
    if (isStreaming) return;
    setActiveId(session._id);
    setMessages(
      (session.messages ?? []).map((m, i) => ({
        id: `${session._id}-${i}`,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp),
      }))
    );
  };

  const newChat = () => {
    if (isStreaming) return;
    setActiveId(null);
    setMessages([]);
  };

  return (
    <div className="w-full min-h-screen relative" style={{ background: "rgb(226,228,231)" }}>
      <div className="flex gap-[16px] items-start p-[16px] w-full h-screen">
        <NavRail active="ai-chat" />
        <div className="flex flex-col flex-1 min-w-0 gap-[24px] h-full overflow-hidden">
          <TopHeader weather={weather} />
          <div className="flex gap-[24px] flex-1 min-h-0 overflow-hidden">
            <ChatWorkspace
              userEmail={user.email}
              messages={messages}
              setMessages={setMessages}
              isStreaming={isStreaming}
              setIsStreaming={setIsStreaming}
              activeId={activeId}
              setActiveId={setActiveId}
              onSessionsChanged={refresh}
            />
            <HistoryPanel
              sessions={sessions}
              loading={loading}
              activeId={activeId}
              disabled={isStreaming}
              onSelect={selectSession}
              onNew={newChat}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
