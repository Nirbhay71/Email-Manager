import { useEffect, useMemo, useState } from "react";
import svgPaths from "./svg-akbvvdwpgd";
import inboxSvgPaths from "../Html→Body-1/svg-nwc2hakocy";
import imgAb6AXuDoSJwjP31NbOVxOIg0ZdAacyXz07TLo5IqAd9DGnO54TlaJnBqr0Oc2Q1HMj6ElMc1AYrScN1J0UiDfZl1KNm6NdpAqEwODgWseRe86L0OzoEtQsCgnH0M1D7EgmTg8PTbaq9YzMyCsqQUK98AgLxHgAsfWzE3Y5MzLx6CHh7VvTiVyXdHnZXqBYlG4RDr3B5URUsqQQn5MfFlh8DxeMiGkTlxxoN2UZzmCwe8W5VBNmtjK from "./16a5e24ed32959fcf59c6d4cc9895c8aa326b631.png";
import imgAb6AXuBbMLwfNLw4Loqqo7FrQu4Lro3I10VzV4FSOe1L9NXo63FOUgegeaC7KsR1RhcWmIxOJhnESuNnOe8MgAgVhpTvXma3Isbxh65Bl5V6RuU7D0KDtx1ZedNwbe558NKnOYtMSx7NDfJjZk3XYrZ7AgzXqezlgqZjOrKbuzc5NNsfy3DtF05FwPk3T91UiE4Bk8HbpxpqABfnXSmAAeHmo80Rul2HvIrfJlGx87DrO1NulhlWhJ from "./65cd458d78276f6067ec8bae40bd34918cb811e4.png";
import imgAb6AXuCnB1ArMxpx5YXwDiDdu5Gq45KEkZsBcoTJWYdFtz2VjJyfhKrH9EisLZuJsSAi9LKQhW8JAgMVdY9Ia05FKiKwca5VUoG5Zljo6Mv6P4XMDv8VbY2DvG2GScy6UIueMpo9TmwxyqpnN5YBmIv5BX9N3UdYkAEfPjuqEw3HYvR1G6DXuYhYnv4DCjlAf9CxfA5Y2XpUqPPeIixiAra3AffnIt7JLrjmEXbl8B3CBuA from "./05ba7f59c96bab04357a062c321a5aa8ccf89e4e.png";
import imgAb6AXuDcotmOmvgLnUtOjzzqChoCoCclJKpIDSiONvbSteeVHgmaMxSshvmv4EfIYkUz6QD1UIzkX5VcHcfhzfutSfgs8E2FGp7NbJsEmuByxpE7CL5ANyInjv8Kps6IzhXxVUa0LwgNqn1OrDcn5AIi9MvaiiFpAmZLvSnPgnEzsxnbGzVEcg0EqFVmSkPlsTgZ7UEjl61RAuIZaIkvWqyHv6DqHfDy6L2LDcm443YjomYokWfKnZ from "./b72afd7490eca55085f58b608381dadc275b3c9b.png";
import imgAb6AXuDo9XtiMuTzRmJdGt3XaHyHzjeraNnxjrOAx6Rim5TuBpE3N4MkjT4LSuoiMDr7THoa34AsfqaSaoBra36HWlDqofU672SRl6NFhlfhuJia4Sj88BVobMQj15Zp5ULcVv7MLkI976LrPtoWYd5NUpAhkqtjLncmDuyGe76IwCJpHj1CzFKvet3SmmYtjhymN8MPnJyqD0KRaZhdafLaAo8K1StSa2VaM6CMs3OyH1XOvWzmvh from "./570b88c58188b663ce47e826fed719348b031aa0.png";
import imgProfile from "./e4cdf975b1e48772f50d5aaae0647c82b1432b96.png";

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

function goToDashboardRoute(path) {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== path || window.location.search) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
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

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getEventStartDate(event) {
  if (!event?.start) return null;
  const start = new Date(event.start);
  return Number.isNaN(start.getTime()) ? null : start;
}

function getEventEndDate(event) {
  if (!event?.end) return null;
  const end = new Date(event.end);
  return Number.isNaN(end.getTime()) ? null : end;
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

function Container1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#71717a] text-[10px] text-center tracking-[1px] uppercase whitespace-nowrap">
          <p className="leading-[15px]">MON</p>
        </div>
      </div>
    </div>
  );
}

function VerticalBorder1() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="VerticalBorder">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-r border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center pl-[24px] pr-[25px] py-[24px] relative size-full">
          <Container1 />
          <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#131313] text-[20px] text-center whitespace-nowrap">
            <p className="leading-[28px]">24</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[10px] text-black text-center tracking-[1px] uppercase whitespace-nowrap">
          <p className="leading-[15px]">TUE</p>
        </div>
      </div>
    </div>
  );
}

function OverlayVerticalBorder() {
  return (
    <div className="bg-[rgba(0,0,0,0.05)] flex-[1_0_0] min-w-px relative" data-name="Overlay+VerticalBorder">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-r border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center pl-[24px] pr-[25px] py-[24px] relative size-full">
          <Container2 />
          <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#131313] text-[20px] text-center whitespace-nowrap">
            <p className="leading-[28px]">25</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#71717a] text-[10px] text-center tracking-[1px] uppercase whitespace-nowrap">
          <p className="leading-[15px]">WED</p>
        </div>
      </div>
    </div>
  );
}

