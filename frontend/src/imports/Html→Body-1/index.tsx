import { useEffect, useMemo, useState } from "react";
import svgPaths from "./svg-nwc2hakocy";
import imgUser from "./4a1497f7eb1ac52188d5053d788a4d72df0d0413.png";
import imgAb6AXuDvbHxrbuVhg1CxgVRnp3GbZa4Old7KtXqrMAhKYb7FCCtfyTb9Mmx6B289OHbPoeKin4Fz3F4BSniJvKooKl4OpOjrdoydQj15Jf1UjmainIiccvmtNoD8VwOgXcTm6L8TkRw3IaiG6GfqPmsIimxmMOck56Plr4ReE6Col2PMe1AGnWl3TyZlbJmceSWtJnBozL4JfLvAeRuOfuQ4FMy7O4SbG5ShWyGkBfONvB131Mkf91 from "./5c4ad065e5f19199a785d71e4c5d61062d7e3cb5.png";
import imgAb6AXuDqO7V5AwAyx2ZssExUwt8II0VjALmOfiNk1Z6Fdyr7CcsD1Nfg4GqYYtwq4UnEqAwjoZwnzOUe3JpQrkN7Yz2Y3IejFueTwGbGpL3EVmidjGz7CkdSzQkUt8Zp3U6J9JeBq24T1DTdiC1HbRgnUyxoD54QqTuExkM48WBbAsTScJcEYqGAxDf2Qs6GJyNq6VocoYmJfXXrRxOw8U5Padx0LybFxXqhYuP8424QvwFfqDgr8J from "./d513c005e3f5d6265cd28b326d58c875870f48b6.png";
import imgAb6AXuCnWWvxCwWotdJonDOry7LqGoBtWfGkrNdzLl6V3NXgiytJc1COUyS2NuRzLaXc8R9LJadjn7Kmaqx06R1PKeEt2EbnxAcCf6KQmGeXTiGp7FB4P6I1KcGnq9QcOfarE9PkCwzDHcpMtcBZf61BElK6IPq40PgQMc19RFlB8GUsUqbUnJix2ChmqRHwLq3XjaTlInDw4Hyln9W4LboWtVwKkXh9AaD4IQNoVeSfIfoJrSrFjSta from "./f8b86dcc2c9ae6bb334d4eb80ebbadac4209784d.png";

function Container1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-white whitespace-nowrap">
        <p className="leading-[28px]">C</p>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="bg-black content-stretch flex items-center justify-center relative rounded-[12px] shrink-0 size-[40px]" data-name="Logo">
      <Container1 />
    </div>
  );
}

function Svg() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="24" preserveAspectRatio="none" viewBox="0 0 24 24" width="24">
        <g id="SVG">
          <path d={svgPaths.p42a6600} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
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

function Link({ active }) {
  return (
    <button className={`${active ? "bg-black" : "bg-transparent"} relative rounded-[12px] shrink-0 transition hover:bg-black/10 w-full`} data-name="Link" onClick={() => goToDashboardRoute("/inbox")} type="button">
      <div className="content-stretch flex flex-col items-start p-[8px] relative size-full">
        <Svg />
      </div>
    </button>
  );
}

function Svg1() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="24" preserveAspectRatio="none" viewBox="0 0 24 24" width="24">
        <g id="SVG">
          <path d={svgPaths.p12978b80} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Link1({ active }) {
  return (
    <button className={`${active ? "bg-black" : "bg-transparent"} content-stretch flex flex-col items-start p-[8px] relative rounded-[12px] shrink-0 transition hover:bg-black/10 w-full`} data-name="Link" onClick={() => goToDashboardRoute("/management")} style={{ "--stroke-0": active ? "white" : "#9CA3AF" }} type="button">
      <Svg1 />
    </button>
  );
}

function Svg2() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="24" preserveAspectRatio="none" viewBox="0 0 24 24" width="24">
        <g id="SVG">
          <path d={svgPaths.p2373ef00} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Link2({ active }) {
  return (
    <button className={`${active ? "bg-black" : "bg-transparent"} content-stretch flex flex-col items-start p-[8px] relative rounded-[12px] shrink-0 transition hover:bg-black/10 w-full`} data-name="Link" onClick={() => goToDashboardRoute("/ai-chat")} style={{ "--stroke-0": active ? "white" : "#9CA3AF" }} type="button">
      <Svg2 />
    </button>
  );
}

function NavIcons() {
  const pathname = typeof window === "undefined" ? "/inbox" : window.location.pathname;

  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start pb-[72px] relative shrink-0 w-[40px]" data-name="Nav Icons">
      <Link active={pathname === "/inbox"} />
      <Link1 active={pathname === "/management"} />
      <Link2 active={pathname === "/ai-chat"} />
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col gap-[40px] items-center relative shrink-0" data-name="Container">
      <Logo />
      <NavIcons />
    </div>
  );
}

function User() {
  const user = getStoredUser();

  return (
    <div className="pointer-events-none relative rounded-[9999px] shrink-0 size-[40px]" data-name="User">
      <div className="absolute inset-0 overflow-hidden rounded-[9999px]">
        <img alt="" className="absolute h-full left-[-41.76%] max-w-none top-0 w-[183.51%]" src={user.avatar || imgUser} />
      </div>
      <div aria-hidden className="absolute border-2 border-solid border-white inset-0 rounded-[9999px]" />
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <User />
      <div className="absolute bg-[#22c55e] bottom-[-4px] right-[-4px] rounded-[9999px] size-[12px]" data-name="Background+Border">
        <div aria-hidden className="absolute border-2 border-solid border-white inset-0 pointer-events-none rounded-[9999px]" />
      </div>
    </div>
  );
}

function Container3() {
  const user = getStoredUser();

  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[10px] whitespace-nowrap">
        <p className="leading-[15px]">{user.name || "Profile"}</p>
      </div>
    </div>
  );
}

function UserProfileArea() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0" data-name="User Profile Area">
      <Container2 />
      <Container3 />
    </div>
  );
}

function AsideLeftSidebar() {
  return (
    <div className="bg-white content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex flex-col h-[calc(100vh-32px)] items-center justify-between py-[32px] sticky top-[16px] rounded-[32px] shrink-0 w-[80px] z-20" data-name="Aside - Left Sidebar">
      <Container />
      <UserProfileArea />
    </div>
  );
}

function Heading() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 1">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[36px] text-black tracking-[-0.9px] whitespace-nowrap">
        <p className="leading-[40px]">MailSense</p>
      </div>
    </div>
  );
}

function Svg3() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="SVG">
          <path d={svgPaths.p2b6e9900} id="Vector" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Svg4() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="12" preserveAspectRatio="none" viewBox="0 0 12 12" width="12">
        <g id="SVG">
          <path d="M9.5 4.5L6 8L2.5 4.5" id="Vector" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Container5() {
  const [currentDate, setCurrentDate] = useState(() => formatHeaderDate(new Date()));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentDate(formatHeaderDate(new Date()));
    }, 60 * 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Container">
      <Svg3 />
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">{currentDate}</p>
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex flex-col gap-[3.5px] items-start relative shrink-0 w-[245.78px]" data-name="Container">
      <Heading />
      <Container5 />
    </div>
  );
}

function Svg6() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="SVG">
          <path d={svgPaths.p80220e0} id="Vector" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

const DEFAULT_WEATHER_LOCATION = {
  latitude: 28.6139,
  longitude: 77.209,
};

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
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy showers",
  85: "Snow showers",
  86: "Snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm",
};

function formatClock(date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  });
}

function getWeatherLabel(code, isDay) {
  if (code === 0 && isDay === 0) return "Clear night";
  return weatherCodeLabels[code] || "Weather";
}

function getBrowserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(DEFAULT_WEATHER_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => resolve(DEFAULT_WEATHER_LOCATION),
      {
        enableHighAccuracy: false,
        maximumAge: 30 * 60 * 1000,
        timeout: 5000,
      }
    );
  });
}

function Container7({ time }) {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Container">
      <Svg6 />
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black whitespace-nowrap">
        <p className="leading-[16px]">{time}</p>
      </div>
    </div>
  );
}

function Svg7() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="SVG">
          <path d={svgPaths.p36e88e80} fill="var(--fill-0, #FB923C)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container8({ weather }) {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Container">
      <Svg7 />
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black whitespace-nowrap">
        <p className="leading-[16px]">{weather}</p>
      </div>
      <div className="hidden">
        <p className="leading-[16px]">23° Sunny</p>
      </div>
    </div>
  );
}

