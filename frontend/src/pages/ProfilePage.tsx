import { useEffect, useState } from "react";
import NavRail, { Avatar, getStoredUser, goTo } from "../components/NavRail.tsx";
import { apiFetch } from "../utils/api.ts";

interface Stats { emails: number | null; chats: number | null }

const PERMISSIONS = [
  { label: "Gmail", detail: "Read-only access to your inbox" },
  { label: "Google Calendar", detail: "Create and read events for detected deadlines" },
  { label: "Email address", detail: "Identify your account" },
];

export default function ProfilePage() {
  const user = getStoredUser();
  const [stats, setStats] = useState<Stats>({ emails: null, chats: null });
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Stats = { emails: null, chats: null };
      try {
        const res = await apiFetch("/emails/inbox?limit=1");
        if (res.ok) next.emails = (await res.json()).total ?? 0;
      } catch { /* leave as unknown */ }
      try {
        const res = await apiFetch("/chat/sessions");
        if (res.ok) next.chats = (await res.json()).length;
      } catch { /* leave as unknown */ }
      if (!cancelled) setStats(next);
    })();
    return () => { cancelled = true; };
  }, []);

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await apiFetch("/auth/logout", { method: "POST" }); } catch { /* clear locally regardless */ }
    try { window.localStorage.removeItem("user"); } catch { /* ignore */ }
    window.location.href = "/";
  };

  const displayName = user.name || (user.email ? user.email.split("@")[0] : "Your account");
  const fmt = (n: number | null) => (n === null ? "—" : String(n));

  return (
    <div className="w-full min-h-screen" style={{ background: "rgb(226,228,231)" }}>
      <div className="flex gap-[16px] items-start p-[16px] w-full h-screen">
        <NavRail active="profile" />

        <div className="flex flex-col flex-1 min-w-0 gap-[24px] h-full overflow-auto pr-[16px]">
          <div className="flex flex-col gap-[3.5px] shrink-0">
            <h1 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[36px] text-black tracking-[-0.9px] leading-[40px]">
              Profile
            </h1>
            <p className="font-['Inter:Medium',sans-serif] font-medium text-[#6b7280] text-[14px]">
              Your MailSense account
            </p>
          </div>

          <div className="grid gap-[24px] max-w-[960px] md:grid-cols-[320px_1fr]">
            {/* Identity card */}
            <div className="bg-white rounded-[40px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] p-[32px] flex flex-col items-center text-center gap-[16px]">
              <div className="w-[112px] h-[112px] rounded-full overflow-hidden border-4 border-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] relative">
                <Avatar src={user.avatar} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 w-full">
                <p className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-black leading-[28px] truncate">{displayName}</p>
                <p className="font-['Inter:Regular',sans-serif] text-[#6b7280] text-[14px] break-all">{user.email || "Not signed in"}</p>
              </div>
              <div className="flex items-center gap-[8px]">
                <span className="w-[8px] h-[8px] rounded-full bg-[#22c55e]" />
                <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#9ca3af] text-[12px] tracking-[0.6px] uppercase">Signed in with Google</span>
              </div>
              <button
                onClick={logout}
                disabled={loggingOut}
                className="mt-[8px] w-full bg-black text-white rounded-full py-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] hover:opacity-90 disabled:opacity-50 transition"
                type="button"
              >
                {loggingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>

            <div className="flex flex-col gap-[24px]">
              {/* Activity */}
              <div className="bg-white rounded-[40px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] p-[32px]">
                <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-black leading-[28px] mb-[20px]">Activity</h2>
                <div className="grid grid-cols-2 gap-[16px]">
                  <button onClick={() => goTo("/inbox")} className="bg-[#f9fafb] border border-[#f3f4f6] rounded-[24px] p-[20px] text-left hover:bg-[#f3f4f6] transition" type="button">
                    <p className="font-['Inter:Bold',sans-serif] font-bold text-[28px] text-black leading-[36px]">{fmt(stats.emails)}</p>
                    <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#9ca3af] text-[12px] uppercase tracking-[0.6px]">Emails synced</p>
                  </button>
                  <button onClick={() => goTo("/ai-chat")} className="bg-[#f9fafb] border border-[#f3f4f6] rounded-[24px] p-[20px] text-left hover:bg-[#f3f4f6] transition" type="button">
                    <p className="font-['Inter:Bold',sans-serif] font-bold text-[28px] text-black leading-[36px]">{fmt(stats.chats)}</p>
                    <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#9ca3af] text-[12px] uppercase tracking-[0.6px]">AI conversations</p>
                  </button>
                </div>
              </div>

              {/* Connected permissions */}
              <div className="bg-white rounded-[40px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] p-[32px]">
                <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-black leading-[28px] mb-[20px]">Connected Google access</h2>
                <ul className="flex flex-col gap-[12px]">
                  {PERMISSIONS.map((p) => (
                    <li key={p.label} className="flex items-center justify-between bg-[#f9fafb] border border-[#f3f4f6] rounded-[24px] px-[20px] py-[14px]">
                      <div>
                        <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] text-[#374151]">{p.label}</p>
                        <p className="font-['Inter:Regular',sans-serif] text-[12px] text-[#9ca3af]">{p.detail}</p>
                      </div>
                      <span className="w-[8px] h-[8px] rounded-full bg-[#22c55e] shrink-0" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