function VerticalBorder2() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="VerticalBorder">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-r border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center pl-[24px] pr-[25px] py-[24px] relative size-full">
          <Container3 />
          <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#131313] text-[20px] text-center whitespace-nowrap">
            <p className="leading-[28px]">26</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#71717a] text-[10px] text-center tracking-[1px] uppercase whitespace-nowrap">
          <p className="leading-[15px]">THU</p>
        </div>
      </div>
    </div>
  );
}

function VerticalBorder3() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="VerticalBorder">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-r border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center pl-[24px] pr-[25px] py-[24px] relative size-full">
          <Container4 />
          <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#131313] text-[20px] text-center whitespace-nowrap">
            <p className="leading-[28px]">27</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#71717a] text-[10px] text-center tracking-[1px] uppercase whitespace-nowrap">
          <p className="leading-[15px]">FRI</p>
        </div>
      </div>
    </div>
  );
}

function VerticalBorder4() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="VerticalBorder">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-r border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center pl-[24px] pr-[25px] py-[24px] relative size-full">
          <Container5 />
          <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#131313] text-[20px] text-center whitespace-nowrap">
            <p className="leading-[28px]">28</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[10px] text-[rgba(113,113,122,0.4)] text-center tracking-[1px] uppercase whitespace-nowrap">
          <p className="leading-[15px]">SAT</p>
        </div>
      </div>
    </div>
  );
}

function VerticalBorder5() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="VerticalBorder">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-r border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center pl-[24px] pr-[25px] py-[24px] relative size-full">
          <Container6 />
          <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[20px] text-[rgba(113,113,122,0.4)] text-center whitespace-nowrap">
            <p className="leading-[28px]">29</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[10px] text-[rgba(113,113,122,0.4)] text-center tracking-[1px] uppercase whitespace-nowrap">
        <p className="leading-[15px]">SUN</p>
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="Container">
      <div className="flex flex-col items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center p-[24px] relative size-full">
          <Container8 />
          <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[20px] text-[rgba(113,113,122,0.4)] text-center whitespace-nowrap">
            <p className="leading-[28px]">30</p>
          </div>
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

function HorizontalBorder() {
  return (
    <div className="h-[64px] relative shrink-0 w-full" data-name="HorizontalBorder">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-b border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center pb-px relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[11px] text-[rgba(113,113,122,0.6)] text-center whitespace-nowrap">
          <p className="leading-[16.5px]">1 PM</p>
        </div>
      </div>
    </div>
  );
}

function HorizontalBorder1() {
  return (
    <div className="h-[64px] relative shrink-0 w-full" data-name="HorizontalBorder">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-b border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center pb-px relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[11px] text-[rgba(113,113,122,0.6)] text-center whitespace-nowrap">
          <p className="leading-[16.5px]">2 PM</p>
        </div>
      </div>
    </div>
  );
}

function HorizontalBorder2() {
  return (
    <div className="h-[64px] relative shrink-0 w-full" data-name="HorizontalBorder">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-b border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center pb-px relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[11px] text-[rgba(113,113,122,0.6)] text-center whitespace-nowrap">
          <p className="leading-[16.5px]">3 PM</p>
        </div>
      </div>
    </div>
  );
}

function HorizontalBorder3() {
  return (
    <div className="h-[64px] relative shrink-0 w-full" data-name="HorizontalBorder">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-b border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center pb-px relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[11px] text-[rgba(113,113,122,0.6)] text-center whitespace-nowrap">
          <p className="leading-[16.5px]">4 PM</p>
        </div>
      </div>
    </div>
  );
}

function HorizontalBorder4() {
  return (
    <div className="h-[64px] relative shrink-0 w-full" data-name="HorizontalBorder">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-b border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center pb-px relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[11px] text-[rgba(113,113,122,0.6)] text-center whitespace-nowrap">
          <p className="leading-[16.5px]">5 PM</p>
        </div>
      </div>
    </div>
  );
}

function HorizontalBorder5() {
  return (
    <div className="h-[64px] relative shrink-0 w-full" data-name="HorizontalBorder">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-b border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center pb-px relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[11px] text-[rgba(113,113,122,0.6)] text-center whitespace-nowrap">
          <p className="leading-[16.5px]">6 PM</p>
        </div>
      </div>
    </div>
  );
}

function HorizontalBorder6() {
  return (
    <div className="h-[64px] relative shrink-0 w-full" data-name="HorizontalBorder">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-b border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center pb-px relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[11px] text-[rgba(113,113,122,0.6)] text-center whitespace-nowrap">
          <p className="leading-[16.5px]">7 PM</p>
        </div>
      </div>
    </div>
  );
}

function HorizontalBorder7() {
  return (
    <div className="h-[64px] relative shrink-0 w-full" data-name="HorizontalBorder">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-b border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center pb-px relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[11px] text-[rgba(113,113,122,0.6)] text-center whitespace-nowrap">
          <p className="leading-[16.5px]">8 PM</p>
        </div>
      </div>
    </div>
  );
}

function TimeColumn() {
  return (
    <div className="col-1 content-stretch flex flex-col items-start justify-self-stretch pb-[34px] pr-px relative row-1 self-start shrink-0" data-name="Time Column">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-r border-solid inset-0 pointer-events-none" />
      <HorizontalBorder />
      <HorizontalBorder1 />
      <HorizontalBorder2 />
      <HorizontalBorder3 />
      <HorizontalBorder4 />
      <HorizontalBorder5 />
      <HorizontalBorder6 />
      <HorizontalBorder7 />
    </div>
  );
}