function WeatherWidget() {
  const [time, setTime] = useState(() => formatClock(new Date()));
  const [weather, setWeather] = useState("Loading...");

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

        if (!response.ok) {
          throw new Error("Weather request failed");
        }

        const data = await response.json();
        const current = data.current;
        const temperature = Math.round(current.temperature_2m);
        const label = getWeatherLabel(current.weather_code, current.is_day);

        if (isMounted) {
          setWeather(`${temperature}° ${label}`);
        }
      } catch {
        if (isMounted) {
          setWeather("Weather unavailable");
        }
      }
    }

    loadWeather();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-white content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex gap-[12px] items-center px-[16px] py-[8px] relative rounded-[9999px] shrink-0" data-name="Weather Widget">
      <Container7 time={time} />
      <Container8 weather={weather} />
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px overflow-clip relative" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[14px] w-full">
        <p className="leading-[normal]">Type searching...</p>
      </div>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-white relative rounded-[9999px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-start justify-center pb-[14px] pt-[13px] px-[48px] relative size-full">
          <Container9 />
        </div>
      </div>
    </div>
  );
}

function Svg8() {
  return (
    <div className="-translate-y-1/2 absolute left-[20px] size-[16px] top-1/2" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="SVG">
          <path d={svgPaths.p2aa1a600} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function SearchBar() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[256px]" data-name="Search Bar">
      <Input />
      <Svg8 />
    </div>
  );
}

function Svg9() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 20 20" width="20">
        <g id="SVG">
          <path d={svgPaths.p1c877100} id="Vector" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function BackgroundShadow() {
  return (
    <div className="bg-white content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex items-center justify-center relative rounded-[9999px] shrink-0 size-[40px]" data-name="Background+Shadow">
      <Svg9 />
      <div className="absolute bg-black right-[8px] rounded-[9999px] size-[8px] top-[8px]" data-name="Background" />
    </div>
  );
}

function Svg10() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 20 20" width="20">
        <g id="SVG">
          <path d={svgPaths.pe78580} id="Vector" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Background() {
  return (
    <div className="absolute bg-black content-stretch flex items-center justify-center right-[-4px] rounded-[9999px] size-[16px] top-[-4px]" data-name="Background">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[9px] text-center text-white whitespace-nowrap">
        <p className="leading-[13.5px]">12</p>
      </div>
    </div>
  );
}

function BackgroundShadow1() {
  return (
    <div className="bg-white content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex items-center justify-center relative rounded-[9999px] shrink-0 size-[40px]" data-name="Background+Shadow">
      <Svg10 />
      <Background />
    </div>
  );
}

function SecondaryIcons() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-name="Secondary Icons">
      <BackgroundShadow />
      <BackgroundShadow1 />
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-name="Container">
      <WeatherWidget />
      <SearchBar />
      <SecondaryIcons />
    </div>
  );
}

function HeaderSection() {
  return (
    <div className="absolute content-stretch flex items-center justify-between left-0 pr-[16px] right-0 top-0" data-name="Header Section">
      <Container4 />
      <Container6 />
    </div>
  );
}

function Heading1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Heading 2">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[24px] text-black whitespace-nowrap">
        <p className="leading-[32px]">Inbox</p>
      </div>
    </div>
  );
}

function Svg11() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 20 20" width="20">
        <g id="SVG">
          <path d={svgPaths.p199ad100} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="content-stretch flex flex-col items-start p-[8px] relative rounded-[9999px] shrink-0" data-name="Button">
      <Svg11 />
    </div>
  );
}

function Svg12() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 20 20" width="20">
        <g id="SVG">
          <path d={svgPaths.p2852ea00} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Button1() {
  return (
    <div className="content-stretch flex flex-col items-start p-[8px] relative rounded-[9999px] shrink-0" data-name="Button">
      <Svg12 />
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0" data-name="Container">
      <Button />
      <Button1 />
    </div>
  );
}

function InboxHeader() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Inbox Header">
      <Heading1 />
      <Container11 />
    </div>
  );
}

function InboxHeaderMargin() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[24px] relative shrink-0 w-full" data-name="Inbox Header:margin">
      <InboxHeader />
    </div>
  );
}

function Button2() {
  return (
    <div className="relative shrink-0" data-name="Button">
      <div aria-hidden className="absolute border-b-2 border-black border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center pb-[14px] pt-[12px] px-[24px] relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-black text-center whitespace-nowrap">
          <p className="leading-[20px]">Primary</p>
        </div>
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="relative shrink-0" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center pb-[13.5px] pt-[12.5px] px-[24px] relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[14px] text-center whitespace-nowrap">
          <p className="leading-[20px]">Promotions</p>
        </div>
      </div>
    </div>
  );
}

function Button4() {
  return (
    <div className="relative shrink-0" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center pb-[13.5px] pt-[12.5px] px-[24px] relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[14px] text-center whitespace-nowrap">
          <p className="leading-[20px]">Social</p>
        </div>
      </div>
    </div>
  );
}

function Tabs() {
  return (
    <div className="content-stretch flex items-start pb-px relative shrink-0 w-full" data-name="Tabs">
      <div aria-hidden className="absolute border-[#f3f4f6] border-b border-solid inset-0 pointer-events-none" />
      <Button2 />
      <Button3 />
      <Button4 />
    </div>
  );
}

function TabsMargin() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[16px] relative shrink-0 w-full" data-name="Tabs:margin">
      <Tabs />
    </div>
  );
}

function Background1() {
  return (
    <div className="bg-[#dbeafe] content-stretch flex items-center justify-center pb-[12.5px] pt-[11.5px] relative rounded-[9999px] shrink-0 size-[40px]" data-name="Background">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#2563eb] text-[12px] text-center whitespace-nowrap">
        <p className="leading-[16px]">JD</p>
      </div>
    </div>
  );
}

function Margin() {
  return (
    <div className="content-stretch flex flex-col h-[40px] items-start pr-[16px] relative shrink-0 w-[56px]" data-name="Margin">
      <Background1 />
    </div>
  );
}

function Container14() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 overflow-clip top-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-black whitespace-nowrap">
        <p className="leading-[20px]">Jane Doe</p>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Container">
      <Container14 />
      <div className="-translate-y-1/2 [word-break:break-word] absolute flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] left-[456.17px] not-italic text-[#9ca3af] text-[10px] top-[11.5px] whitespace-nowrap">
        <p className="leading-[15px]">10:45 AM</p>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[12px] w-full">
        <p className="leading-[16px]">{`Project Update: Q3 Design System - Hey team, I've updated the Figma files...`}</p>
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative" data-name="Container">
      <Container13 />
      <Container15 />
    </div>
  );
}

function EmailItem() {
  return (
    <div className="relative rounded-[24px] shrink-0 w-full" data-name="Email Item 1">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center p-[16px] relative size-full">
          <Margin />
          <Container12 />
        </div>
      </div>
    </div>
  );
}

function Background2() {
  return (
    <div className="bg-[#f3e8ff] content-stretch flex items-center justify-center pb-[12.5px] pt-[11.5px] relative rounded-[9999px] shrink-0 size-[40px]" data-name="Background">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#9333ea] text-[12px] text-center whitespace-nowrap">
        <p className="leading-[16px]">AS</p>
      </div>
    </div>
  );
}

function Margin1() {
  return (
    <div className="content-stretch flex flex-col h-[40px] items-start pr-[16px] relative shrink-0 w-[56px]" data-name="Margin">
      <Background2 />
    </div>
  );
}

function Container18() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 overflow-clip top-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-black whitespace-nowrap">
        <p className="leading-[20px]">Alex Smith</p>
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Container">
      <Container18 />
      <div className="-translate-y-1/2 [word-break:break-word] absolute flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] left-[453.64px] not-italic text-[#9ca3af] text-[10px] top-[11.5px] whitespace-nowrap">
        <p className="leading-[15px]">Yesterday</p>
      </div>
    </div>
  );
}

function Container19() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[12px] w-full">
        <p className="leading-[16px]">Weekly Sync Meeting - Just a reminder about our sync tomorrow at 9 AM.</p>
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative" data-name="Container">
      <Container17 />
      <Container19 />
    </div>
  );
}

function EmailItem1() {
  return (
    <div className="relative rounded-[24px] shrink-0 w-full" data-name="Email Item 2">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center p-[16px] relative size-full">
          <Margin1 />
          <Container16 />
        </div>
      </div>
    </div>
  );
}

function Background3() {
  return (
    <div className="bg-[#fee2e2] content-stretch flex items-center justify-center pb-[12.5px] pt-[11.5px] relative rounded-[9999px] shrink-0 size-[40px]" data-name="Background">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#dc2626] text-[12px] text-center whitespace-nowrap">
        <p className="leading-[16px]">M</p>
      </div>
    </div>
  );
}

function Margin2() {
  return (
    <div className="content-stretch flex flex-col h-[40px] items-start pr-[16px] relative shrink-0 w-[56px]" data-name="Margin">
      <Background3 />
    </div>
  );
}

