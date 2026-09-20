import { useState } from "react";
import NavRail from "../components/NavRail.tsx";
import InboxCard, { type InboxEmail } from "../components/inbox/InboxCard.tsx";
import AssistantCard from "../components/inbox/AssistantCard.tsx";
import CategoriesCard from "../components/inbox/CategoriesCard.tsx";
import CalendarCard from "../components/inbox/CalendarCard.tsx";
import { useNow, useWeather } from "../utils/weather.ts";

export default function InboxPage() {
  const now = useNow();
  const weather = useWeather();
  // The inbox reports its newest message and deadline count so the assistant can offer relevant prompts
  const [latest, setLatest] = useState<InboxEmail | null>(null);
  const [deadlines, setDeadlines] = useState(0);

  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }).toUpperCase();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="w-full min-h-screen" style={{ background: "rgb(226,228,231)" }}>
      <div className="flex gap-[16px] items-start p-[16px] w-full">
        <NavRail active="inbox" />

        <main className="flex-1 min-w-0 flex flex-col gap-[20px] pr-[8px]">
          <header className="flex flex-wrap items-center justify-between gap-[12px] shrink-0">
            <div>
              <h1 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[32px] text-black tracking-[-0.9px] leading-[38px]">MailSense</h1>
              <p className="font-['Inter:Medium',sans-serif] font-medium text-[#6b7280] text-[13px] mt-[2px]">{dateStr}</p>
            </div>
            <div className="bg-white rounded-full drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex items-center gap-[14px] px-[16px] py-[8px]">
              <span className="text-[12px] font-medium text-black">{timeStr}</span>
              <span className="text-[12px] font-medium text-black">{weather ? `${weather.temp}° ${weather.label}` : "—"}</span>
            </div>
          </header>

          {/* Sizes follow the viewport rather than fixed pixels */}
          <div className="grid gap-[20px] xl:grid-cols-12">
            <div className="xl:col-span-7 h-[clamp(420px,62vh,600px)]">
              <InboxCard onLatest={(email, count) => { setLatest(email); setDeadlines(count); }} />
            </div>
            <div className="xl:col-span-5 h-[clamp(420px,62vh,600px)]">
              <AssistantCard latest={latest} deadlines={deadlines} />
            </div>
          </div>

          <div className="grid gap-[20px] xl:grid-cols-12 pb-[16px]">
            <div className="xl:col-span-4"><CategoriesCard /></div>
            <div className="xl:col-span-8"><CalendarCard /></div>
          </div>
        </main>
      </div>
    </div>
  );
}