function HorizontalGridLines() {
  return (
    <div className="absolute content-stretch flex flex-col inset-0 items-start" data-name="Horizontal Grid Lines">
      <div className="h-[64px] relative shrink-0 w-full" data-name="HorizontalBorder">
        <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-b border-solid inset-0 pointer-events-none" />
      </div>
      <div className="h-[64px] relative shrink-0 w-full" data-name="HorizontalBorder">
        <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-b border-solid inset-0 pointer-events-none" />
      </div>
      <div className="h-[64px] relative shrink-0 w-full" data-name="HorizontalBorder">
        <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-b border-solid inset-0 pointer-events-none" />
      </div>
      <div className="h-[64px] relative shrink-0 w-full" data-name="HorizontalBorder">
        <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-b border-solid inset-0 pointer-events-none" />
      </div>
      <div className="h-[64px] relative shrink-0 w-full" data-name="HorizontalBorder">
        <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-b border-solid inset-0 pointer-events-none" />
      </div>
      <div className="h-[64px] relative shrink-0 w-full" data-name="HorizontalBorder">
        <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-b border-solid inset-0 pointer-events-none" />
      </div>
      <div className="h-[64px] relative shrink-0 w-full" data-name="HorizontalBorder">
        <div aria-hidden className="absolute border-[rgba(0,0,0,0.05)] border-b border-solid inset-0 pointer-events-none" />
      </div>
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[12px] text-white whitespace-nowrap">
        <p className="leading-[16px]">Product Strategy Review</p>
      </div>
    </div>
  );
}

function Ab6AXuDoSJwjP31NbOVxOIg0ZdAacyXz07TLo5IqAd9DGnO54TlaJnBqr0Oc2Q1HMj6ElMc1AYrScN1J0UiDfZl1KNm6NdpAqEwODgWseRe86L0OzoEtQsCgnH0M1D7EgmTg8PTbaq9YzMyCsqQUK98AgLxHgAsfWzE3Y5MzLx6CHh7VvTiVyXdHnZXqBYlG4RDr3B5URUsqQQn5MfFlh8DxeMiGkTlxxoN2UZzmCwe8W5VBNmtjK() {
  return (
    <div className="flex-[1_0_0] min-h-px relative w-full" data-name="AB6AXuDoSJwjP31nbOVxOIg0zdAacyXZ07T_lo5iqAd9DGnO54TlaJnBqr0oc2q1hMJ6elMC1AYrSC_n1j0UIDfZl1KNm6NDPAqEwODgWseRE86L0ozoEtQS-CgnH0M1d7egmTG8pTbaq9YzMYCsqQ-uK98agLxHgAsfWzE3y5MzLX6CHh7-VVTiVyXDHnZXqBYlG4rDr3B5uRUsq_qQN5MFFlh8dxeMiGkTlxxoN2uZzm-Cwe8W5vBNmtjK">
      <div className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-full left-[-39.51%] max-w-none top-0 w-[179.02%]" src={imgAb6AXuDoSJwjP31NbOVxOIg0ZdAacyXz07TLo5IqAd9DGnO54TlaJnBqr0Oc2Q1HMj6ElMc1AYrScN1J0UiDfZl1KNm6NdpAqEwODgWseRe86L0OzoEtQsCgnH0M1D7EgmTg8PTbaq9YzMyCsqQUK98AgLxHgAsfWzE3Y5MzLx6CHh7VvTiVyXdHnZXqBYlG4RDr3B5URUsqQQn5MfFlh8DxeMiGkTlxxoN2UZzmCwe8W5VBNmtjK} />
      </div>
    </div>
  );
}

function BackgroundBorder() {
  return (
    <div className="bg-[#e5e7eb] relative rounded-[9999px] shrink-0 size-[32px]" data-name="Background+Border">
      <div className="content-stretch flex flex-col items-start justify-center overflow-clip p-[2px] relative rounded-[inherit] size-full">
        <Ab6AXuDoSJwjP31NbOVxOIg0ZdAacyXz07TLo5IqAd9DGnO54TlaJnBqr0Oc2Q1HMj6ElMc1AYrScN1J0UiDfZl1KNm6NdpAqEwODgWseRe86L0OzoEtQsCgnH0M1D7EgmTg8PTbaq9YzMyCsqQUK98AgLxHgAsfWzE3Y5MzLx6CHh7VvTiVyXdHnZXqBYlG4RDr3B5URUsqQQn5MfFlh8DxeMiGkTlxxoN2UZzmCwe8W5VBNmtjK />
      </div>
      <div aria-hidden className="absolute border-2 border-solid border-white inset-0 pointer-events-none rounded-[9999px]" />
    </div>
  );
}