function Container22() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 overflow-clip top-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-black whitespace-nowrap">
        <p className="leading-[20px]">Marketing Team</p>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Container">
      <Container22 />
      <div className="-translate-y-1/2 [word-break:break-word] absolute flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] left-[465.83px] not-italic text-[#9ca3af] text-[10px] top-[11.5px] whitespace-nowrap">
        <p className="leading-[15px]">May 30</p>
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[12px] w-full">
        <p className="leading-[16px]">New Campaign Assets - The assets for the June campaign are ready for review.</p>
      </div>
    </div>
  );
}

function Container20() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative" data-name="Container">
      <Container21 />
      <Container23 />
    </div>
  );
}

function EmailItem2() {
  return (
    <div className="relative rounded-[24px] shrink-0 w-full" data-name="Email Item 3">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center p-[16px] relative size-full">
          <Margin2 />
          <Container20 />
        </div>
      </div>
    </div>
  );
}

function Background4() {
  return (
    <div className="bg-[#f3f4f6] content-stretch flex items-center justify-center pb-[12.5px] pt-[11.5px] relative rounded-[9999px] shrink-0 size-[40px]" data-name="Background">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#4b5563] text-[12px] text-center whitespace-nowrap">
        <p className="leading-[16px]">BK</p>
      </div>
    </div>
  );
}

function Margin3() {
  return (
    <div className="content-stretch flex flex-col h-[40px] items-start pr-[16px] relative shrink-0 w-[56px]" data-name="Margin">
      <Background4 />
    </div>
  );
}

function Container26() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 overflow-clip top-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-black whitespace-nowrap">
        <p className="leading-[20px]">Brian King</p>
      </div>
    </div>
  );
}

function Container25() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Container">
      <Container26 />
      <div className="-translate-y-1/2 [word-break:break-word] absolute flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] left-[466.16px] not-italic text-[#9ca3af] text-[10px] top-[11.5px] whitespace-nowrap">
        <p className="leading-[15px]">May 28</p>
      </div>
    </div>
  );
}

function Container27() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[12px] w-full">
        <p className="leading-[16px]">Invoice #8842 - Please find the attached invoice for the last development sprint.</p>
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative" data-name="Container">
      <Container25 />
      <Container27 />
    </div>
  );
}

function EmailItem3() {
  return (
    <div className="relative rounded-[24px] shrink-0 w-full" data-name="Email Item 4">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center p-[16px] relative size-full">
          <Margin3 />
          <Container24 />
        </div>
      </div>
    </div>
  );
}

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

const avatarThemes = [
  "bg-[#dbeafe] text-[#2563eb]",
  "bg-[#f3e8ff] text-[#9333ea]",
  "bg-[#fee2e2] text-[#dc2626]",
  "bg-[#f3f4f6] text-[#4b5563]",
  "bg-[#dcfce7] text-[#16a34a]",
  "bg-[#ffedd5] text-[#ea580c]",
];

function formatHeaderDate(date) {
  return date
    .toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}

function getStoredUserEmail() {
  if (typeof window === "undefined") return "";

  try {
    const storedUser = window.localStorage.getItem("user");
    if (!storedUser) return "";

    return JSON.parse(storedUser)?.email || "";
  } catch {
    return "";
  }
}

function getStoredUserDisplayName() {
  if (typeof window === "undefined") return "User";

  try {
    const storedUser = window.localStorage.getItem("user");
    if (!storedUser) return "User";

    const user = JSON.parse(storedUser);
    return user?.name || user?.email?.split("@")[0] || "User";
  } catch {
    return "User";
  }
}

function getInitials(name, email) {
  const displayName = (name || email?.split("@")[0] || "?").trim();
  const parts = displayName
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatCalendarMonth(date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCalendarCells(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - mondayOffset);

  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    return {
      date,
      dateKey: toDateKey(date),
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      isToday: toDateKey(date) === toDateKey(new Date()),
    };
  });
}

function formatEventTime(event) {
  if (!event?.start) return "";
  const start = new Date(event.start);
  if (Number.isNaN(start.getTime())) return "";

  return start.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getEventStartDate(event) {
  if (!event?.start) return null;

  const start = new Date(event.start);
  return Number.isNaN(start.getTime()) ? null : start;
}

function formatEmailDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  const options =
    date.getFullYear() === now.getFullYear()
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" };

  return date.toLocaleDateString([], options);
}

function InboxStateMessage({ title, detail }) {
  return (
    <div className="content-stretch flex flex-col items-center justify-center min-h-[220px] px-[24px] relative w-full">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-black text-center">
        <p className="leading-[20px]">{title}</p>
      </div>
      {detail ? (
        <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] mt-[6px] not-italic relative shrink-0 text-[#9ca3af] text-[12px] text-center">
          <p className="leading-[16px]">{detail}</p>
        </div>
      ) : null}
    </div>
  );
}

function DynamicEmailItem({ email, index }) {
  const theme = avatarThemes[index % avatarThemes.length];
  const initials = getInitials(email.senderName || email.from, email.senderEmail);
  const sender = email.senderName || email.senderEmail || email.from || "Unknown Sender";
  const subject = email.subject || "(No Subject)";
  const preview = email.preview ? ` - ${email.preview}` : "";

  return (
    <div className="relative rounded-[24px] shrink-0 transition-colors w-full hover:bg-[#f9fafb]" data-name="Email Item">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center p-[16px] relative size-full">
          <div className="content-stretch flex flex-col h-[40px] items-start pr-[16px] relative shrink-0 w-[56px]" data-name="Margin">
            <div className={`${theme} content-stretch flex items-center justify-center pb-[12.5px] pt-[11.5px] relative rounded-[9999px] shrink-0 size-[40px]`} data-name="Background">
              <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-center whitespace-nowrap">
                <p className="leading-[16px]">{initials}</p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative" data-name="Container">
            <div className="content-stretch flex items-center justify-between min-w-0 relative shrink-0 w-full" data-name="Container">
              <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] min-w-0 not-italic overflow-clip relative shrink text-[14px] text-black whitespace-nowrap">
                <p className="leading-[20px] truncate">{sender}</p>
              </div>
              <div className="[word-break:break-word] flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] ml-[16px] not-italic relative shrink-0 text-[#9ca3af] text-[10px] whitespace-nowrap">
                <p className="leading-[15px]">{formatEmailDate(email.receivedAt)}</p>
              </div>
            </div>
            <div className="content-stretch flex flex-col items-start min-w-0 overflow-clip relative shrink-0 w-full" data-name="Container">
              <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[12px] w-full">
                <p className="leading-[16px] truncate">{subject}{preview}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailList() {
  const userEmail = useMemo(getStoredUserEmail, []);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userEmail) {
      setEmails([]);
      setError("Sign in again so we know which inbox to load.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadInbox() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${BACKEND_URL}/emails/inbox?userEmail=${encodeURIComponent(userEmail)}&limit=25`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Inbox request failed with ${response.status}`);
        }

        const data = await response.json();
        setEmails(Array.isArray(data.emails) ? data.emails : []);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          console.error("[inbox] load error:", requestError);
          setError("Unable to load emails right now.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadInbox();

    return () => controller.abort();
  }, [userEmail]);

  let content = null;

  if (loading) {
    content = <InboxStateMessage detail="Pulling your latest stored inbox messages." title="Loading inbox..." />;
  } else if (error) {
    content = <InboxStateMessage detail={error} title="Inbox unavailable" />;
  } else if (!emails.length) {
    content = <InboxStateMessage detail="New Gmail webhook messages will appear here once they are saved." title="No emails found" />;
  } else {
    content = emails.map((email, index) => (
      <DynamicEmailItem email={email} index={index} key={email.messageId || email.id || index} />
    ));
  }

  return (
    <div className="flex-[1_0_0] min-h-px relative w-full" data-name="Email List">
      <div className="overflow-auto rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[4px] items-start pr-[8px] relative size-full">
          {content}
        </div>
      </div>
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px relative w-full" data-name="Container">
      <InboxHeaderMargin />
      <TabsMargin />
      <EmailList />
    </div>
  );
}

function TimelineGanttSection() {
  return (
    <div className="bg-white col-[1/span_7] justify-self-stretch relative rounded-[40px] row-[1/span_4] self-stretch shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0" data-name="Timeline/Gantt Section">
      <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[32px] relative size-full">
          <Container10 />
        </div>
      </div>
    </div>
  );
}

function Container29() {
  const userName = useMemo(getStoredUserDisplayName, []);

  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[16px] tracking-[1.2px] uppercase whitespace-nowrap">
        <p className="leading-[22px]">{userName}</p>
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div className="absolute content-stretch flex items-center left-[24px] right-[24px] top-[24px]" data-name="Container">
      <Container29 />
    </div>
  );
}

