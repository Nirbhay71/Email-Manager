import NavRail from "../components/NavRail.tsx";
import InboxCard from "../components/inbox/InboxCard.tsx";
import { useNow, useWeather } from "../utils/weather.ts";

export default function MailPage() {
  const now = useNow();
  const weather = useWeather();

  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }).toUpperCase();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="w-full h-screen" style={{ background: "rgb(226,228,231)" }}>
      <div className="flex gap-[16px] items-start p-[16px] w-full h-full">
        <NavRail active="mail" />

        <main className="flex-1 min-w-0 h-full flex flex-col gap-[20px]">
          <header className="flex flex-wrap items-center justify-between gap-[12px] shrink-0">
            <div>
              <h1 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[32px] text-black tracking-[-0.9px] leading-[38px]">All Mail</h1>
              <p className="font-['Inter:Medium',sans-serif] font-medium text-[#6b7280] text-[13px] mt-[2px]">{dateStr}</p>
            </div>
            <div className="bg-white rounded-full drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex items-center gap-[14px] px-[16px] py-[8px]">
              <span className="text-[12px] font-medium text-black">{timeStr}</span>
              <span className="text-[12px] font-medium text-black">{weather ? `${weather.temp}° ${weather.label}` : "—"}</span>
            </div>
          </header>

          <div className="flex-1 min-h-0 pb-[16px]">
            <InboxCard pageSize={20} />
          </div>
        </main>
      </div>
    </div>
  );
}