function Ab6AXuBbMLwfNLw4Loqqo7FrQu4Lro3I10VzV4FSOe1L9NXo63FOUgegeaC7KsR1RhcWmIxOJhnESuNnOe8MgAgVhpTvXma3Isbxh65Bl5V6RuU7D0KDtx1ZedNwbe558NKnOYtMSx7NDfJjZk3XYrZ7AgzXqezlgqZjOrKbuzc5NNsfy3DtF05FwPk3T91UiE4Bk8HbpxpqABfnXSmAAeHmo80Rul2HvIrfJlGx87DrO1NulhlWhJ() {
  return (
    <div className="flex-[1_0_0] min-h-px relative w-full" data-name="AB6AXuBB-mLwfNLw4Loqqo7FrQu4LRO3i10VzV4fS_OE1L9nXO63F-oUgegeaC7KsR1rhcWMIxOJhnESuNnOe8mgAGVhpTvXma3isbxh65BL5v6RuU7D0kDtx1zedNwbe558NKnOYtMSx7nDfJjZk3xYrZ7AgzXqezlgqZjOrKBUZC5nNSFY3Dt-f05FwPk3t91UiE4BK8Hbpxpq-ABfnXSmAAeHmo80rul2HvIrfJLGx87DrO-1nulhlWhJ">
      <div className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-full left-[-39.51%] max-w-none top-0 w-[179.02%]" src={imgAb6AXuBbMLwfNLw4Loqqo7FrQu4Lro3I10VzV4FSOe1L9NXo63FOUgegeaC7KsR1RhcWmIxOJhnESuNnOe8MgAgVhpTvXma3Isbxh65Bl5V6RuU7D0KDtx1ZedNwbe558NKnOYtMSx7NDfJjZk3XYrZ7AgzXqezlgqZjOrKbuzc5NNsfy3DtF05FwPk3T91UiE4Bk8HbpxpqABfnXSmAAeHmo80Rul2HvIrfJlGx87DrO1NulhlWhJ} />
      </div>
    </div>
  );
}

function BackgroundBorder1() {
  return (
    <div className="absolute bg-[#e5e7eb] left-[-8px] rounded-[9999px] size-[32px] top-0" data-name="Background+Border">
      <div className="content-stretch flex flex-col items-start justify-center overflow-clip p-[2px] relative rounded-[inherit] size-full">
        <Ab6AXuBbMLwfNLw4Loqqo7FrQu4Lro3I10VzV4FSOe1L9NXo63FOUgegeaC7KsR1RhcWmIxOJhnESuNnOe8MgAgVhpTvXma3Isbxh65Bl5V6RuU7D0KDtx1ZedNwbe558NKnOYtMSx7NDfJjZk3XYrZ7AgzXqezlgqZjOrKbuzc5NNsfy3DtF05FwPk3T91UiE4Bk8HbpxpqABfnXSmAAeHmo80Rul2HvIrfJlGx87DrO1NulhlWhJ />
      </div>
      <div aria-hidden className="absolute border-2 border-solid border-white inset-0 pointer-events-none rounded-[9999px]" />
    </div>
  );
}

function Margin() {
  return (
    <div className="h-[32px] relative shrink-0 w-[24px]" data-name="Margin">
      <BackgroundBorder1 />
    </div>
  );
}

function Container11() {
  return (
    <div className="absolute bottom-[10%] content-stretch flex items-start right-[-47.4px] top-[10%]" data-name="Container">
      <BackgroundBorder />
      <Margin />
    </div>
  );
}

function Background() {
  return (
    <div className="absolute bg-black content-stretch flex h-[40px] items-center left-0 px-[16px] right-[20%] rounded-[9999px] top-0" data-name="Background">
      <div className="absolute bg-[rgba(255,255,255,0)] h-[40px] left-0 right-0 rounded-[9999px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] top-0" data-name="Overlay+Shadow" />
      <Container10 />
      <Container11 />
    </div>
  );
}

function Container12() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[12px] text-white whitespace-nowrap">
        <p className="leading-[16px]">Design Sprint</p>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[10px] text-[rgba(255,255,255,0.6)] whitespace-nowrap">
        <p className="leading-[15px]">about 3 hours</p>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="relative shrink-0 size-[6.5px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="6.49996" preserveAspectRatio="none" viewBox="0 0 6.49996 6.49996" width="6.49996">
        <g id="Container">
          <path d={svgPaths.p166f9700} fill="var(--fill-0, white)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Overlay() {
  return (
    <div className="bg-[rgba(255,255,255,0.2)] content-stretch flex items-center justify-center relative rounded-[9999px] shrink-0 size-[24px]" data-name="Overlay">
      <Container15 />
    </div>
  );
}

function Container13() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Container">
      <Container14 />
      <Overlay />
    </div>
  );
}

function Margin1() {
  return (
    <div className="flex-[1_0_0] min-w-[94.11000061035156px] relative" data-name="Margin">
      <div className="flex flex-col items-end min-w-[inherit] size-full">
        <div className="content-stretch flex flex-col items-end min-w-[inherit] pl-[373.469px] relative size-full">
          <Container13 />
        </div>
      </div>
    </div>
  );
}

function Background1() {
  return (
    <div className="absolute bg-black content-stretch flex gap-[0.001px] h-[40px] items-center left-[95.31px] px-[16px] right-[286px] rounded-[9999px] top-[56px]" data-name="Background">
      <div className="absolute bg-[rgba(255,255,255,0)] h-[40px] left-0 right-0 rounded-[9999px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] top-0" data-name="Overlay+Shadow" />
      <Container12 />
      <Margin1 />
    </div>
  );
}

function Container16() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[12px] text-black whitespace-nowrap">
          <p className="leading-[16px]">Mobile App Dev</p>
        </div>
      </div>
    </div>
  );
}