function Ab6AXuDvbHxrbuVhg1CxgVRnp3GbZa4Old7KtXqrMAhKYb7FCCtfyTb9Mmx6B289OHbPoeKin4Fz3F4BSniJvKooKl4OpOjrdoydQj15Jf1UjmainIiccvmtNoD8VwOgXcTm6L8TkRw3IaiG6GfqPmsIimxmMOck56Plr4ReE6Col2PMe1AGnWl3TyZlbJmceSWtJnBozL4JfLvAeRuOfuQ4FMy7O4SbG5ShWyGkBfONvB131Mkf() {
  return (
    <div className="pointer-events-none relative rounded-[9999px] shrink-0 size-[32px]" data-name="AB6AXuDvbHxrbuVhg1CxgVRnp3gbZA4OLD7KtXqrMAhKYb7F-CCtfyTb9MMX6b289oHBPoeKin4Fz3F4bSniJVKooKl4opOJRDOYDQj15Jf1ujmainIICCVMTNoD_8VWOgXCTm6l8TKRw3iaiG6gfqPMSIimxmMOck56PLR4reE6COL2pMe1AGnWL3TYZlb_JmceS-WTJnBoz-L4Jf_lvAeRuOfuQ4fMY7O4SbG5SHWyGKBfONvB131MKF91">
      <div className="absolute inset-0 overflow-hidden rounded-[9999px]">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgAb6AXuDvbHxrbuVhg1CxgVRnp3GbZa4Old7KtXqrMAhKYb7FCCtfyTb9Mmx6B289OHbPoeKin4Fz3F4BSniJvKooKl4OpOjrdoydQj15Jf1UjmainIiccvmtNoD8VwOgXcTm6L8TkRw3IaiG6GfqPmsIimxmMOck56Plr4ReE6Col2PMe1AGnWl3TyZlbJmceSWtJnBozL4JfLvAeRuOfuQ4FMy7O4SbG5ShWyGkBfONvB131Mkf91} />
      </div>
      <div aria-hidden className="absolute border border-[#374151] border-solid inset-0 rounded-[9999px]" />
    </div>
  );
}

function Container31() {
  const userName = useMemo(getStoredUserDisplayName, []);

  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-white whitespace-nowrap">
        <p className="leading-[16px]">{userName}</p>
      </div>
    </div>
  );
}

function Container30() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Ab6AXuDvbHxrbuVhg1CxgVRnp3GbZa4Old7KtXqrMAhKYb7FCCtfyTb9Mmx6B289OHbPoeKin4Fz3F4BSniJvKooKl4OpOjrdoydQj15Jf1UjmainIiccvmtNoD8VwOgXcTm6L8TkRw3IaiG6GfqPmsIimxmMOck56Plr4ReE6Col2PMe1AGnWl3TyZlbJmceSWtJnBozL4JfLvAeRuOfuQ4FMy7O4SbG5ShWyGkBfONvB131Mkf />
        <Container31 />
      </div>
    </div>
  );
}

function Svg13() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="SVG">
          <path d={svgPaths.p35302b00} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button5() {
  return (
    <div className="bg-[#1f2937] relative rounded-[9999px] shrink-0" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start p-[8px] relative size-full">
        <Svg13 />
      </div>
    </div>
  );
}

function HorizontalBorder() {
  return (
    <div className="content-stretch flex items-center justify-between pt-[17px] relative shrink-0 w-full" data-name="HorizontalBorder">
      <div aria-hidden className="absolute border-[#1f2937] border-solid border-t inset-0 pointer-events-none" />
      <Container30 />
      <Button5 />
    </div>
  );
}

function Margin4() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[24px] pt-[16px] right-[24px] top-[601.66px]" data-name="Margin">
      <HorizontalBorder />
    </div>
  );
}

function BackgroundShadow2() {
  return (
    <div className="content-stretch drop-shadow-[0px_0px_25px_rgba(255,255,255,0.2)] flex items-center justify-center relative rounded-[9999px] shrink-0 size-[160px]" style={{ backgroundImage: "linear-gradient(135deg, rgb(96, 165, 250) 0%, rgb(243, 244, 246) 50%, rgb(107, 114, 128) 100%)" }} data-name="Background+Shadow">
      <div className="bg-[rgba(255,255,255,0.4)] blur-[6px] relative rounded-[9999px] shrink-0 size-[96px]" data-name="Placeholder for the central liquid shape" />
    </div>
  );
}

function FloatingDetailText() {
  const userName = useMemo(getStoredUserDisplayName, []);

  return (
    <div className="absolute bottom-[16px] content-stretch flex flex-col items-start left-0" data-name="Floating detail text">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[14px] whitespace-nowrap">
        <p className="leading-[20px] mb-0 whitespace-pre">{`Hello, ${userName}`}</p>
        <p className="leading-[15px] whitespace-pre">I am here to assist you</p>
      </div>
    </div>
  );
}

function DynamicFloatingDetailText() {
  const userName = useMemo(getStoredUserDisplayName, []);

  return (
    <div className="absolute bottom-[16px] content-stretch flex flex-col items-start left-0" data-name="Floating detail text">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[14px] whitespace-nowrap">
        <p className="leading-[20px] mb-0 whitespace-pre">{`Hello, ${userName}`}</p>
        <p className="leading-[20px] whitespace-pre">I am here to assist you</p>
      </div>
    </div>
  );
}

function Component3DStyleVisualContainer() {
  return (
    <div className="absolute content-stretch flex inset-[40px_24px_89.01px_24px] items-center justify-center" data-name="3D Style Visual Container">
      <BackgroundShadow2 />
      <DynamicFloatingDetailText />
    </div>
  );
}

function SectionFilePreviewCard() {
  return (
    <div className="bg-[#111] col-[8/span_5] justify-self-stretch relative rounded-[40px] row-[1/span_4] self-stretch shrink-0" data-name="Section - File Preview Card">
      <div className="absolute bg-[rgba(255,255,255,0)] inset-[0_0_0.01px_0] rounded-[40px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]" data-name="Section - File Preview Card:shadow" />
      <Container28 />
      <Margin4 />
      <Component3DStyleVisualContainer />
    </div>
  );
}

function Svg14() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 20 20" width="20">
        <g id="SVG">
          <path d={svgPaths.p17eb400} id="Vector" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Background5({ onClick }) {
  return (
    <button
      aria-label="Add category"
      className="bg-[#f3f4f6] content-stretch flex items-center justify-center relative rounded-[12px] shrink-0 size-[40px] transition hover:bg-[#e5e7eb]"
      data-name="Background"
      onClick={onClick}
      type="button"
    >
      <Svg14 />
    </button>
  );
}

function Container34() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-black whitespace-nowrap">
        <p className="leading-[20px]">Categories</p>
      </div>
    </div>
  );
}

function Container33({ onAddClick }) {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Container">
      <Background5 onClick={onAddClick} />
      <Container34 />
    </div>
  );
}

function Svg15() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 20 20" width="20">
        <g id="SVG">
          <path d={svgPaths.p2016ab00} id="Vector" stroke="var(--stroke-0, #D1D5DB)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Container32({ onAddClick }) {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Container33 onAddClick={onAddClick} />
      <Svg15 />
    </div>
  );
}

function Margin5({ onAddClick }) {
  return (
    <div className="content-stretch flex flex-col items-start pb-[16px] relative shrink-0 w-full" data-name="Margin">
      <Container32 onAddClick={onAddClick} />
    </div>
  );
}

function Background6() {
  return (
    <div className="bg-[#fee2e2] content-stretch flex items-center justify-center relative rounded-[4px] shrink-0 size-[24px]" data-name="Background">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#dc2626] text-[8px] text-center whitespace-nowrap">
        <p className="leading-[12px]">PDF</p>
      </div>
    </div>
  );
}

function Container37() {
  return (
    <div className="content-stretch flex flex-col items-start max-w-[120px] overflow-clip pr-[4.5px] relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic overflow-hidden relative shrink-0 text-[11px] text-black text-ellipsis whitespace-nowrap">
        <p className="leading-[16.5px]">Licence on Figma templates.pdf</p>
      </div>
    </div>
  );
}

function Container36() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Background6 />
        <Container37 />
      </div>
    </div>
  );
}

function Svg16() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="12" preserveAspectRatio="none" viewBox="0 0 12 12" width="12">
        <g id="SVG">
          <path d={svgPaths.p22049200} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

function BackgroundBorder() {
  return (
    <div className="bg-[#f9fafb] relative rounded-[9999px] shrink-0 w-full" data-name="Background+Border">
      <div aria-hidden className="absolute border border-[#f3f4f6] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[17px] py-[9px] relative size-full">
          <Container36 />
          <Svg16 />
        </div>
      </div>
    </div>
  );
}

function Background7() {
  return (
    <div className="bg-[#f3e8ff] content-stretch flex items-center justify-center relative rounded-[4px] shrink-0 size-[24px]" data-name="Background">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#9333ea] text-[8px] text-center whitespace-nowrap">
        <p className="leading-[12px]">FIG</p>
      </div>
    </div>
  );
}

function Container39() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[11px] text-black whitespace-nowrap">
        <p className="leading-[16.5px]">Design_LB-KI.fig</p>
      </div>
    </div>
  );
}

