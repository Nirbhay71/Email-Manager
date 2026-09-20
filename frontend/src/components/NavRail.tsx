import svgPaths from "../imports/Html→Body-2/svg-9eyoj0uxqg";
import imgUser from "../imports/Html→Body-2/4a1497f7eb1ac52188d5053d788a4d72df0d0413.png";

export type NavKey = "inbox" | "management" | "ai-chat" | "profile";

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

function NavButton({ active, to, path }: { active: boolean; to: string; path: string }) {
  return (
    <button
      onClick={() => goTo(to)}
      className={`${active ? "bg-black" : "hover:bg-black/10"} rounded-[12px] w-full p-[8px] transition`}
      type="button"
    >
      <svg fill="none" viewBox="0 0 24 24" width="24" height="24">
        <path d={path} stroke={active ? "white" : "#9CA3AF"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    </button>
  );
}

export default function NavRail({ active }: { active: NavKey }) {
  const user = getStoredUser();
  const label = user.name ? user.name.split(" ")[0] : user.email ? user.email.split("@")[0] : "Profile";

  return (
    <div className="bg-white rounded-[32px] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] sticky top-[16px] h-[calc(100vh-32px)] w-[80px] shrink-0 flex flex-col items-center justify-between py-[32px]">
      <div className="flex flex-col items-center gap-[40px]">
        <div className="bg-black rounded-full w-[40px] h-[40px] flex items-center justify-center shrink-0">
          <span className="font-['Inter:Bold',sans-serif] font-bold text-white text-[20px] leading-[28px]">C</span>
        </div>
        <div className="flex flex-col gap-[24px] items-center w-[40px]">
          <NavButton active={active === "inbox"} to="/inbox" path={svgPaths.p42a6600} />
          <NavButton active={active === "management"} to="/management" path={svgPaths.p12978b80} />
          <NavButton active={active === "ai-chat"} to="/ai-chat" path={svgPaths.p2373ef00} />
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
        <span className={`font-['Inter:Semi_Bold',sans-serif] font-semibold text-[10px] leading-[15px] ${active === "profile" ? "text-black" : "text-[#6b7280]"}`}>
          {label}
        </span>
      </button>
    </div>
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