function Ab6AXuCnB1ArMxpx5YXwDiDdu5Gq45KEkZsBcoTJWYdFtz2VjJyfhKrH9EisLZuJsSAi9LKQhW8JAgMVdY9Ia05FKiKwca5VUoG5Zljo6Mv6P4XMDv8VbY2DvG2GScy6UIueMpo9TmwxyqpnN5YBmIv5BX9N3UdYkAEfPjuqEw3HYvR1G6DXuYhYnv4DCjlAf9CxfA5Y2XpUqPPeIixiAra3AffnIt7JLrjmEXbl8B3CBuA() {
  return (
    <div className="flex-[1_0_0] min-h-px relative w-full" data-name="AB6AXuCnB1arMXPX5yXw_-DIDdu5-gq45-KEkZSBco-tJ-WYdFtz2vjJYFHKrH9EisLZuJS_sAI9lKQhW8jAg_mVdY9ia05fKIKwca5VUoG5ZLJO6mv6P4-xMDv8vbY2dvG2gSCY6-UIueMpo9tmwxyqpnN5YBmIv5b_X9N3udYkA-efPjuqEw3HYvR1G6dXuYhYNV4dCjlAf9CxfA5Y2xpUqPPeIixiARA3affnIT7JLrjmEXbl8-B3CBuA">
      <div className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-full left-[-39.51%] max-w-none top-0 w-[179.02%]" src={imgAb6AXuCnB1ArMxpx5YXwDiDdu5Gq45KEkZsBcoTJWYdFtz2VjJyfhKrH9EisLZuJsSAi9LKQhW8JAgMVdY9Ia05FKiKwca5VUoG5Zljo6Mv6P4XMDv8VbY2DvG2GScy6UIueMpo9TmwxyqpnN5YBmIv5BX9N3UdYkAEfPjuqEw3HYvR1G6DXuYhYnv4DCjlAf9CxfA5Y2XpUqPPeIixiAra3AffnIt7JLrjmEXbl8B3CBuA} />
      </div>
    </div>
  );
}

function BackgroundBorder2() {
  return (
    <div className="bg-[#e5e7eb] relative rounded-[9999px] shrink-0 size-[32px]" data-name="Background+Border">
      <div className="content-stretch flex flex-col items-start justify-center overflow-clip p-[2px] relative rounded-[inherit] size-full">
        <Ab6AXuCnB1ArMxpx5YXwDiDdu5Gq45KEkZsBcoTJWYdFtz2VjJyfhKrH9EisLZuJsSAi9LKQhW8JAgMVdY9Ia05FKiKwca5VUoG5Zljo6Mv6P4XMDv8VbY2DvG2GScy6UIueMpo9TmwxyqpnN5YBmIv5BX9N3UdYkAEfPjuqEw3HYvR1G6DXuYhYnv4DCjlAf9CxfA5Y2XpUqPPeIixiAra3AffnIt7JLrjmEXbl8B3CBuA />
      </div>
      <div aria-hidden className="absolute border-2 border-solid border-white inset-0 pointer-events-none rounded-[9999px]" />
    </div>
  );
}

function Margin2() {
  return (
    <div className="flex-[1_0_0] h-[32px] min-w-[32px] relative" data-name="Margin">
      <div className="flex flex-col items-end min-w-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-end min-w-[inherit] pl-[229.562px] relative size-full">
          <BackgroundBorder2 />
        </div>
      </div>
    </div>
  );
}

function BackgroundBorderShadow() {
  return (
    <div className="absolute bg-white content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex gap-[0.008px] h-[40px] items-center left-[285.97px] px-[17px] py-px right-[285.98px] rounded-[9999px] top-[112px]" data-name="Background+Border+Shadow">
      <div aria-hidden className="absolute border border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <Container16 />
      <Margin2 />
    </div>
  );
}

function Container17() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[12px] text-white whitespace-nowrap">
        <p className="leading-[16px]">Client Feedback Cycle</p>
      </div>
    </div>
  );
}

function Ab6AXuDcotmOmvgLnUtOjzzqChoCoCclJKpIDSiONvbSteeVHgmaMxSshvmv4EfIYkUz6QD1UIzkX5VcHcfhzfutSfgs8E2FGp7NbJsEmuByxpE7CL5ANyInjv8Kps6IzhXxVUa0LwgNqn1OrDcn5AIi9MvaiiFpAmZLvSnPgnEzsxnbGzVEcg0EqFVmSkPlsTgZ7UEjl61RAuIZaIkvWqyHv6DqHfDy6L2LDcm443YjomYokWfKnZ() {
  return (
    <div className="flex-[1_0_0] min-h-px relative w-full" data-name="AB6AXuDcotmOmvgLnUTOjzzqCho_coCclJ-Kp_iDSiONvbSteeVHgmaMxSshvmv4EfI-ykUz6qD1UIzkX5VcHcfhzfutSFGS8e2fGP7NB_jsEMUByxpE7cL5aNyInjv8Kps6IzhXxVUa0LWGNqn1OrDcn5AIi9mvaii_fpAmZLvSNPgnEZSXNBGzVEcg0EqFVmSKPlsTgZ7uEJL61RAuIZaIkvWqyHV6DQHfDy6l2LDcm443yjomYOKWfKnZ">
      <div className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-full left-[-41.76%] max-w-none top-0 w-[183.51%]" src={imgAb6AXuDcotmOmvgLnUtOjzzqChoCoCclJKpIDSiONvbSteeVHgmaMxSshvmv4EfIYkUz6QD1UIzkX5VcHcfhzfutSfgs8E2FGp7NbJsEmuByxpE7CL5ANyInjv8Kps6IzhXxVUa0LwgNqn1OrDcn5AIi9MvaiiFpAmZLvSnPgnEzsxnbGzVEcg0EqFVmSkPlsTgZ7UEjl61RAuIZaIkvWqyHv6DqHfDy6L2LDcm443YjomYokWfKnZ} />
      </div>
    </div>
  );
}

