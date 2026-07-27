import React, { useState, useEffect, useRef } from "react";
import svgPaths from "../imports/Html→Body-2/svg-9eyoj0uxqg";
import imgUser from "../imports/Html→Body-2/4a1497f7eb1ac52188d5053d788a4d72df0d0413.png";
import imgAiAssistant from "../imports/Html→Body-2/09d34397fc5dfe77be0866af9c35f049cbca10fe.png";
import imgUserAvatar from "../imports/Html→Body-2/3d16bb95b2a6f2c06c620b3e84b11991da111c9a.png";

const BACKEND = "http://localhost:5000";

function getStoredUser(): { email?: string; avatar?: string; name?: string } {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem("user") || "{}"); }
  catch { return {}; }
}

function goTo(path: string) {
  if (window.location.pathname !== path || window.location.search) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}

// ── Weather description → simple label ───────────────────────────────────────
function wmoLabel(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code <= 9) return "Foggy";
  if (code <= 19) return "Drizzle";
  if (code <= 29) return "Rain";
  if (code <= 39) return "Snow";
  if (code <= 49) return "Fog";
  if (code <= 59) return "Drizzle";
  if (code <= 69) return "Rain";
  if (code <= 79) return "Snow";
  if (code <= 84) return "Showers";
  if (code <= 94) return "Thunder";
  return "Stormy";
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface WeatherData { temp: number; label: string }
interface ChatSession {
  _id: string;
  title: string;
  status: "ACTIVE" | "ARCHIVED" | "SHARED";
  updatedAt: string;
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

function useWeather(): WeatherData | null {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current_weather=true`;
          const res = await fetch(url);
          const data = await res.json();
          const { temperature, weathercode } = data.current_weather;
          setWeather({ temp: Math.round(temperature), label: wmoLabel(weathercode) });
        } catch { /* silent */ }
      },
      async () => {
        // fallback: IP-based coords via open-meteo doesn't need location; use default
        try {
          const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=20&longitude=77&current_weather=true");
          const data = await res.json();
          const { temperature, weathercode } = data.current_weather;
          setWeather({ temp: Math.round(temperature), label: wmoLabel(weathercode) });
        } catch { /* silent */ }
      }
    );
  }, []);
  return weather;
}

function useSessions(email?: string) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/chat/sessions?email=${encodeURIComponent(email)}`);
      if (res.ok) setSessions(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [email]);
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

// ── LEFT NAV RAIL ─────────────────────────────────────────────────────────────
function NavRail() {
  const user = getStoredUser();
  return (
    <div className="bg-white rounded-[32px] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] sticky top-[16px] h-[calc(100vh-32px)] w-[80px] shrink-0 flex flex-col items-center justify-between py-[32px]">
      <div className="flex flex-col items-center gap-[40px]">
        {/* Logo */}
        <div className="bg-black rounded-full w-[40px] h-[40px] flex items-center justify-center shrink-0">
          <span className="font-['Inter:Bold',sans-serif] font-bold text-white text-[20px] leading-[28px]">C</span>
        </div>
        {/* Nav Icons */}
        <div className="flex flex-col gap-[24px] items-center w-[40px]">
          <button onClick={() => goTo("/inbox")} className="rounded-[12px] w-full p-[8px] hover:bg-black/10 transition">
            <svg fill="none" viewBox="0 0 24 24" width="24" height="24">
              <path d={svgPaths.p42a6600} stroke="#9CA3AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
          <button onClick={() => goTo("/management")} className="rounded-[12px] w-full p-[8px] hover:bg-black/10 transition">
            <svg fill="none" viewBox="0 0 24 24" width="24" height="24">
              <path d={svgPaths.p12978b80} stroke="#9CA3AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
          <button onClick={() => goTo("/ai-chat")} className="bg-black rounded-[12px] w-full p-[8px]">
            <svg fill="none" viewBox="0 0 24 24" width="24" height="24">
              <path d={svgPaths.p2373ef00} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </div>
      {/* User Avatar */}
      <div className="flex flex-col items-center gap-[16px]">
        <div className="relative shrink-0">
          <div className="w-[40px] h-[40px] rounded-full overflow-hidden relative">
            <img alt="" className="absolute left-0 top-0 w-full h-full object-cover" src={user.avatar || imgUser} />
            <div className="absolute inset-0 border-2 border-white rounded-full pointer-events-none" />
          </div>
          <div className="absolute bottom-[-4px] right-[-4px] w-[12px] h-[12px] bg-[#22c55e] rounded-full border-2 border-white" />
        </div>
        <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#6b7280] text-[10px] leading-[15px]">
          {user.name ? user.name.split(" ")[0] : "Profile"}
        </span>
      </div>
    </div>
  );
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
          <svg fill="none" viewBox="0 0 16 16" width="16" height="16">
            <path d={svgPaths.p2b6e9900} stroke="#6B7280" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
          <span className="font-['Inter:Medium',sans-serif] font-medium text-[#6b7280] text-[14px] leading-[20px]">{dateStr}</span>
          <svg fill="none" viewBox="0 0 12 12" width="12" height="12">
            <path d="M9.5 4.5L6 8L2.5 4.5" stroke="#6B7280" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
      {/* Controls */}
      <div className="flex items-center gap-[16px]">
        {/* Camera */}
        <div className="bg-black rounded-full p-[12px] shrink-0 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
          <svg fill="none" viewBox="0 0 20 20" width="20" height="20">
            <path d={svgPaths.p35ec9d00} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>
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
        {/* Search */}
        <div className="relative w-[256px] shrink-0">
          <div className="bg-white rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] w-full">
            <div className="flex items-center px-[48px] py-[13px]">
              <span className="font-['Inter:Regular',sans-serif] font-normal text-[#6b7280] text-[14px] leading-normal">Type searching...</span>
            </div>
          </div>
          <div className="absolute left-[20px] top-1/2 -translate-y-1/2">
            <svg fill="none" viewBox="0 0 16 16" width="16" height="16">
              <path d={svgPaths.p2aa1a600} stroke="#9CA3AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CHAT WORKSPACE ────────────────────────────────────────────────────────────
function ChatWorkspace({ userEmail }: { userEmail?: string }) {
  const user = getStoredUser();
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "seed-ai-1",
      role: "ai",
      content: "Hello Alex. I've analyzed the recent performance reports for Project Phoenix.\nWould you like a summary of the quarterly milestones or a deep dive into the resource allocation?",
      timestamp: new Date("2024-01-01T10:24:00"),
    },
    {
      id: "seed-user-1",
      role: "user",
      content: "Show me the resource allocation. Specifically, I'm concerned about the dev-ops burn rate over the last 14 days.",
      timestamp: new Date("2024-01-01T10:25:00"),
    },
    {
      id: "seed-ai-2",
      role: "ai",
      content: "Analyzing the logs... DevOps burn rate increased by 14.2% since Tuesday. This correlates with the migration of the staging environment.",
      timestamp: new Date("2024-01-01T10:25:30"),
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
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
      const res = await fetch(`${BACKEND}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, userEmail: email }),
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
            <img alt="" className="w-[32px] h-[32px] object-contain" src={imgAiAssistant} />
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
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === "ai" ? (
              <div className="flex items-start gap-[16px] px-[32px] pt-[24px] pb-[8px]">
                <div className="bg-[#f3f4f6] border border-[#e5e7eb] rounded-[8px] w-[32px] h-[32px] flex items-center justify-center shrink-0 mt-[2px]">
                  <img alt="" className="w-[20px] h-[20px] object-contain" src={imgAiAssistant} />
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
                  <img alt="" className="w-full h-full object-cover" src={user.avatar || imgUserAvatar} />
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
          <button className="p-[12px] rounded-full hover:bg-gray-200 transition shrink-0">
            <svg fill="none" viewBox="0 0 24 24" width="24" height="24">
              <path d={svgPaths.p8ece100} stroke="#9CA3AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your projects..."
            disabled={isStreaming}
            className="flex-1 px-[16px] bg-transparent outline-none font-['Inter:Regular',sans-serif] font-normal text-[#374151] text-[14px] placeholder-[#9ca3af] disabled:opacity-50"
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
function HistoryPanel({ sessions, loading }: { sessions: ChatSession[]; loading: boolean }) {
  // Status badge colour mapping
  const badgeColor: Record<string, string> = {
    ACTIVE: "text-[#9ca3af]",
    ARCHIVED: "text-[#9ca3af]",
    SHARED: "text-[#9ca3af]",
  };

  return (
    <div className="shrink-0 w-[270px] h-full">
      <div className="backdrop-blur-[5px] bg-[rgba(255,255,255,0.7)] rounded-[40px] border border-[rgba(255,255,255,0.3)] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] h-full flex flex-col p-[33px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-[24px] shrink-0">
          <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-black leading-[28px]">History</h2>
          <svg fill="none" viewBox="0 0 20 20" width="20" height="20">
            <path d={svgPaths.p2016ab00} stroke="#D1D5DB" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>

        {/* Cards list */}
        <div className="flex flex-col gap-[16px] overflow-y-auto">
          {loading && (
            <p className="font-['Inter:Regular',sans-serif] text-[#9ca3af] text-[12px]">Loading...</p>
          )}

          {!loading && sessions.length === 0 && (
            <p className="font-['Inter:Regular',sans-serif] text-[#9ca3af] text-[12px]">No sessions yet.</p>
          )}

          {sessions.map((session, i) => {
            const isFirst = i === 0;
            return (
              <div
                key={session._id}
                className={
                  isFirst
                    ? "bg-black rounded-[32px] p-[20px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] shrink-0"
                    : "bg-[rgba(255,255,255,0.5)] border border-[#f3f4f6] rounded-[32px] p-[21px] shrink-0"
                }
              >
                <p className={`font-['Inter:${isFirst ? "Bold" : "Semi_Bold"}',sans-serif] font-${isFirst ? "bold" : "semibold"} text-[14px] leading-[20px] mb-[12px] ${isFirst ? "text-white" : "text-[#374151]"}`}>
                  {session.title}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`font-['Inter:Bold',sans-serif] font-bold text-[10px] uppercase leading-[15px] ${isFirst ? "text-[#9ca3af]" : badgeColor[session.status]}`}>
                    {session.status}
                  </span>
                  <span className={`font-['Inter:Regular',sans-serif] font-normal text-[10px] leading-[15px] ${isFirst ? "text-[#6b7280]" : "text-[#9ca3af]"}`}>
                    {formatSessionDate(session.updatedAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── FLOATING EXPAND ───────────────────────────────────────────────────────────
function FloatingExpand() {
  return (
    <div className="absolute bottom-[32px] right-[32px]">
      <div className="backdrop-blur-[4px] bg-[rgba(255,255,255,0.7)] border border-white rounded-[24px] w-[48px] h-[48px] flex items-center justify-center shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] cursor-pointer">
        <svg fill="none" viewBox="0 0 24 24" width="24" height="24">
          <path d={svgPaths.p1c4d6800} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}

// ── PAGE ROOT ─────────────────────────────────────────────────────────────────
export default function AIChatPage() {
  const user = getStoredUser();
  const weather = useWeather();
  const { sessions, loading } = useSessions(user.email);

  return (
    <div className="w-full min-h-screen relative" style={{ background: "rgb(226,228,231)" }}>
      <div className="flex gap-[16px] items-start p-[16px] w-full h-screen">
        <NavRail />
        <div className="flex flex-col flex-1 min-w-0 gap-[24px] h-full overflow-hidden">
          <TopHeader weather={weather} />
          <div className="flex gap-[24px] flex-1 min-h-0 overflow-hidden">
            <ChatWorkspace userEmail={user.email} />
            <HistoryPanel sessions={sessions} loading={loading} />
          </div>
        </div>
      </div>
      <FloatingExpand />
    </div>
  );
}
