import { useEffect, useMemo, useState } from "react";
import NavRail from "../../components/NavRail.tsx";
import TimeGrid from "../../components/calendar/TimeGrid.tsx";
import { eventStart as calEventStart } from "../../utils/calendarLayout.ts";
import { apiFetch } from "../../utils/api.ts";
import svgPaths from "./svg-akbvvdwpgd";

const DEFAULT_WEATHER_LOCATION = {
  latitude: 28.6139,
  longitude: 77.209,
};

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

const weatherCodeLabels = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Cloudy",
  45: "Fog",
  48: "Fog",
  51: "Drizzle",
  53: "Drizzle",
  55: "Drizzle",
  61: "Rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy showers",
  95: "Thunderstorm",
};

function formatHeaderDate(date) {
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatClock(date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  });
}

function getWeekDays(date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return current;
  });
}

function getBrowserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(DEFAULT_WEATHER_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => resolve(DEFAULT_WEATHER_LOCATION),
      { enableHighAccuracy: false, maximumAge: 30 * 60 * 1000, timeout: 5000 }
    );
  });
}

function getStoredUser() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function getStoredUserEmail() {
  return getStoredUser().email || "";
}

function getEventStartDate(event) {
  return calEventStart(event);
}

function getDateRange(date, viewMode) {
  if (viewMode === "day") {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return { start, end };
  }

  if (viewMode === "month") {
    return {
      start: new Date(date.getFullYear(), date.getMonth(), 1),
      end: new Date(date.getFullYear(), date.getMonth() + 1, 1),
    };
  }

  const [start] = getWeekDays(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

function Container() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#71717a] text-[12px] tracking-[1.2px] uppercase whitespace-nowrap">
          <p className="leading-[16px]">TIME</p>
        </div>
      </div>
    </div>
  );
}

function VerticalBorder() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="VerticalBorder">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-r border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center pl-[24px] pr-[25px] py-[39.5px] relative size-full">
          <Container />
        </div>
      </div>
    </div>
  );
}