function BackgroundBorder3() {
  return (
    <div className="bg-[#e5e7eb] mr-[-8px] relative rounded-[9999px] shrink-0 size-[32px]" data-name="Background+Border">
      <div className="content-stretch flex flex-col items-start justify-center overflow-clip p-[2px] relative rounded-[inherit] size-full">
        <Ab6AXuDcotmOmvgLnUtOjzzqChoCoCclJKpIDSiONvbSteeVHgmaMxSshvmv4EfIYkUz6QD1UIzkX5VcHcfhzfutSfgs8E2FGp7NbJsEmuByxpE7CL5ANyInjv8Kps6IzhXxVUa0LwgNqn1OrDcn5AIi9MvaiiFpAmZLvSnPgnEzsxnbGzVEcg0EqFVmSkPlsTgZ7UEjl61RAuIZaIkvWqyHv6DqHfDy6L2LDcm443YjomYokWfKnZ />
      </div>
      <div aria-hidden className="absolute border-2 border-solid border-white inset-0 pointer-events-none rounded-[9999px]" />
    </div>
  );
}

function Ab6AXuDo9XtiMuTzRmJdGt3XaHyHzjeraNnxjrOAx6Rim5TuBpE3N4MkjT4LSuoiMDr7THoa34AsfqaSaoBra36HWlDqofU672SRl6NFhlfhuJia4Sj88BVobMQj15Zp5ULcVv7MLkI976LrPtoWYd5NUpAhkqtjLncmDuyGe76IwCJpHj1CzFKvet3SmmYtjhymN8MPnJyqD0KRaZhdafLaAo8K1StSa2VaM6CMs3OyH1XOvWzmvh() {
  return (
    <div className="flex-[1_0_0] min-h-px relative w-full" data-name="AB6AXuDO9xtiMUTzRmJDGt3XaHyHzjeraNnxjrOAx-6Rim5tuBpE3N4mkjT4LSuoiMDr7tHOA34ASFQASaoBRA36hWlDqofU672SRl6nFHLFHUJia4sj88bVOB-mQj15ZP5U-LcVv7mLkI976LRPto_WYd5NUpAHKQTJLncmDuyGe76iwCJpHJ1czFKvet3smmYtjhymN8mPNJyqD0KRaZhdafLaAo8K_1StSa2VaM6cMS3OyH1xOV_WZMVH">
      <div className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-full left-[-39.51%] max-w-none top-0 w-[179.02%]" src={imgAb6AXuDo9XtiMuTzRmJdGt3XaHyHzjeraNnxjrOAx6Rim5TuBpE3N4MkjT4LSuoiMDr7THoa34AsfqaSaoBra36HWlDqofU672SRl6NFhlfhuJia4Sj88BVobMQj15Zp5ULcVv7MLkI976LrPtoWYd5NUpAhkqtjLncmDuyGe76IwCJpHj1CzFKvet3SmmYtjhymN8MPnJyqD0KRaZhdafLaAo8K1StSa2VaM6CMs3OyH1XOvWzmvh} />
      </div>
    </div>
  );
}

function BackgroundBorder4() {
  return (
    <div className="bg-[#e5e7eb] relative rounded-[9999px] shrink-0 size-[32px]" data-name="Background+Border">
      <div className="content-stretch flex flex-col items-start justify-center overflow-clip p-[2px] relative rounded-[inherit] size-full">
        <Ab6AXuDo9XtiMuTzRmJdGt3XaHyHzjeraNnxjrOAx6Rim5TuBpE3N4MkjT4LSuoiMDr7THoa34AsfqaSaoBra36HWlDqofU672SRl6NFhlfhuJia4Sj88BVobMQj15Zp5ULcVv7MLkI976LrPtoWYd5NUpAhkqtjLncmDuyGe76IwCJpHj1CzFKvet3SmmYtjhymN8MPnJyqD0KRaZhdafLaAo8K1StSa2VaM6CMs3OyH1XOvWzmvh />
      </div>
      <div aria-hidden className="absolute border-2 border-solid border-white inset-0 pointer-events-none rounded-[9999px]" />
    </div>
  );
}

function Margin4() {
  return (
    <div className="content-stretch flex flex-col items-start mr-[-8px] relative shrink-0 size-[32px]" data-name="Margin">
      <BackgroundBorder4 />
    </div>
  );
}

function BackgroundBorder5() {
  return (
    <div className="bg-black content-stretch flex items-center justify-center p-[2px] relative rounded-[9999px] shrink-0 size-[32px]" data-name="Background+Border">
      <div aria-hidden className="absolute border-2 border-solid border-white inset-0 pointer-events-none rounded-[9999px]" />
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[10px] text-center text-white whitespace-nowrap">
        <p className="leading-[15px]">+2</p>
      </div>
    </div>
  );
}

function Margin5() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 size-[32px]" data-name="Margin">
      <BackgroundBorder5 />
    </div>
  );
}

function Container18() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Container">
      <BackgroundBorder3 />
      <Margin4 />
      <Margin5 />
    </div>
  );
}

function Margin3() {
  return (
    <div className="flex-[1_0_0] min-w-[80px] relative" data-name="Margin">
      <div className="flex flex-col items-end min-w-[inherit] size-full">
        <div className="content-stretch flex flex-col items-end min-w-[inherit] pl-[623.75px] relative size-full">
          <Container18 />
        </div>
      </div>
    </div>
  );
}

function Background2() {
  return (
    <div className="absolute bg-black content-stretch flex h-[40px] items-center left-0 px-[16px] right-[95.33px] rounded-[9999px] top-[168px]" data-name="Background">
      <div className="absolute bg-[rgba(255,255,255,0)] h-[40px] left-0 right-0 rounded-[9999px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] top-0" data-name="Overlay+Shadow" />
      <Container17 />
      <Margin3 />
    </div>
  );
}