function Container38() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Background7 />
        <Container39 />
      </div>
    </div>
  );
}

function Svg17() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="12" preserveAspectRatio="none" viewBox="0 0 12 12" width="12">
        <g id="SVG">
          <path d={svgPaths.p22049200} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

function BackgroundBorder1() {
  return (
    <div className="bg-[#f9fafb] relative rounded-[9999px] shrink-0 w-full" data-name="Background+Border">
      <div aria-hidden className="absolute border border-[#f3f4f6] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[17px] py-[9px] relative size-full">
          <Container38 />
          <Svg17 />
        </div>
      </div>
    </div>
  );
}

function Background8() {
  return (
    <div className="bg-[#dbeafe] content-stretch flex items-center justify-center relative rounded-[4px] shrink-0 size-[24px]" data-name="Background">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#2563eb] text-[8px] text-center whitespace-nowrap">
        <p className="leading-[12px]">DOC</p>
      </div>
    </div>
  );
}

function Container41() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[11px] text-black whitespace-nowrap">
        <p className="leading-[16.5px]">Design_redesign.word</p>
      </div>
    </div>
  );
}

function Container40() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Background8 />
        <Container41 />
      </div>
    </div>
  );
}

function Svg18() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="12" preserveAspectRatio="none" viewBox="0 0 12 12" width="12">
        <g id="SVG">
          <path d={svgPaths.p22049200} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

function BackgroundBorder2() {
  return (
    <div className="bg-[#f9fafb] relative rounded-[9999px] shrink-0 w-full" data-name="Background+Border">
      <div aria-hidden className="absolute border border-[#f3f4f6] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[17px] py-[9px] relative size-full">
          <Container40 />
          <Svg18 />
        </div>
      </div>
    </div>
  );
}

const categoryThemes = [
  "bg-[#fee2e2] text-[#dc2626]",
  "bg-[#f3e8ff] text-[#9333ea]",
  "bg-[#dbeafe] text-[#2563eb]",
  "bg-[#dcfce7] text-[#16a34a]",
  "bg-[#ffedd5] text-[#ea580c]",
];

function getCategoryTag(name = "") {
  const tag = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return tag ? tag.slice(0, 3) : "CAT";
}

function DynamicCategoryItem({ category, index }) {
  const theme = categoryThemes[index % categoryThemes.length];

  return (
    <div className="bg-[#f9fafb] relative rounded-[9999px] shrink-0 w-full" data-name="Background+Border">
      <div aria-hidden className="absolute border border-[#f3f4f6] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[17px] py-[9px] relative size-full">
          <div className="relative shrink min-w-0" data-name="Container">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
              <div className={`${theme} content-stretch flex items-center justify-center relative rounded-[4px] shrink-0 size-[24px]`} data-name="Background">
                <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[8px] text-center whitespace-nowrap">
                  <p className="leading-[12px]">{getCategoryTag(category.name)}</p>
                </div>
              </div>
              <div className="content-stretch flex flex-col items-start min-w-0 overflow-clip pr-[4.5px] relative shrink" data-name="Container">
                <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic overflow-hidden relative shrink-0 text-[11px] text-black text-ellipsis whitespace-nowrap">
                  <p className="leading-[16.5px] truncate">{category.name}</p>
                </div>
              </div>
            </div>
          </div>
          <Svg16 />
        </div>
      </div>
    </div>
  );
}

function CategoryInputItem({ value, onChange, onSubmit, onCancel, creating }) {
  return (
    <form className="bg-[#f9fafb] relative rounded-[9999px] shrink-0 w-full" data-name="Category Input" onSubmit={onSubmit}>
      <div aria-hidden className="absolute border border-[#f3f4f6] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <div className="content-stretch flex items-center gap-[8px] px-[17px] py-[9px] relative size-full">
        <input
          autoFocus
          className="bg-transparent flex-1 font-['Inter:Medium',sans-serif] min-w-0 outline-none text-[11px] text-black"
          maxLength={48}
          onChange={(event) => onChange(event.target.value)}
          placeholder="New category name"
          value={value}
        />
        <button className="font-['Inter:Bold',sans-serif] text-[10px] text-black disabled:text-[#9ca3af]" disabled={creating} type="submit">
          {creating ? "Saving" : "Save"}
        </button>
        <button className="font-['Inter:Bold',sans-serif] text-[#9ca3af] text-[12px]" disabled={creating} onClick={onCancel} type="button">
          ×
        </button>
      </div>
    </form>
  );
}

function CategoryStateMessage({ children }) {
  return (
    <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic px-[4px] relative shrink-0 text-[#9ca3af] text-[11px] w-full">
      <p className="leading-[16.5px]">{children}</p>
    </div>
  );
}

function Container35({
  categories,
  error,
  isAdding,
  loading,
  newCategoryName,
  onCancel,
  onNewCategoryNameChange,
  onSubmit,
  creating,
}) {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative w-full" data-name="Container">
      {isAdding ? (
        <CategoryInputItem
          creating={creating}
          onCancel={onCancel}
          onChange={onNewCategoryNameChange}
          onSubmit={onSubmit}
          value={newCategoryName}
        />
      ) : null}
      {loading ? <CategoryStateMessage>Loading categories...</CategoryStateMessage> : null}
      {!loading && error ? <CategoryStateMessage>{error}</CategoryStateMessage> : null}
      {!loading && !error && !categories.length && !isAdding ? (
        <CategoryStateMessage>No categories yet. Click + to add one.</CategoryStateMessage>
      ) : null}
      {!loading
        ? categories.map((category, index) => (
            <DynamicCategoryItem category={category} index={index} key={category.id || category.name} />
          ))
        : null}
    </div>
  );
}