function GridHeader({ anchorDate, viewMode }) {
  const today = useMemo(() => new Date(), []);
  const weekDays = useMemo(() => (viewMode === "day" ? [anchorDate] : getWeekDays(anchorDate)), [anchorDate, viewMode]);

  return (
    <div className="relative shrink-0 w-full" data-name="Grid Header">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-b border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start justify-center pb-px relative size-full">
        <VerticalBorder />
        {weekDays.map((day) => {
          const isToday = day.toDateString() === today.toDateString();
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          return (
            <div className={`${isToday ? "bg-[rgba(0,0,0,0.05)]" : ""} flex-[1_0_0] min-w-px relative`} data-name="VerticalBorder" key={day.toISOString()}>
              <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-r border-solid inset-0 pointer-events-none" />
              <div className="flex flex-col items-center size-full">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center pl-[24px] pr-[25px] py-[24px] relative size-full">
                  <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[10px] text-center tracking-[1px] uppercase whitespace-nowrap">
                    <p className={`leading-[15px] ${isToday ? "text-black" : isWeekend ? "text-[rgba(113,113,122,0.4)]" : "text-[#71717a]"}`}>
                      {day.toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                  </div>
                  <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[20px] text-center whitespace-nowrap">
                    <p className={`leading-[28px] ${isWeekend && !isToday ? "text-[rgba(113,113,122,0.4)]" : "text-[#131313]"}`}>{day.getDate()}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getMonthCells(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  
  const cells = [];
  const startDay = start.getDay();
  const diff = startDay === 0 ? -6 : 1 - startDay; 
  
  let current = new Date(start);
  current.setDate(start.getDate() + diff);
  
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return cells;
}

function MonthlyGrid({ events, anchorDate }) {
  const cells = useMemo(() => getMonthCells(anchorDate), [anchorDate]);
  const today = new Date();
  
  return (
    <div className="flex flex-col w-full h-full p-6 gap-4">
      <div className="grid grid-cols-7 gap-4 w-full shrink-0">
        {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(d => (
          <div key={d} className="text-[#71717a] text-[10px] tracking-[1px] font-['Hanken_Grotesk:Bold',sans-serif] font-bold text-center uppercase">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-[rgba(0,0,0,0.05)] w-full flex-1 rounded-[16px] overflow-hidden border border-[rgba(0,0,0,0.05)]">
        {cells.map((date, i) => {
          const isToday = date.toDateString() === today.toDateString();
          const isCurrentMonth = date.getMonth() === anchorDate.getMonth();
          
          const dayEvents = events.filter(e => {
            const es = getEventStartDate(e);
            return es && es.toDateString() === date.toDateString();
          });

          return (
            <div key={i} className={`bg-white/80 p-2 flex flex-col gap-1 min-h-[80px] ${!isCurrentMonth ? 'opacity-40' : ''}`}>
               <div className={`text-[12px] font-['Hanken_Grotesk:Bold',sans-serif] font-bold w-6 h-6 flex items-center justify-center rounded-full shrink-0 ${isToday ? 'bg-black text-white' : 'text-[#131313]'}`}>
                 {date.getDate()}
               </div>
               <div className="flex flex-col gap-1 overflow-y-auto mt-1">
                 {dayEvents.map((e, j) => (
                   <div key={j} className="text-[10px] bg-[rgba(0,0,0,0.05)] px-2 py-1 rounded-[4px] truncate text-black font-['Hanken_Grotesk:Bold',sans-serif] font-bold">
                     {e.summary || e.title || "Event"}
                   </div>
                 ))}
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarWrapper({ events, anchorDate, viewMode }) {
  return (
    <div className="backdrop-blur-[20px] bg-[rgba(255,255,255,0.7)] flex-[1_0_0] min-h-px relative rounded-[40px] w-full" data-name="CALENDAR WRAPPER">
      <div className="content-stretch flex flex-col items-start overflow-clip p-px relative rounded-[inherit] size-full">
        {viewMode === 'month' ? (
           <MonthlyGrid events={events} anchorDate={anchorDate} />
        ) : (
           <>
             <GridHeader anchorDate={anchorDate} viewMode={viewMode} />
             <TimeGrid events={events} anchorDate={anchorDate} viewMode={viewMode} />
           </>
        )}
      </div>
      <div aria-hidden className="absolute border border-[rgba(255,255,255,0.4)] border-solid inset-0 pointer-events-none rounded-[40px] shadow-[0px_8px_32px_0px_rgba(31,38,135,0.05)]" />
    </div>
  );
}

function MainMainContent({ events, anchorDate, viewMode }) {
  return (
    <div className="h-[668px] relative shrink-0 w-full" data-name="Main - MAIN CONTENT">
      <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start justify-center pb-[24px] pr-[24px] relative size-full">
          <CalendarWrapper events={events} anchorDate={anchorDate} viewMode={viewMode} />
        </div>
      </div>
    </div>
  );
}

function Heading() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 2">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#131313] text-[30px] tracking-[-0.75px] whitespace-nowrap">
        <p className="leading-[36px]">MailSense</p>
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="h-[11.151px] relative shrink-0 w-[9.917px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="11.1506" preserveAspectRatio="none" viewBox="0 0 9.91662 11.1506" width="9.91662">
        <g id="Container">
          <path d={svgPaths.p107e7980} fill="var(--fill-0, #71717A)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Container23() {
  const [currentDate, setCurrentDate] = useState(() => formatHeaderDate(new Date()));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentDate(formatHeaderDate(new Date()));
    }, 60 * 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#71717a] text-[12px] tracking-[0.6px] uppercase whitespace-nowrap">
        <p className="leading-[16px]">{currentDate}</p>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Container">
      <Container22 />
      <Container23 />
    </div>
  );
}

function Container20() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-[168.84px]" data-name="Container">
      <Heading />
      <Container21 />
    </div>
  );
}

function NavigationArrows({ onPrev, onNext }) {
  return (
    <div className="flex gap-2 items-center mx-4">
      <button onClick={onPrev} className="bg-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.8)] transition shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] rounded-[9999px] size-[32px] flex items-center justify-center text-[#71717a] border border-solid border-white">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <button onClick={onNext} className="bg-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.8)] transition shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] rounded-[9999px] size-[32px] flex items-center justify-center text-[#71717a] border border-solid border-white">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    </div>
  );
}

function Button({ label, isActive, onClick }) {
  return (
    <button onClick={onClick} className={`${isActive ? "bg-white drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] text-[#131313] font-bold" : "text-[#71717a] font-semibold"} relative rounded-[9999px] shrink-0 hover:bg-white/50 transition`} data-name="Button" type="button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center px-[24px] py-[6px] relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:SemiBold',sans-serif] justify-center leading-[0] relative shrink-0 text-[12px] text-center whitespace-nowrap">
          <p className="leading-[16px]">{label}</p>
        </div>
      </div>
    </button>
  );
}

function OverlayBorderShadow({ viewMode, setViewMode }) {
  return (
    <div className="bg-[rgba(255,255,255,0.6)] content-stretch flex gap-[8px] items-center p-[7px] relative rounded-[9999px] shrink-0" data-name="Overlay+Border+Shadow">
      <div aria-hidden className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[9999px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
      <Button label="Day" isActive={viewMode === 'day'} onClick={() => setViewMode('day')} />
      <Button label="Week" isActive={viewMode === 'week'} onClick={() => setViewMode('week')} />
      <Button label="Month" isActive={viewMode === 'month'} onClick={() => setViewMode('month')} />
    </div>
  );
}

function Container19({ viewMode, setViewMode, onPrev, onNext }) {
  return (
    <div className="content-stretch flex gap-[32px] items-center relative shrink-0" data-name="Container">
      <Container20 />
      <NavigationArrows onPrev={onPrev} onNext={onNext} />
      <OverlayBorderShadow viewMode={viewMode} setViewMode={setViewMode} />
    </div>
  );
}

function Container27() {
  return (
    <div className="relative shrink-0 size-[11.083px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="11.0833" preserveAspectRatio="none" viewBox="0 0 11.0833 11.0833" width="11.0833">
        <g id="Container">
          <path d={svgPaths.p3813efe0} fill="var(--fill-0, #131313)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Container28({ time }) {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#131313] text-[12px] whitespace-nowrap">
          <p className="leading-[16px]">{time}</p>
        </div>
      </div>
    </div>
  );
}

function OverlayBorderShadowOverlayBlur1({ time }) {
  return (
    <div className="backdrop-blur-[12px] bg-[rgba(255,255,255,0.6)] content-stretch flex gap-[7.99px] items-center px-[17px] py-[9px] relative rounded-[9999px] shrink-0" data-name="Overlay+Border+Shadow+OverlayBlur">
      <div aria-hidden className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[9999px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
      <Container27 />
      <Container28 time={time} />
    </div>
  );
}

function Container29() {
  return (
    <div className="relative shrink-0 size-[12.228px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="12.2275" preserveAspectRatio="none" viewBox="0 0 12.2275 12.2275" width="12.2275">
        <g id="Container">
          <path d={svgPaths.p292ce000} fill="var(--fill-0, #131313)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Container30({ weather }) {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#131313] text-[12px] whitespace-nowrap">
          <p className="leading-[16px]">{weather}</p>
        </div>
      </div>
    </div>
  );
}

function OverlayBorderShadowOverlayBlur2({ weather }) {
  return (
    <div className="backdrop-blur-[12px] bg-[rgba(255,255,255,0.6)] content-stretch flex gap-[7.99px] items-center px-[17px] py-[9px] relative rounded-[9999px] shrink-0" data-name="Overlay+Border+Shadow+OverlayBlur">
      <div aria-hidden className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[9999px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
      <Container29 />
      <Container30 weather={weather} />
    </div>
  );
}

function GlassWidgets() {
  const [time, setTime] = useState(() => formatClock(new Date()));
  const [weather, setWeather] = useState("...");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime(formatClock(new Date()));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadWeather() {
      try {
        const { latitude, longitude } = await getBrowserLocation();
        const params = new URLSearchParams({
          latitude: String(latitude),
          longitude: String(longitude),
          current: "temperature_2m,weather_code,is_day",
          timezone: "auto",
        });
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);

        if (!response.ok) throw new Error("Weather request failed");

        const data = await response.json();
        const current = data.current;
        const temperature = Math.round(current.temperature_2m);
        const label = weatherCodeLabels[current.weather_code] || "Weather";

        if (isMounted) setWeather(`${temperature}° ${label}`);
      } catch {
        if (isMounted) setWeather("Weather unavailable");
      }
    }

    loadWeather();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Glass Widgets">
      <OverlayBorderShadowOverlayBlur1 time={time} />
      <OverlayBorderShadowOverlayBlur2 weather={weather} />
    </div>
  );
}

function Container24() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-name="Container">
      <GlassWidgets />
    </div>
  );
}

function HeaderHeaderArea({ viewMode, setViewMode, onPrev, onNext }) {
  return (
    <div className="absolute content-stretch flex h-[64px] items-center justify-between left-[128px] right-[24px] top-[24px]" data-name="Header - HEADER AREA">
      <Container19 viewMode={viewMode} setViewMode={setViewMode} onPrev={onPrev} onNext={onNext} />
      <Container24 />
    </div>
  );
}

export default function HtmlBody() {
  const [anchorDate, setAnchorDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [viewMode, setViewMode] = useState("week");
  const [events, setEvents] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchEvents = async () => {
      try {
        const email = getStoredUserEmail();
        if (!email) return;
        
        const { start, end } = getDateRange(anchorDate, viewMode);
        const params = new URLSearchParams({
          email,
          timeMin: start.toISOString(),
          timeMax: end.toISOString()
        });
        
        const response = await apiFetch(`${BACKEND_URL}/calendar/events?${params}`);
        if (!response.ok) throw new Error("Failed to fetch events");
        const data = await response.json();
        
        if (isMounted) {
          setEvents(Array.isArray(data) ? data : Array.isArray(data.events) ? data.events : []);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchEvents();
    return () => { isMounted = false; };
  }, [anchorDate, viewMode]);

  const handlePrev = () => {
    setAnchorDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === 'day') newDate.setDate(newDate.getDate() - 1);
      else if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
      else if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNext = () => {
    setAnchorDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === 'day') newDate.setDate(newDate.getDate() + 1);
      else if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
      else if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  return (
    <div className="content-stretch flex flex-col items-start pb-[148px] pl-[128px] pt-[112px] relative size-full" style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 1280 928' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(181.02 0 0 131.24 0 0)'><stop stop-color='rgba(16,15,21,0.05)' offset='0'/><stop stop-color='rgba(16,15,21,0)' offset='0.5'/></radialGradient></defs></svg>\"), url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 1280 928' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(90.51 0 0 131.24 640 0)'><stop stop-color='rgba(47,62,106,0.02)' offset='0'/><stop stop-color='rgba(47,62,106,0)' offset='0.5'/></radialGradient></defs></svg>\"), url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 1280 928' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(181.02 0 0 131.24 1280 0)'><stop stop-color='rgba(114,39,65,0.02)' offset='0'/><stop stop-color='rgba(114,39,65,0)' offset='0.5'/></radialGradient></defs></svg>\"), linear-gradient(90deg, rgb(240, 241, 243) 0%, rgb(240, 241, 243) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }} data-name="Html → Body">
      <MainMainContent events={events} anchorDate={anchorDate} viewMode={viewMode} />
      <HeaderHeaderArea viewMode={viewMode} setViewMode={setViewMode} onPrev={handlePrev} onNext={handleNext} />
      <NavRail active="management" reserve={false} />
    </div>
  );
}