function ContentLayersTimelineBars({ events, viewMode, anchorDate }) {
  const { start: viewStart, end: viewEnd } = useMemo(() => getDateRange(anchorDate, viewMode), [anchorDate, viewMode]);
  const viewDurationMs = viewEnd.getTime() - viewStart.getTime();

  return (
    <div className="col-[1/span_7] min-h-[208px] justify-self-stretch relative row-1 shrink-0" data-name="Timeline bars">
      {events.map((event, index) => {
        const start = getEventStartDate(event);
        const end = getEventEndDate(event);
        
        if (!start || !end || end < viewStart || start > viewEnd) return null;

        const effectiveStart = start < viewStart ? viewStart : start;
        const effectiveEnd = end > viewEnd ? viewEnd : end;

        const leftPercent = ((effectiveStart.getTime() - viewStart.getTime()) / viewDurationMs) * 100;
        const widthPercent = ((effectiveEnd.getTime() - effectiveStart.getTime()) / viewDurationMs) * 100;
        const top = index * 56; // 40px height + 16px gap

        return (
          <div key={event.id || index} className="absolute bg-black content-stretch flex h-[40px] items-center px-[16px] rounded-[9999px] overflow-hidden" style={{ left: `${leftPercent}%`, width: `${widthPercent}%`, top: `${top}px` }}>
             <div className="absolute bg-[rgba(255,255,255,0)] h-[40px] left-0 right-0 rounded-[9999px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] top-0" />
             <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[12px] text-white whitespace-nowrap">
                <p className="leading-[16px] truncate">{event.summary || event.title || "Event"}</p>
             </div>
          </div>
        );
      })}
    </div>
  );
}

function GridColumns({ events, anchorDate, viewMode }) {
  return (
    <div className="col-[2/span_7] grid grid-cols-[repeat(7,minmax(0,1fr))] grid-rows-[_546px] justify-self-stretch relative row-1 self-start shrink-0" data-name="Grid Columns">
      <HorizontalGridLines />
      <ContentLayersTimelineBars events={events} anchorDate={anchorDate} viewMode={viewMode} />
    </div>
  );
}

function Container9({ events, anchorDate, viewMode }) {
  return (
    <div className="grid grid-cols-[repeat(8,minmax(0,1fr))] grid-rows-[_546px] min-h-[546px] relative shrink-0 w-full" data-name="Container">
      <TimeColumn />
      <GridColumns events={events} anchorDate={anchorDate} viewMode={viewMode} />
    </div>
  );
}

function ScrollableBody({ events, anchorDate, viewMode }) {
  return (
    <div className="flex-[1_0_0] min-h-px relative w-full" data-name="Scrollable Body">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-auto relative rounded-[inherit] size-full">
        <Container9 events={events} anchorDate={anchorDate} viewMode={viewMode} />
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
             <ScrollableBody events={events} anchorDate={anchorDate} viewMode={viewMode} />
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

function Container33() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#71717a] text-[12px] w-full">
        <p className="leading-[normal]">Type searching...</p>
      </div>
    </div>
  );
}

function Input() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="Input">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[12px] py-[8px] relative size-full">
          <Container33 />
        </div>
      </div>
    </div>
  );
}

function OverlayBorderOverlayBlur() {
  return (
    <div className="absolute backdrop-blur-[20px] bg-[rgba(255,255,255,0.8)] content-stretch flex h-[40px] items-center justify-center opacity-0 pl-[49px] pr-[17px] py-px right-0 rounded-[9999px] top-0 w-[192px]" data-name="Overlay+Border+OverlayBlur">
      <div aria-hidden className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[9999px]" />
      <div className="absolute bg-[rgba(255,255,255,0)] h-[40px] right-0 rounded-[9999px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] top-0 w-[192px]" data-name="Overlay+Shadow" />
      <Input />
    </div>
  );
}

function Container34() {
  return (
    <div className="relative shrink-0 size-[14.327px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="14.3269" preserveAspectRatio="none" viewBox="0 0 14.3269 14.3269" width="14.3269">
        <g id="Container">
          <path d={svgPaths.p2436f20} fill="var(--fill-0, white)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Background4() {
  return (
    <div className="bg-black content-stretch flex items-center justify-center relative rounded-[9999px] shrink-0 size-[40px]" data-name="Background">
      <div className="absolute bg-[rgba(255,255,255,0)] left-0 rounded-[9999px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] size-[40px] top-0" data-name="Overlay+Shadow" />
      <Container34 />
    </div>
  );
}

function Container32() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <OverlayBorderOverlayBlur />
      <Background4 />
    </div>
  );
}