function AllFilesSectionBottomLeft() {
  const userEmail = useMemo(getStoredUserEmail, []);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!userEmail) {
      setCategories([]);
      setError("Sign in again to load categories.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadCategories() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${BACKEND_URL}/categories?userEmail=${encodeURIComponent(userEmail)}`, {
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Categories request failed with ${response.status}`);
        }

        setCategories(Array.isArray(data.categories) ? data.categories : []);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          console.error("[categories] load error:", requestError);
          setError("Unable to load categories.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCategories();

    return () => controller.abort();
  }, [userEmail]);

  const handleAddClick = () => {
    setIsAdding(true);
    setError("");
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewCategoryName("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = newCategoryName.trim();
    if (!name) {
      setError("Enter a category name.");
      return;
    }

    if (!userEmail) {
      setError("Sign in again to create categories.");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const response = await fetch(`${BACKEND_URL}/categories`, {
        body: JSON.stringify({ name, userEmail }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Category create failed with ${response.status}`);
      }

      setCategories((currentCategories) => [
        data.category,
        ...currentCategories.filter((category) => category.id !== data.category?.id),
      ]);
      setNewCategoryName("");
      setIsAdding(false);
    } catch (requestError) {
      console.error("[categories] create error:", requestError);
      setError(requestError.message || "Unable to create category.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-white col-[1/span_3] justify-self-stretch relative rounded-[40px] row-[5/span_2] self-stretch shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0" data-name="All Files Section (Bottom Left)">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start p-[24px] relative size-full">
          <Margin5 onAddClick={handleAddClick} />
          <Container35
            categories={categories}
            creating={creating}
            error={error}
            isAdding={isAdding}
            loading={loading}
            newCategoryName={newCategoryName}
            onCancel={handleCancel}
            onNewCategoryNameChange={setNewCategoryName}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}

function DynamicCalendarSection() {
  const userEmail = useMemo(getStoredUserEmail, []);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const monthStart = useMemo(
    () => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
    [currentMonth]
  );
  const monthEnd = useMemo(
    () => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    [currentMonth]
  );
  const cells = useMemo(() => getCalendarCells(currentMonth), [currentMonth]);
  const eventsByDate = useMemo(() => {
    return events.reduce((grouped, event) => {
      if (!event.start) return grouped;

      const eventDate = new Date(event.start);
      if (Number.isNaN(eventDate.getTime())) return grouped;

      const key = event.start.includes("T") ? toDateKey(eventDate) : event.start.slice(0, 10);
      grouped[key] = [...(grouped[key] || []), event];
      return grouped;
    }, {});
  }, [events]);
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events
      .filter((event) => {
        const start = getEventStartDate(event);
        return start && start >= today;
      })
      .sort((first, second) => getEventStartDate(first) - getEventStartDate(second));
  }, [events]);
  const nextEvent = upcomingEvents[0];

  useEffect(() => {
    if (!userEmail) {
      setEvents([]);
      setError("Sign in again to sync calendar.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadEvents() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          email: userEmail,
          timeMin: monthStart.toISOString(),
          timeMax: monthEnd.toISOString(),
        });
        const response = await fetch(`${BACKEND_URL}/calendar/events?${params}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Calendar request failed with ${response.status}`);
        }

        setEvents(Array.isArray(data.events) ? data.events : []);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          console.error("[calendar] load error:", requestError);
          setError("Calendar sync unavailable.");
          setEvents([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadEvents();

    return () => controller.abort();
  }, [monthEnd, monthStart, userEmail]);

  const moveMonth = (amount) => {
    setCurrentMonth((date) => new Date(date.getFullYear(), date.getMonth() + amount, 1));
  };
  const syncStatus = loading ? "syncing" : error ? "error" : "synced";

  return (
    <div className="backdrop-blur-[5px] bg-[rgba(255,255,255,0.7)] col-[4/span_9] justify-self-stretch relative rounded-[40px] row-[5/span_2] self-stretch shrink-0" data-name="Section - Team & Development Progress (Bottom Right)">
      <div aria-hidden className="absolute border border-[rgba(255,255,255,0.3)] border-solid inset-0 pointer-events-none rounded-[40px]" />
      <div className="content-stretch flex flex-col gap-[24px] items-start p-[33px] relative size-full">
        <div className="relative shrink-0 w-full" data-name="Container">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative size-full">
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
              <Heading2 />
              <DynamicSyncBadge status={syncStatus} eventCount={events.length} />
            </div>
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
              <button className="bg-[rgba(0,0,0,0.05)] px-[10px] py-[8px] relative rounded-[12px] text-[14px]" onClick={() => moveMonth(-1)} type="button">
                ‹
              </button>
              <div className="bg-[rgba(0,0,0,0.05)] content-stretch flex items-center px-[12px] py-[8px] relative rounded-[12px] shrink-0">
                <div className="[word-break:break-word] flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black whitespace-nowrap">
                  <p className="leading-[16px]">{formatCalendarMonth(currentMonth)}</p>
                </div>
              </div>
              <button className="bg-[rgba(0,0,0,0.05)] px-[10px] py-[8px] relative rounded-[12px] text-[14px]" onClick={() => moveMonth(1)} type="button">
                ›
              </button>
            </div>
          </div>
        </div>
        <div className="h-[220px] relative shrink-0 w-full" data-name="Container">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[32px] items-start relative size-full">
            <div className="flex-[1_0_0] gap-x-[8px] gap-y-[8px] grid grid-cols-[repeat(7,minmax(0,1fr))] grid-rows-[32px_repeat(5,minmax(0,1fr))] h-full min-w-px relative" data-name="Calendar Grid">
              {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
                <div className="content-stretch flex flex-col items-center justify-center relative shrink-0" key={day}>
                  <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[10px] text-center uppercase whitespace-nowrap">
                    <p className="leading-[15px]">{day}</p>
                  </div>
                </div>
              ))}
              {cells.map((cell) => {
                const dayEvents = eventsByDate[cell.dateKey] || [];
                const hasEvents = dayEvents.length > 0;
                const active = cell.isToday || hasEvents;

                return (
                  <div
                    className={`${active ? "bg-black text-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]" : "text-black"} content-stretch flex h-[34px] items-center justify-center justify-self-stretch relative rounded-[12px] shrink-0`}
                    key={cell.dateKey}
                    title={dayEvents.map((event) => event.title).join(", ")}
                  >
                    <div className={`[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-center whitespace-nowrap ${cell.inMonth ? "" : "opacity-25"}`}>
                      <p className="leading-[16px]">{cell.day}</p>
                    </div>
                    {hasEvents ? <div className="absolute bg-[#3b82f6] bottom-[4px] rounded-[9999px] size-[5px]" data-name="Background" /> : null}
                  </div>
                );
              })}
            </div>
            <div className="bg-black h-full relative rounded-[32px] shrink-0 w-[288px]" data-name="Next Event Banner">
              <div className="overflow-clip rounded-[inherit] size-full">
                <div className="content-stretch flex flex-col items-start justify-between p-[24px] relative size-full">
                  <div className="content-stretch flex flex-col gap-[4px] items-start pt-[6.5px] relative shrink-0 w-full">
                    <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[10px] tracking-[1px] uppercase whitespace-nowrap">
                      <p className="leading-[15px]">NEXT EVENT</p>
                    </div>
                    <div className="content-stretch flex flex-col items-start pt-[2.5px] relative shrink-0 w-full">
                      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white w-full">
                        <p className="leading-[28px]">{loading ? "Syncing..." : nextEvent?.title || "No events"}</p>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[12px] w-full">
                        <p className="leading-[16px]">{error || (nextEvent ? formatEventTime(nextEvent) || "All day" : "Google Calendar is clear")}</p>
                      </div>
                    </div>
                  </div>
                  {nextEvent?.htmlLink ? (
                    <a className="bg-white content-stretch flex flex-col items-center justify-center py-[12px] relative rounded-[12px] shrink-0 w-full" href={nextEvent.htmlLink} rel="noreferrer" target="_blank">
                      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center whitespace-nowrap">
                        <p className="leading-[16px]">Open Event</p>
                      </div>
                    </a>
                  ) : null}
                  <Container71 />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Heading2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Heading 2">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[24px] text-black whitespace-nowrap">
        <p className="leading-[32px]">Calendar</p>
      </div>
    </div>
  );
}

function DynamicSyncBadge({ eventCount, status }) {
  const badge = {
    error: {
      bg: "bg-[rgba(239,68,68,0.1)]",
      dot: "bg-[#ef4444]",
      text: "SYNC ERROR",
      textColor: "text-[#dc2626]",
    },
    synced: {
      bg: "bg-[rgba(34,197,94,0.1)]",
      dot: "bg-[#22c55e]",
      text: eventCount > 0 ? `${eventCount} EVENT${eventCount === 1 ? "" : "S"} SYNCED` : "LIVE SYNC",
      textColor: "text-[#16a34a]",
    },
    syncing: {
      bg: "bg-[rgba(59,130,246,0.1)]",
      dot: "bg-[#3b82f6]",
      text: "SYNCING",
      textColor: "text-[#2563eb]",
    },
  }[status] || {
    bg: "bg-[rgba(107,114,128,0.1)]",
    dot: "bg-[#9ca3af]",
    text: "OFFLINE",
    textColor: "text-[#6b7280]",
  };

  return (
    <div className={`${badge.bg} content-stretch flex gap-[8px] items-center px-[12px] py-[4px] relative rounded-[9999px] shrink-0`} data-name="Overlay">
      <div className={`${badge.dot} relative rounded-[9999px] shrink-0 size-[8px]`} data-name="Background" />
      <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
        <div className={`[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 ${badge.textColor} text-[10px] tracking-[0.5px] uppercase whitespace-nowrap`}>
          <p className="leading-[15px]">{badge.text}</p>
        </div>
      </div>
    </div>
  );
}

function Container44() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#16a34a] text-[10px] tracking-[0.5px] uppercase whitespace-nowrap">
        <p className="leading-[15px]">LIVE SYNC</p>
      </div>
    </div>
  );
}

function Overlay() {
  return (
    <div className="bg-[rgba(34,197,94,0.1)] content-stretch flex gap-[8px] items-center px-[12px] py-[4px] relative rounded-[9999px] shrink-0" data-name="Overlay">
      <div className="bg-[#22c55e] relative rounded-[9999px] shrink-0 size-[8px]" data-name="Background" />
      <Container44 />
    </div>
  );
}

function Container43() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-name="Container">
      <Heading2 />
      <Overlay />
    </div>
  );
}

function Container46() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black whitespace-nowrap">
        <p className="leading-[16px]">June 2023</p>
      </div>
    </div>
  );
}

function Svg19() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="SVG">
          <path d={svgPaths.pb7adf00} id="Vector" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Overlay1() {
  return (
    <div className="bg-[rgba(0,0,0,0.05)] content-stretch flex gap-[8px] items-center p-[8px] relative rounded-[12px] shrink-0" data-name="Overlay">
      <Container46 />
      <Svg19 />
    </div>
  );
}

function Svg20() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 20 20" width="20">
        <g id="SVG">
          <path d={svgPaths.p2852ea00} id="Vector" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Button6() {
  return (
    <div className="content-stretch flex flex-col items-start p-[8px] relative rounded-[9999px] shrink-0" data-name="Button">
      <Svg20 />
    </div>
  );
}

function Container45() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-name="Container">
      <Overlay1 />
      <Button6 />
    </div>
  );
}

function Container42() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative size-full">
        <Container43 />
        <Container45 />
      </div>
    </div>
  );
}

function Container48() {
  return (
    <div className="col-1 content-stretch flex flex-col items-center justify-self-stretch relative row-1 self-stretch shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[10px] text-center uppercase whitespace-nowrap">
        <p className="leading-[15px]">MON</p>
      </div>
    </div>
  );
}

function Container49() {
  return (
    <div className="col-2 content-stretch flex flex-col items-center justify-self-stretch relative row-1 self-stretch shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[10px] text-center uppercase whitespace-nowrap">
        <p className="leading-[15px]">TUE</p>
      </div>
    </div>
  );
}

