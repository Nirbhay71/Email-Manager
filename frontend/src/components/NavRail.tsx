import type { ReactNode } from "react";
import svgPaths from "../imports/Html→Body-2/svg-9eyoj0uxqg";
import imgUser from "../imports/Html→Body-2/4a1497f7eb1ac52188d5053d788a4d72df0d0413.png";

export type NavKey = "inbox" | "mail" | "management" | "ai-chat" | "profile";

export function getStoredUser(): { email?: string; avatar?: string; name?: string } {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem("user") || "{}"); }
  catch { return {}; }
}

export function goTo(path: string) {
  if (window.location.pathname !== path || window.location.search) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}

// ── Icons (24px, 2px round stroke, inherit colour) ────────────────────────────
const svgProps = {
  fill: "none",
  viewBox: "0 0 24 24",
  width: 24,
  height: 24,
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function InboxIcon() {
  return (
    <svg {...svgProps}>
      <path d={svgPaths.p42a6600} />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg {...svgProps}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg {...svgProps}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
    </svg>
  );
}

export function AssistantIcon({ size = 24 }: { size?: number }) {
  return (
    <svg {...svgProps} width={size} height={size}>
      <path d="M12 6V2H8" />
      <path d="m8 18-4 4V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z" />
      <path d="M2 12h2M9 11v2M15 11v2M20 12h2" />
    </svg>
  );
}

function NavButton({ active, to, label, children }: { active: boolean; to: string; label: string; children: ReactNode }) {
  return (
    <button
      onClick={() => goTo(to)}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      title={label}
      className={`${active ? "bg-black text-white" : "text-[#9CA3AF] hover:bg-black/10 hover:text-black"} flex items-center justify-center rounded-[12px] w-full p-[8px] transition`}
      type="button"
    >
      {children}
    </button>
  );
}

/**
 * The one sidebar used by every page. It is position:fixed, so it stays put while the page scrolls.
 * `reserve` adds an 80px spacer where the rail would sit in a flex row; pass reserve={false}
 * for pages that already pad their content to clear it.
 */
export default function NavRail({ active, reserve = true }: { active: NavKey; reserve?: boolean }) {
  const user = getStoredUser();
  const label = user.name ? user.name.split(" ")[0] : user.email ? user.email.split("@")[0] : "Profile";

  return (
    <>
      {reserve && <div aria-hidden className="w-[80px] shrink-0" />}
      <nav className="fixed left-[16px] top-[16px] z-30 bg-white rounded-[32px] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] h-[calc(100vh-32px)] w-[80px] flex flex-col items-center justify-between py-[32px]">
        <div className="flex flex-col items-center gap-[40px]">
          <div className="bg-black rounded-full w-[40px] h-[40px] flex items-center justify-center shrink-0">
            <span className="font-['Inter:Bold',sans-serif] font-bold text-white text-[20px] leading-[28px]">C</span>
          </div>
          <div className="flex flex-col gap-[24px] items-center w-[40px]">
            <NavButton active={active === "inbox"} to="/inbox" label="Inbox"><InboxIcon /></NavButton>
            <NavButton active={active === "mail"} to="/mail" label="All mail"><MailIcon /></NavButton>
            <NavButton active={active === "management"} to="/management" label="Calendar"><CalendarIcon /></NavButton>
            <NavButton active={active === "ai-chat"} to="/ai-chat" label="AI assistant"><AssistantIcon /></NavButton>
          </div>
        </div>

        {/* Profile — opens /profile */}
        <button
          onClick={() => goTo("/profile")}
          className="flex flex-col items-center gap-[16px] cursor-pointer"
          title="Open profile"
          type="button"
        >
          <div className="relative shrink-0">
            <div className={`w-[40px] h-[40px] rounded-full overflow-hidden relative ${active === "profile" ? "ring-2 ring-black ring-offset-2" : ""}`}>
              <Avatar src={user.avatar} className="absolute left-0 top-0 w-full h-full object-cover" />
              <div className="absolute inset-0 border-2 border-white rounded-full pointer-events-none" />
            </div>
            <div className="absolute bottom-[-4px] right-[-4px] w-[12px] h-[12px] bg-[#22c55e] rounded-full border-2 border-white" />
          </div>
          <span className={`max-w-[68px] truncate font-['Inter:Semi_Bold',sans-serif] font-semibold text-[10px] leading-[15px] ${active === "profile" ? "text-black" : "text-[#6b7280]"}`}>
            {label}
          </span>
        </button>
      </nav>
    </>
  );
}

/** Avatar image that survives Google's referrer checks and falls back to the placeholder on error. */
export function Avatar({ src, className }: { src?: string; className?: string }) {
  return (
    <img
      alt=""
      className={className}
      referrerPolicy="no-referrer"
      src={src || imgUser}
      onError={(e) => {
        const el = e.currentTarget;
        if (el.src !== imgUser) el.src = imgUser;
      }}
    />
  );
}