function Container35() {
  return (
    <div className="h-[15.994px] relative shrink-0 w-[12.5px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="15.9935" preserveAspectRatio="none" viewBox="0 0 12.4999 15.9935" width="12.4999">
        <g id="Container">
          <path d={svgPaths.pdd33600} fill="var(--fill-0, #71717A)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button3() {
  return (
    <div className="backdrop-blur-[12px] bg-[rgba(255,255,255,0.8)] content-stretch flex items-center justify-center p-px relative rounded-[9999px] shrink-0 size-[40px]" data-name="Button">
      <div aria-hidden className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[9999px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
      <Container35 />
    </div>
  );
}

function Container36() {
  return (
    <div className="h-[12.5px] relative shrink-0 w-[15.833px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="12.4999" preserveAspectRatio="none" viewBox="0 0 15.8333 12.4999" width="15.8333">
        <g id="Container">
          <path d={svgPaths.pe0de000} fill="var(--fill-0, #71717A)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function BackgroundBorder6() {
  return (
    <div className="absolute bg-black h-[18px] right-[5px] rounded-[9999px] top-[3.25px] w-[16px]" data-name="Background+Border">
      <div aria-hidden className="absolute border-2 border-solid border-white inset-0 pointer-events-none rounded-[9999px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center p-[2px] relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[9px] text-center text-white whitespace-nowrap">
          <p className="leading-[13.5px]">+8</p>
        </div>
      </div>
    </div>
  );
}

function Button4() {
  return (
    <div className="backdrop-blur-[12px] bg-[rgba(255,255,255,0.8)] content-stretch flex items-center justify-center p-px relative rounded-[9999px] shrink-0 size-[40px]" data-name="Button">
      <div aria-hidden className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[9999px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
      <Container36 />
      <BackgroundBorder6 />
    </div>
  );
}

function Container31() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-name="Container">
      <Container32 />
      <Button3 />
      <Button4 />
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

function Container37() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-white whitespace-nowrap">
        <p className="leading-[28px]">C</p>
      </div>
    </div>
  );
}

function Background5() {
  return (
    <div className="bg-black content-stretch flex items-center justify-center relative rounded-[16px] shrink-0 size-[40px]" data-name="Background">
      <Container37 />
    </div>
  );
}

function Margin6() {
  return (
    <div className="relative shrink-0" data-name="Margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[48px] relative size-full">
        <Background5 />
      </div>
    </div>
  );
}

function Container38() {
  return (
    <div className="h-[16.894px] relative shrink-0 w-[15px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="16.8941" preserveAspectRatio="none" viewBox="0 0 14.9999 16.8941" width="14.9999">
        <g id="Container">
          <path d={svgPaths.p32639c0} fill="var(--fill-0, #71717A)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Link() {
  return (
    <button className="content-stretch flex items-center justify-center relative rounded-[16px] shrink-0 size-[48px] transition hover:bg-black/10" data-name="Link" onClick={() => goToDashboardRoute("/inbox")} type="button">
      <Container38 />
    </button>
  );
}

function Container39() {
  return (
    <div className="h-[20px] relative shrink-0 w-[18px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 18 20" width="18">
        <g id="Container">
          <path d={svgPaths.p1333bc80} fill="var(--fill-0, white)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Link1() {
  return (
    <button className="bg-[#131313] content-stretch flex items-center justify-center relative rounded-[16px] shrink-0 size-[48px]" data-name="Link" onClick={() => goToDashboardRoute("/management")} type="button">
      <div className="absolute bg-[rgba(255,255,255,0)] left-0 rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] size-[48px] top-0" data-name="Link:shadow" />
      <Container39 />
    </button>
  );
}

function Container40() {
  return (
    <div className="h-[14.615px] relative shrink-0 w-[20.404px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="14.6153" preserveAspectRatio="none" viewBox="0 0 20.4037 14.6153" width="20.4037">
        <g id="Container">
          <path d={svgPaths.p5df6b00} fill="var(--fill-0, #71717A)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Link2() {
  return (
    <button className="content-stretch flex items-center justify-center relative rounded-[16px] shrink-0 size-[48px] transition hover:bg-black/10" data-name="Link" onClick={() => goToDashboardRoute("/ai-chat")} type="button">
      <Container40 />
    </button>
  );
}

function Nav() {
  return (
    <div className="flex-[1_0_0] min-h-px relative" data-name="Nav">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[24px] items-start relative size-full">
        <Link />
        <Link1 />
        <Link2 />
      </div>
    </div>
  );
}

function Profile() {
  const user = getStoredUser();

  return (
    <div className="flex-[1_0_0] min-h-px relative w-full" data-name="Profile">
      <div className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-full left-[-41.76%] max-w-none top-0 w-[183.51%]" src={user.avatar || imgProfile} />
      </div>
    </div>
  );
}

function OverlayBorderShadow1() {
  return (
    <div className="bg-[rgba(255,255,255,0)] relative rounded-[24px] shrink-0 size-[48px]" data-name="Overlay+Border+Shadow">
      <div className="content-stretch flex flex-col items-start justify-center overflow-clip p-[2px] relative rounded-[inherit] size-full">
        <Profile />
      </div>
      <div aria-hidden className="absolute border-2 border-solid border-white inset-0 pointer-events-none rounded-[24px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]" />
    </div>
  );
}

function Container41() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[72px] relative size-full">
        <OverlayBorderShadow1 />
      </div>
    </div>
  );
}

function AsideSidebarNavigation() {
  return (
    <div className="fixed backdrop-blur-[32px] bg-[rgba(255,255,255,0.8)] content-stretch flex flex-col h-[calc(100vh-48px)] items-center justify-between left-[24px] px-px py-[33px] rounded-[40px] top-[24px] w-[80px] z-20" data-name="Aside - SIDEBAR NAVIGATION">
      <div aria-hidden className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[40px]" />
      <div className="absolute bg-[rgba(255,255,255,0)] inset-0 rounded-[40px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]" data-name="Aside - SIDEBAR NAVIGATION:shadow" />
      <Margin6 />
      <Nav />
      <Container41 />
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
        
        const response = await fetch(`${BACKEND_URL}/calendar/events?${params}`);
        if (!response.ok) throw new Error("Failed to fetch events");
        const data = await response.json();
        
        if (isMounted) {
          setEvents(Array.isArray(data) ? data : []);
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
      <AsideSidebarNavigation />
    </div>
  );
}