function Container50() {
  return (
    <div className="col-3 content-stretch flex flex-col items-center justify-self-stretch relative row-1 self-stretch shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[10px] text-center uppercase whitespace-nowrap">
        <p className="leading-[15px]">WED</p>
      </div>
    </div>
  );
}

function Container51() {
  return (
    <div className="col-4 content-stretch flex flex-col items-center justify-self-stretch relative row-1 self-stretch shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[10px] text-center uppercase whitespace-nowrap">
        <p className="leading-[15px]">THU</p>
      </div>
    </div>
  );
}

function Container52() {
  return (
    <div className="col-5 content-stretch flex flex-col items-center justify-self-stretch relative row-1 self-stretch shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[10px] text-center uppercase whitespace-nowrap">
        <p className="leading-[15px]">FRI</p>
      </div>
    </div>
  );
}

function Container53() {
  return (
    <div className="col-6 content-stretch flex flex-col items-center justify-self-stretch relative row-1 self-stretch shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[10px] text-center uppercase whitespace-nowrap">
        <p className="leading-[15px]">SAT</p>
      </div>
    </div>
  );
}

function Container54() {
  return (
    <div className="col-7 content-stretch flex flex-col items-center justify-self-stretch relative row-1 self-stretch shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[10px] text-center uppercase whitespace-nowrap">
        <p className="leading-[15px]">SUN</p>
      </div>
    </div>
  );
}

function Row() {
  return (
    <div className="col-1 content-stretch flex h-[40px] items-center justify-center justify-self-stretch pb-[12.5px] pt-[11.5px] relative row-2 shrink-0" data-name="Row 1">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#d1d5db] text-[12px] text-center whitespace-nowrap">
        <p className="leading-[16px]">29</p>
      </div>
    </div>
  );
}

function Container55() {
  return (
    <div className="col-2 content-stretch flex h-[40px] items-center justify-center justify-self-stretch pb-[12.5px] pt-[11.5px] relative row-2 shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#d1d5db] text-[12px] text-center whitespace-nowrap">
        <p className="leading-[16px]">30</p>
      </div>
    </div>
  );
}

function Container56() {
  return (
    <div className="col-3 content-stretch flex h-[40px] items-center justify-center justify-self-stretch pb-[12.5px] pt-[11.5px] relative row-2 shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#d1d5db] text-[12px] text-center whitespace-nowrap">
        <p className="leading-[16px]">31</p>
      </div>
    </div>
  );
}

function Background9() {
  return (
    <div className="bg-black col-4 content-stretch flex h-[40px] items-center justify-center justify-self-stretch pb-[12.5px] pt-[11.5px] relative rounded-[12px] row-2 shrink-0" data-name="Background">
      <div className="absolute bg-[rgba(255,255,255,0)] h-[40px] left-0 right-[-0.01px] rounded-[12px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] top-0" data-name="Overlay+Shadow" />
      <div className="[word-break:break-word] flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-center text-white whitespace-nowrap">
        <p className="leading-[16px]">1</p>
      </div>
    </div>
  );
}

function Container57() {
  return (
    <div className="col-5 content-stretch flex h-[40px] items-center justify-center justify-self-stretch pb-[12.5px] pt-[11.5px] relative row-2 shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center whitespace-nowrap">
        <p className="leading-[16px]">2</p>
      </div>
    </div>
  );
}

function Container58() {
  return (
    <div className="col-6 content-stretch flex h-[40px] items-center justify-center justify-self-stretch pb-[12.5px] pt-[11.5px] relative row-2 shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center whitespace-nowrap">
        <p className="leading-[16px]">3</p>
      </div>
    </div>
  );
}

function Container59() {
  return (
    <div className="col-7 content-stretch flex h-[40px] items-center justify-center justify-self-stretch pb-[12.5px] pt-[11.5px] relative row-2 shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center whitespace-nowrap">
        <p className="leading-[16px]">4</p>
      </div>
    </div>
  );
}

function Container60() {
  return (
    <div className="col-2 content-stretch flex h-[40px] items-center justify-center justify-self-stretch pb-[12.5px] pt-[11.5px] relative row-3 shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center whitespace-nowrap">
        <p className="leading-[16px]">6</p>
      </div>
    </div>
  );
}

function Container61() {
  return (
    <div className="col-3 content-stretch flex h-[40px] items-center justify-center justify-self-stretch pb-[12.5px] pt-[11.5px] relative row-3 shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center whitespace-nowrap">
        <p className="leading-[16px]">7</p>
      </div>
    </div>
  );
}

function Container62() {
  return (
    <div className="col-5 content-stretch flex h-[40px] items-center justify-center justify-self-stretch pb-[12.5px] pt-[11.5px] relative row-3 shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center whitespace-nowrap">
        <p className="leading-[16px]">9</p>
      </div>
    </div>
  );
}

function Container63() {
  return (
    <div className="col-6 content-stretch flex h-[40px] items-center justify-center justify-self-stretch pb-[12.5px] pt-[11.5px] relative row-3 shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center whitespace-nowrap">
        <p className="leading-[16px]">10</p>
      </div>
    </div>
  );
}

function Container64() {
  return (
    <div className="col-7 content-stretch flex h-[40px] items-center justify-center justify-self-stretch pb-[12.5px] pt-[11.5px] relative row-3 shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center whitespace-nowrap">
        <p className="leading-[16px]">11</p>
      </div>
    </div>
  );
}

function Row1() {
  return (
    <div className="col-1 content-stretch flex h-[40px] items-center justify-center justify-self-stretch pb-[12.5px] pt-[11.5px] relative row-3 shrink-0" data-name="Row 2">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center whitespace-nowrap">
        <p className="leading-[16px]">5</p>
      </div>
      <div className="absolute bg-[#3b82f6] bottom-[4px] left-[28.28px] rounded-[9999px] size-[4px]" data-name="Background" />
    </div>
  );
}

function Container65() {
  return (
    <div className="col-4 content-stretch flex h-[40px] items-center justify-center justify-self-stretch pb-[12.5px] pt-[11.5px] relative row-3 shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center whitespace-nowrap">
        <p className="leading-[16px]">8</p>
      </div>
      <div className="absolute bg-[#a855f7] bottom-[4px] left-[28.28px] rounded-[9999px] size-[4px]" data-name="Background" />
    </div>
  );
}

function CalendarGrid() {
  return (
    <div className="flex-[1_0_0] gap-x-[8px] gap-y-[8px] grid grid-cols-[repeat(7,minmax(0,1fr))] grid-rows-[___51.33px_76.33px_76.34px] h-full min-w-px relative" data-name="Calendar Grid">
      <Container48 />
      <Container49 />
      <Container50 />
      <Container51 />
      <Container52 />
      <Container53 />
      <Container54 />
      <Row />
      <Container55 />
      <Container56 />
      <Background9 />
      <Container57 />
      <Container58 />
      <Container59 />
      <Container60 />
      <Container61 />
      <Container62 />
      <Container63 />
      <Container64 />
      <Row1 />
      <Container65 />
    </div>
  );
}

function Heading3() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[2.5px] relative shrink-0 w-full" data-name="Heading 4">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white w-full">
        <p className="leading-[28px]">Design Review</p>
      </div>
    </div>
  );
}

function Container67() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[12px] w-full">
        <p className="leading-[16px]">Today at 2:00 PM</p>
      </div>
    </div>
  );
}

function Container66() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start pt-[6.5px] relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[10px] tracking-[1px] uppercase whitespace-nowrap">
        <p className="leading-[15px]">NEXT EVENT</p>
      </div>
      <Heading3 />
      <Container67 />
    </div>
  );
}

function Ab6AXuDqO7V5AwAyx2ZssExUwt8II0VjALmOfiNk1Z6Fdyr7CcsD1Nfg4GqYYtwq4UnEqAwjoZwnzOUe3JpQrkN7Yz2Y3IejFueTwGbGpL3EVmidjGz7CkdSzQkUt8Zp3U6J9JeBq24T1DTdiC1HbRgnUyxoD54QqTuExkM48WBbAsTScJcEYqGAxDf2Qs6GJyNq6VocoYmJfXXrRxOw8U5Padx0LybFxXqhYuP8424QvwFfqDgr8J() {
  return (
    <div className="pointer-events-none relative rounded-[9999px] shrink-0 size-[24px]" data-name="AB6AXuDqO7v5AwAyx2zssExUwt8iI0vjALmOfiNK1z6fdyr7CcsD_1NFG4GqYYtwq4unEqAwjoZwnzOUe3--jpQRK_n7Yz2y3IejFUETwGbGpL3eVmidjGz7CkdSzQKUt-8ZP3U6J9JEBq24t1DTdiC1HbRgnUyxoD54QQTuExkM48wBBAsTScJcEYqGAxDf2Qs6gJyNq6vocoYmJfXXr-rxOW8U5PADX0LybFxXqhYuP8424qvwFfqDGR8J">
      <div className="absolute inset-0 overflow-hidden rounded-[9999px]">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgAb6AXuDqO7V5AwAyx2ZssExUwt8II0VjALmOfiNk1Z6Fdyr7CcsD1Nfg4GqYYtwq4UnEqAwjoZwnzOUe3JpQrkN7Yz2Y3IejFueTwGbGpL3EVmidjGz7CkdSzQkUt8Zp3U6J9JeBq24T1DTdiC1HbRgnUyxoD54QqTuExkM48WBbAsTScJcEYqGAxDf2Qs6GJyNq6VocoYmJfXXrRxOw8U5Padx0LybFxXqhYuP8424QvwFfqDgr8J} />
      </div>
      <div aria-hidden className="absolute border border-black border-solid inset-0 rounded-[9999px]" />
    </div>
  );
}

function Ab6AXuCnWWvxCwWotdJonDOry7LqGoBtWfGkrNdzLl6V3NXgiytJc1COUyS2NuRzLaXc8R9LJadjn7Kmaqx06R1PKeEt2EbnxAcCf6KQmGeXTiGp7FB4P6I1KcGnq9QcOfarE9PkCwzDHcpMtcBZf61BElK6IPq40PgQMc19RFlB8GUsUqbUnJix2ChmqRHwLq3XjaTlInDw4Hyln9W4LboWtVwKkXh9AaD4IQNoVeSfIfoJrSrFjSta() {
  return (
    <div className="absolute left-[-8px] pointer-events-none rounded-[9999px] size-[24px] top-0" data-name="AB6AXuCnWWvxCwWotdJonDOry7lqGoBTWfGkrNdzLL6v3NXgiytJC1cOUyS2nuRZLaXc8R9lJADJN7Kmaqx06R1PKeEt2EBNXAcCf6kQMGeX_TIGp7fB4p6i1KCGnq9qcOfarE9PKCwzDHcpMtcBZf61BElK6iPq40pgQMc19rFlB8GUsUqbUnJIX2_ChmqRHwLq3XjaTlINDw4Hyln9w4LBOWtVwKkXH9aa-D4i-qNoVeSfIFOJrSrFjSta">
      <div className="absolute inset-0 overflow-hidden rounded-[9999px]">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgAb6AXuCnWWvxCwWotdJonDOry7LqGoBtWfGkrNdzLl6V3NXgiytJc1COUyS2NuRzLaXc8R9LJadjn7Kmaqx06R1PKeEt2EbnxAcCf6KQmGeXTiGp7FB4P6I1KcGnq9QcOfarE9PkCwzDHcpMtcBZf61BElK6IPq40PgQMc19RFlB8GUsUqbUnJix2ChmqRHwLq3XjaTlInDw4Hyln9W4LboWtVwKkXh9AaD4IQNoVeSfIfoJrSrFjSta} />
      </div>
      <div aria-hidden className="absolute border border-black border-solid inset-0 rounded-[9999px]" />
    </div>
  );
}

function ImgMargin() {
  return (
    <div className="h-[24px] relative shrink-0 w-[16px]" data-name="Img:margin">
      <Ab6AXuCnWWvxCwWotdJonDOry7LqGoBtWfGkrNdzLl6V3NXgiytJc1COUyS2NuRzLaXc8R9LJadjn7Kmaqx06R1PKeEt2EbnxAcCf6KQmGeXTiGp7FB4P6I1KcGnq9QcOfarE9PkCwzDHcpMtcBZf61BElK6IPq40PgQMc19RFlB8GUsUqbUnJix2ChmqRHwLq3XjaTlInDw4Hyln9W4LboWtVwKkXh9AaD4IQNoVeSfIfoJrSrFjSta />
    </div>
  );
}

function Container69() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Container">
      <Ab6AXuDqO7V5AwAyx2ZssExUwt8II0VjALmOfiNk1Z6Fdyr7CcsD1Nfg4GqYYtwq4UnEqAwjoZwnzOUe3JpQrkN7Yz2Y3IejFueTwGbGpL3EVmidjGz7CkdSzQkUt8Zp3U6J9JeBq24T1DTdiC1HbRgnUyxoD54QqTuExkM48WBbAsTScJcEYqGAxDf2Qs6GJyNq6VocoYmJfXXrRxOw8U5Padx0LybFxXqhYuP8424QvwFfqDgr8J />
      <ImgMargin />
    </div>
  );
}

function Container70() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[10px] whitespace-nowrap">
        <p className="leading-[15px]">+3 others</p>
      </div>
    </div>
  );
}

function Container68() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Container">
      <Container69 />
      <Container70 />
    </div>
  );
}

function Margin6() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[16px] relative shrink-0 w-full" data-name="Margin">
      <Container68 />
    </div>
  );
}

function Button7() {
  return (
    <div className="bg-white content-stretch flex flex-col items-center justify-center py-[12px] relative rounded-[12px] shrink-0 w-full" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center whitespace-nowrap">
        <p className="leading-[16px]">Join Meeting</p>
      </div>
    </div>
  );
}

function ButtonMargin() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[16px] relative shrink-0 w-full" data-name="Button:margin">
      <Button7 />
    </div>
  );
}

function Svg21() {
  return (
    <div className="relative shrink-0 size-[96px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="96" preserveAspectRatio="none" viewBox="0 0 96 96" width="96">
        <g id="SVG">
          <path d={svgPaths.p229ae080} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container71() {
  return (
    <div className="absolute content-stretch flex flex-col items-start opacity-20 right-[-16px] top-[-16px]" data-name="Container">
      <Svg21 />
    </div>
  );
}

function NextEventBanner() {
  return (
    <div className="bg-black h-full relative rounded-[32px] shrink-0 w-[288px]" data-name="Next Event Banner">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start justify-between p-[24px] relative size-full">
          <Container66 />
          <Margin6 />
          <ButtonMargin />
          <Container71 />
        </div>
      </div>
    </div>
  );
}

function Container47() {
  return (
    <div className="h-[220px] relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[32px] items-start relative size-full">
        <CalendarGrid />
        <NextEventBanner />
      </div>
    </div>
  );
}

function SectionTeamDevelopmentProgressBottomRight() {
  return (
    <div className="backdrop-blur-[5px] bg-[rgba(255,255,255,0.7)] col-[4/span_9] justify-self-stretch relative rounded-[40px] row-[5/span_2] self-stretch shrink-0" data-name="Section - Team & Development Progress (Bottom Right)">
      <div aria-hidden className="absolute border border-[rgba(255,255,255,0.3)] border-solid inset-0 pointer-events-none rounded-[40px]" />
      <div className="content-stretch flex flex-col gap-[24px] items-start p-[33px] relative size-full">
        <Container42 />
        <Container47 />
      </div>
    </div>
  );
}

function BentoGridLayout() {
  return (
    <div className="absolute gap-x-[24px] gap-y-[24px] grid grid-cols-[repeat(12,minmax(0,1fr))] grid-rows-[repeat(6,minmax(0,1fr))] inset-[88px_0_-88px_0] pb-[16px]" data-name="Bento Grid Layout">
      <TimelineGanttSection />
      <SectionFilePreviewCard />
      <AllFilesSectionBottomLeft />
      <DynamicCalendarSection />
    </div>
  );
}

function MainDashboardContent() {
  return (
    <div className="flex-[1_0_0] h-[1064px] min-w-px relative" data-name="Main Dashboard Content">
      <HeaderSection />
      <BentoGridLayout />
    </div>
  );
}

function Svg22() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="24" preserveAspectRatio="none" viewBox="0 0 24 24" width="24">
        <g id="SVG">
          <path d={svgPaths.p1c4d6800} id="Vector" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Button8() {
  return (
    <div className="backdrop-blur-[4px] bg-[rgba(255,255,255,0.5)] content-stretch flex items-center justify-center p-px relative rounded-[24px] shrink-0 size-[48px]" data-name="Button">
      <div aria-hidden className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[24px]" />
      <div className="absolute bg-[rgba(255,255,255,0)] left-0 rounded-[24px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] size-[48px] top-0" data-name="Button:shadow" />
      <Svg22 />
    </div>
  );
}

function ExpandControlBottomRightFloating() {
  return (
    <div className="absolute bottom-[32px] content-stretch flex flex-col items-start right-[32px]" data-name="Expand Control (Bottom Right floating)">
      <Button8 />
    </div>
  );
}

export default function HtmlBody() {
  return (
    <div className="content-stretch flex gap-[16px] items-start p-[16px] relative size-full" style={{ backgroundImage: "linear-gradient(90deg, rgb(226, 228, 231) 0%, rgb(226, 228, 231) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }} data-name="Html → Body">
      <AsideLeftSidebar />
      <MainDashboardContent />
    </div>
  );
}
