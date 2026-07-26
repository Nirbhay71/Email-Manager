import svgPaths from "./svg-9eyoj0uxqg";
import imgUser from "./4a1497f7eb1ac52188d5053d788a4d72df0d0413.png";
import imgAiAssistant from "./09d34397fc5dfe77be0866af9c35f049cbca10fe.png";
import imgAb6AXuA4ShRLlY6HbhKaeLaQgbraIw42WVtB4S2F9VbMw5LxhJzbPYedSvdjLgE6BEExyCeP99IOool6NoCRqnsioeopLsbPm3P84QsJHqK1Gai8XfVIqA5Mol2QIbtKjDqpSaoLo3PltlMdrnOilEak0N5LRTlib9D2PmeV1LNvMbvYrX8IuJq1K6Gq3I9AbXmZIocanE2MhXzgGK2RGGqGmxXxic5BoSfAwOGmaHtj7UXitsLkWs from "./3d16bb95b2a6f2c06c620b3e84b11991da111c9a.png";
import React, { useState, useEffect } from "react";

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
    <div className="bg-black content-stretch flex items-center justify-center relative rounded-[9999px] shrink-0 size-[40px]" data-name="Logo">
      <Container1 />
    </div>
  );
}

function Svg() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="24" preserveAspectRatio="none" viewBox="0 0 24 24" width="24">
        <g id="SVG">
          <path d={svgPaths.p42a6600} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Link() {
  return (
    <button className="relative rounded-[12px] shrink-0 transition hover:bg-black/10 w-full" data-name="Link" onClick={() => goToDashboardRoute("/inbox")} type="button">
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

function Link1() {
  return (
    <button className="relative rounded-[12px] shrink-0 transition hover:bg-black/10 w-full" data-name="Link" onClick={() => goToDashboardRoute("/management")} type="button">
      <div className="content-stretch flex flex-col items-start p-[8px] relative size-full">
        <Svg1 />
      </div>
    </button>
  );
}

function Svg2() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="24" preserveAspectRatio="none" viewBox="0 0 24 24" width="24">
        <g id="SVG">
          <path d={svgPaths.p2373ef00} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Link2() {
  return (
    <button className="bg-black relative rounded-[12px] shrink-0 w-full" data-name="Link" onClick={() => goToDashboardRoute("/ai-chat")} type="button">
      <div className="content-stretch flex flex-col items-start p-[8px] relative size-full">
        <Svg2 />
      </div>
    </button>
  );
}

function NavIcons() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-[40px]" data-name="Nav Icons">
      <Link />
      <Link1 />
      <Link2 />
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

function AsideSidebarFromScreen() {
  return (
    <div className="bg-white drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] h-[calc(100vh-32px)] sticky top-[16px] rounded-[32px] shrink-0 w-[80px] z-20" data-name="Aside - Sidebar from SCREEN_15">
      <div className="flex flex-col items-center size-full">
        <div className="content-stretch flex flex-col items-center justify-between py-[32px] relative size-full">
          <Container />
          <UserProfileArea />
        </div>
      </div>
    </div>
  );
}

function Heading() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 1">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[36px] text-black tracking-[-0.9px] whitespace-nowrap">
        <p className="leading-[40px]">Email Manager</p>
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
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Container">
      <Svg3 />
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">JUNE 1, 2023</p>
      </div>
      <Svg4 />
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

function Svg5() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 20 20" width="20">
        <g id="SVG">
          <path d={svgPaths.p35ec9d00} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function VoiceCameraButton() {
  return (
    <div className="bg-black content-stretch flex flex-col items-start p-[12px] relative rounded-[9999px] shrink-0" data-name="Voice/Camera Button">
      <div className="absolute bg-[rgba(255,255,255,0)] inset-0 rounded-[9999px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]" data-name="Voice/Camera Button:shadow" />
      <Svg5 />
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

function Container7() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Container">
      <Svg6 />
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black whitespace-nowrap">
        <p className="leading-[16px]">13:20</p>
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

function Container8() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Container">
      <Svg7 />
      <div className="[word-break:break-word] flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black whitespace-nowrap">
        <p className="leading-[16px]">23° Sunny</p>
      </div>
    </div>
  );
}

function WeatherWidget() {
  return (
    <div className="bg-white content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex gap-[12px] items-center px-[16px] py-[8px] relative rounded-[9999px] shrink-0" data-name="Weather Widget">
      <Container7 />
      <Container8 />
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
      <VoiceCameraButton />
      <WeatherWidget />
      <SearchBar />
      <SecondaryIcons />
    </div>
  );
}

function HeaderFromScreen15StyledAsAiAssistant() {
  return (
    <div className="relative shrink-0 w-full" data-name="Header from SCREEN_15 styled as AI Assistant">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between pr-[16px] relative size-full">
          <Container4 />
          <Container6 />
        </div>
      </div>
    </div>
  );
}

function AiAssistant() {
  return (
    <div className="max-w-[48px] relative shrink-0 size-[32px]" data-name="AI Assistant">
      <div className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgAiAssistant} />
      </div>
    </div>
  );
}

function BackgroundBorder() {
  return (
    <div className="bg-[#f9fafb] content-stretch flex items-center justify-center p-px relative rounded-[24px] shrink-0 size-[48px]" data-name="Background+Border">
      <div aria-hidden className="absolute border border-[#f3f4f6] border-solid inset-0 pointer-events-none rounded-[24px]" />
      <AiAssistant />
    </div>
  );
}

function Heading1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 2">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-black whitespace-nowrap">
        <p className="leading-[28px]">Itatshu, Your AI assistant</p>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[12px] tracking-[0.6px] uppercase whitespace-nowrap">
        <p className="leading-[16px]">SYSTEMS LIVE</p>
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Container">
      <div className="bg-[#22c55e] relative rounded-[9999px] shrink-0 size-[8px]" data-name="Background" />
      <Container13 />
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[243.78px]" data-name="Container">
      <Heading1 />
      <Container12 />
    </div>
  );
}

function Container10() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] items-center relative size-full">
        <BackgroundBorder />
        <Container11 />
      </div>
    </div>
  );
}

function Svg11() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="24" preserveAspectRatio="none" viewBox="0 0 24 24" width="24">
        <g id="SVG">
          <path d={svgPaths.p2e0fe800} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="relative rounded-[9999px] shrink-0" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start p-[8px] relative size-full">
        <Svg11 />
      </div>
    </div>
  );
}

function ChatHeader() {
  return (
    <div className="relative shrink-0 w-full" data-name="Chat Header">
      <div aria-hidden className="absolute border-[#f3f4f6] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between pb-[25px] pt-[24px] px-[32px] relative size-full">
          <Container10 />
          <Button />
        </div>
      </div>
    </div>
  );
}

function Ai() {
  return (
    <div className="max-w-[32px] relative shrink-0 size-[20px]" data-name="AI">
      <div className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgAiAssistant} />
      </div>
    </div>
  );
}

function BackgroundBorder1() {
  return (
    <div className="bg-[#f3f4f6] content-stretch flex items-center justify-center p-px relative rounded-[8px] shrink-0 size-[32px]" data-name="Background+Border">
      <div aria-hidden className="absolute border border-[#e5e7eb] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <Ai />
    </div>
  );
}

function ParagraphBackgroundBorder() {
  return (
    <div className="bg-[#f9fafb] relative rounded-bl-[32px] rounded-br-[32px] rounded-tr-[32px] self-stretch shrink-0" data-name="Paragraph+Background+Border">
      <div aria-hidden className="absolute border border-[#f3f4f6] border-solid inset-0 pointer-events-none rounded-bl-[32px] rounded-br-[32px] rounded-tr-[32px]" />
      <div className="[word-break:break-word] content-stretch flex flex-col gap-[16.5px] items-start leading-[0] not-italic pb-[25px] pl-[25px] pr-[50.49px] pt-[23.75px] relative size-full whitespace-nowrap">
        <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#374151] text-[14px]">
          <p className="leading-[22.75px] mb-0">{`Hello Alex. I've analyzed the recent performance reports for Project Phoenix.`}</p>
          <p className="leading-[22.75px] mb-0">Would you like a summary of the quarterly milestones or a deep dive into the</p>
          <p className="leading-[22.75px]">resource allocation?</p>
        </div>
        <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center relative shrink-0 text-[#9ca3af] text-[10px] uppercase">
          <p className="leading-[15px]">10:24 AM</p>
        </div>
      </div>
    </div>
  );
}

function AiResponse() {
  return (
    <div className="absolute content-stretch flex gap-[16px] items-start left-[32px] max-w-[685.0999755859375px] right-[143.31px] top-[32px]" data-name="AI Response">
      <BackgroundBorder1 />
      <ParagraphBackgroundBorder />
    </div>
  );
}

function Container14() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[0.625px] relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#e5e7eb] text-[14px] whitespace-nowrap">
        <p className="leading-[22.75px] mb-0">{`Show me the resource allocation. Specifically, I'm concerned about the dev-ops`}</p>
        <p className="leading-[22.75px]">burn rate over the last 14 days.</p>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="content-stretch flex flex-col items-end relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[10px] text-right uppercase whitespace-nowrap">
        <p className="leading-[15px]">10:25 AM</p>
      </div>
    </div>
  );
}

function Background1() {
  return (
    <div className="bg-[#111] relative rounded-bl-[32px] rounded-br-[32px] rounded-tl-[32px] self-stretch shrink-0" data-name="Background">
      <div className="content-stretch flex flex-col gap-[16px] items-start pb-[24px] pt-[22.875px] px-[24px] relative size-full">
        <div className="absolute bg-[rgba(255,255,255,0)] inset-[0_0.8px_0_0] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]" data-name="Overlay+Shadow" />
        <Container14 />
        <Container15 />
      </div>
    </div>
  );
}

function Ab6AXuA4ShRLlY6HbhKaeLaQgbraIw42WVtB4S2F9VbMw5LxhJzbPYedSvdjLgE6BEExyCeP99IOool6NoCRqnsioeopLsbPm3P84QsJHqK1Gai8XfVIqA5Mol2QIbtKjDqpSaoLo3PltlMdrnOilEak0N5LRTlib9D2PmeV1LNvMbvYrX8IuJq1K6Gq3I9AbXmZIocanE2MhXzgGK2RGGqGmxXxic5BoSfAwOGmaHtj7UXitsLkWs() {
  return (
    <div className="max-w-[630.6900024414062px] pointer-events-none relative rounded-[9999px] shrink-0 size-[32px]" data-name="AB6AXuA4ShRLlY6HbhKAE_LAQgbraIW42WVtB4S2F9vb_Mw5LxhJzbPYedSvdjLgE6bEExyCeP99iOOOL6noCRqnsioeopLSBPm3p84qsJHqK1Gai8xfVIqA5MOL2qIbtKjDQPSaoLo3pltlMDRNOilEak0N5lRTlib9d2pmeV1lNvMBVYrX8iuJq1k6gq3I_9abXmZIocanE2MHXzgG_-k2rGGqGMXXxic5boSFAw_OGmaHtj7UXitsLKWs">
      <div className="absolute inset-0 overflow-hidden rounded-[9999px]">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgAb6AXuA4ShRLlY6HbhKaeLaQgbraIw42WVtB4S2F9VbMw5LxhJzbPYedSvdjLgE6BEExyCeP99IOool6NoCRqnsioeopLsbPm3P84QsJHqK1Gai8XfVIqA5Mol2QIbtKjDqpSaoLo3PltlMdrnOilEak0N5LRTlib9D2PmeV1LNvMbvYrX8IuJq1K6Gq3I9AbXmZIocanE2MhXzgGK2RGGqGmxXxic5BoSfAwOGmaHtj7UXitsLkWs} />
      </div>
      <div aria-hidden className="absolute border-2 border-solid border-white inset-0 rounded-[9999px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function UserMessage() {
  return (
    <div className="absolute content-stretch flex gap-[16px] items-start left-[143.31px] max-w-[685.0999755859375px] right-[32px] top-[213.25px]" data-name="User Message">
      <Background1 />
      <Ab6AXuA4ShRLlY6HbhKaeLaQgbraIw42WVtB4S2F9VbMw5LxhJzbPYedSvdjLgE6BEExyCeP99IOool6NoCRqnsioeopLsbPm3P84QsJHqK1Gai8XfVIqA5Mol2QIbtKjDqpSaoLo3PltlMdrnOilEak0N5LRTlib9D2PmeV1LNvMbvYrX8IuJq1K6Gq3I9AbXmZIocanE2MhXzgGK2RGGqGmxXxic5BoSfAwOGmaHtj7UXitsLkWs />
    </div>
  );
}

function Ai1() {
  return (
    <div className="max-w-[32px] relative shrink-0 size-[20px]" data-name="AI">
      <div className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgAiAssistant} />
      </div>
    </div>
  );
}

function BackgroundBorder2() {
  return (
    <div className="bg-[#f3f4f6] content-stretch flex items-center justify-center p-px relative rounded-[8px] shrink-0 size-[32px]" data-name="Background+Border">
      <div aria-hidden className="absolute border border-[#e5e7eb] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <Ai1 />
    </div>
  );
}

function Container16() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#374151] text-[14px] w-full">
          <p className="leading-[20px] mb-0">Analyzing the logs... DevOps burn rate increased by 14.2% since Tuesday. This</p>
          <p className="leading-[20px]">correlates with the migration of the staging environment.</p>
        </div>
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[10px] uppercase w-full">
          <p className="leading-[15px]">COMPUTE COST</p>
        </div>
      </div>
    </div>
  );
}

function BackgroundBorderShadow() {
  return (
    <div className="bg-white drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex-[1_0_0] min-w-px relative rounded-[24px]" data-name="Background+Border+Shadow">
      <div aria-hidden className="absolute border border-[#f3f4f6] border-solid inset-0 pointer-events-none rounded-[24px]" />
      <div className="content-stretch flex flex-col gap-[4px] items-start p-[17px] relative size-full">
        <Container18 />
        <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-black whitespace-nowrap">
          <p className="leading-[28px]">$4,281</p>
        </div>
      </div>
    </div>
  );
}

function Container19() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[10px] uppercase w-full">
          <p className="leading-[15px]">IDLE ASSETS</p>
        </div>
      </div>
    </div>
  );
}

function BackgroundBorderShadow1() {
  return (
    <div className="bg-white drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex-[1_0_0] min-w-px relative rounded-[24px]" data-name="Background+Border+Shadow">
      <div aria-hidden className="absolute border border-[#f3f4f6] border-solid inset-0 pointer-events-none rounded-[24px]" />
      <div className="content-stretch flex flex-col gap-[4px] items-start p-[17px] relative size-full">
        <Container19 />
        <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-black whitespace-nowrap">
          <p className="leading-[28px]">18.5%</p>
        </div>
      </div>
    </div>
  );
}

function Container20() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[10px] uppercase w-full">
          <p className="leading-[15px]">SAVINGS</p>
        </div>
      </div>
    </div>
  );
}

function BackgroundBorderShadow2() {
  return (
    <div className="bg-white drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex-[1_0_0] min-w-px relative rounded-[24px]" data-name="Background+Border+Shadow">
      <div aria-hidden className="absolute border border-[#f3f4f6] border-solid inset-0 pointer-events-none rounded-[24px]" />
      <div className="content-stretch flex flex-col gap-[4px] items-start p-[17px] relative size-full">
        <Container20 />
        <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#ef4444] text-[20px] whitespace-nowrap">
          <p className="leading-[28px]">-$1.2k</p>
        </div>
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] items-start justify-center relative size-full">
        <BackgroundBorderShadow />
        <BackgroundBorderShadow1 />
        <BackgroundBorderShadow2 />
      </div>
    </div>
  );
}

function BackgroundBorder3() {
  return (
    <div className="bg-[#f9fafb] flex-[1_0_0] min-w-px relative rounded-bl-[32px] rounded-br-[32px] rounded-tr-[32px] self-stretch" data-name="Background+Border">
      <div aria-hidden className="absolute border border-[#f3f4f6] border-solid inset-0 pointer-events-none rounded-bl-[32px] rounded-br-[32px] rounded-tr-[32px]" />
      <div className="content-stretch flex flex-col gap-[24px] items-start p-[25px] relative size-full">
        <Container16 />
        <Container17 />
      </div>
    </div>
  );
}

function AiDataVis() {
  return (
    <div className="absolute content-stretch flex gap-[16px] items-start left-[32px] max-w-[725.4000244140625px] right-[106.2px] top-[369.75px]" data-name="AI Data Vis">
      <BackgroundBorder2 />
      <BackgroundBorder3 />
    </div>
  );
}

function ChatContent() {
  return (
    <div className="flex-[1_0_0] min-h-px relative w-full" data-name="Chat Content">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-auto relative rounded-[inherit] size-full">
        <AiResponse />
        <UserMessage />
        <AiDataVis />
      </div>
    </div>
  );
}

function Svg12() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="24" preserveAspectRatio="none" viewBox="0 0 24 24" width="24">
        <g id="SVG">
          <path d={svgPaths.p8ece100} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Button1() {
  return (
    <div className="relative shrink-0" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start p-[12px] relative size-full">
        <Svg12 />
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[14px] w-full">
        <p className="leading-[normal]">Ask about your projects...</p>
      </div>
    </div>
  );
}

function Input1() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="Input">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[10px] pt-[9px] px-[16px] relative size-full">
          <Container21 />
        </div>
      </div>
    </div>
  );
}

function Svg13() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 20 20" width="20">
        <g id="SVG">
          <path d={svgPaths.p25f63580} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Button2() {
  return (
    <div className="bg-black relative rounded-[9999px] shrink-0 size-[48px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <div className="-translate-y-1/2 absolute bg-[rgba(255,255,255,0)] left-0 rounded-[9999px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] size-[48px] top-1/2" data-name="Button:shadow" />
        <Svg13 />
      </div>
    </div>
  );
}

function BackgroundBorder4() {
  return (
    <div className="bg-[#f9fafb] relative rounded-[9999px] shrink-0 w-full" data-name="Background+Border">
      <div aria-hidden className="absolute border border-[#e5e7eb] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <div className="flex flex-row items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center p-[9px] relative size-full">
          <Button1 />
          <Input1 />
          <Button2 />
        </div>
      </div>
    </div>
  );
}

function InputArea() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Input Area">
      <div aria-hidden className="absolute border-[#f3f4f6] border-solid border-t inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[32px] pt-[33px] px-[32px] relative size-full">
        <BackgroundBorder4 />
      </div>
    </div>
  );
}

function SectionCenterChatWorkspace() {
  return (
    <div className="bg-white flex-[1_0_0] h-full min-w-px relative rounded-[40px]" data-name="Section - Center Chat Workspace">
      <div className="content-stretch flex flex-col items-start overflow-clip p-px relative rounded-[inherit] size-full">
        <ChatHeader />
        <ChatContent />
        <InputArea />
      </div>
      <div aria-hidden className="absolute border border-[rgba(255,255,255,0.5)] border-solid inset-0 pointer-events-none rounded-[40px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function Heading2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Heading 3">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-black whitespace-nowrap">
        <p className="leading-[28px]">History</p>
      </div>
    </div>
  );
}

function Svg14() {
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

function Container22() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Heading2 />
      <Svg14 />
    </div>
  );
}

function Margin() {
  return (
    <div className="relative shrink-0 w-full" data-name="Margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[24px] relative size-full">
        <Container22 />
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-white w-full">
        <p className="leading-[20px]">DevOps Burn Analysis</p>
      </div>
    </div>
  );
}

function Container26() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[10px] uppercase whitespace-nowrap">
        <p className="leading-[15px]">ACTIVE</p>
      </div>
    </div>
  );
}

function Container27() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[10px] whitespace-nowrap">
        <p className="leading-[15px]">10:24 AM</p>
      </div>
    </div>
  );
}

function Container25() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between relative size-full">
          <Container26 />
          <Container27 />
        </div>
      </div>
    </div>
  );
}

function Background2() {
  return (
    <div className="bg-black relative rounded-[32px] shrink-0 w-full" data-name="Background">
      <div className="content-stretch flex flex-col gap-[12px] items-start p-[20px] relative size-full">
        <div className="absolute bg-[rgba(255,255,255,0)] inset-0 rounded-[32px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]" data-name="Overlay+Shadow" />
        <Container24 />
        <Container25 />
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <div className="[word-break:break-word] flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#374151] text-[14px] w-full">
          <p className="leading-[20px]">Quarterly Resource Audit</p>
        </div>
      </div>
    </div>
  );
}

function Container30() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[10px] uppercase whitespace-nowrap">
        <p className="leading-[15px]">ARCHIVED</p>
      </div>
    </div>
  );
}

function Container31() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[10px] whitespace-nowrap">
        <p className="leading-[15px]">Yesterday</p>
      </div>
    </div>
  );
}

function Container29() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative size-full">
          <Container30 />
          <Container31 />
        </div>
      </div>
    </div>
  );
}

function OverlayBorder() {
  return (
    <div className="bg-[rgba(255,255,255,0.5)] relative rounded-[32px] shrink-0 w-full" data-name="Overlay+Border">
      <div aria-hidden className="absolute border border-[#f3f4f6] border-solid inset-0 pointer-events-none rounded-[32px]" />
      <div className="content-stretch flex flex-col gap-[12px] items-start p-[21px] relative size-full">
        <Container28 />
        <Container29 />
      </div>
    </div>
  );
}

function Container32() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <div className="[word-break:break-word] flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#374151] text-[14px] w-full">
          <p className="leading-[20px]">Security Token Review</p>
        </div>
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[10px] uppercase whitespace-nowrap">
        <p className="leading-[15px]">SHARED</p>
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[10px] whitespace-nowrap">
        <p className="leading-[15px]">Mar 12</p>
      </div>
    </div>
  );
}

function Container33() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative size-full">
          <Container34 />
          <Container35 />
        </div>
      </div>
    </div>
  );
}

function OverlayBorder1() {
  return (
    <div className="bg-[rgba(255,255,255,0.5)] relative rounded-[32px] shrink-0 w-full" data-name="Overlay+Border">
      <div aria-hidden className="absolute border border-[#f3f4f6] border-solid inset-0 pointer-events-none rounded-[32px]" />
      <div className="content-stretch flex flex-col gap-[12px] items-start p-[21px] relative size-full">
        <Container32 />
        <Container33 />
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[16px] items-start overflow-auto relative rounded-[inherit] size-full">
        <Background2 />
        <OverlayBorder />
        <OverlayBorder1 />
      </div>
    </div>
  );
}

function TopHistoryCard({ sessions }) {
  return (
    <div className="backdrop-blur-[5px] bg-[rgba(255,255,255,0.7)] flex-[1_0_0] min-h-px relative rounded-[40px] w-full" data-name="Top History Card">
      <div aria-hidden className="absolute border border-[rgba(255,255,255,0.3)] border-solid inset-0 pointer-events-none rounded-[40px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
      <div className="content-stretch flex flex-col items-start p-[33px] relative size-full">
        <Margin />
        <Container23 />
        {/* Render chat sessions */}
        <div className="mt-4">
          {sessions && sessions.map(session => (
            <div key={session._id} className="p-2 border-b border-gray-200">
              {session.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AsideHistorySidebarFromObsidianGlassTheme({ sessions }) {
  return (
    <div className="content-stretch flex flex-col h-full items-start justify-center relative shrink-0 w-[320px]" data-name="Aside - History Sidebar from Obsidian Glass theme">
      <TopHistoryCard sessions={sessions} />
    </div>
  );
}

function MainWorkspaceArea() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[24px] items-start min-h-px overflow-clip relative w-full" data-name="Main Workspace Area">
      <SectionCenterChatWorkspace />
      <AsideHistorySidebarFromObsidianGlassTheme />
    </div>
  );
}

function MainContentArea() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] h-full items-start min-w-px overflow-clip relative" data-name="Main Content Area">
      <HeaderFromScreen15StyledAsAiAssistant />
      <MainWorkspaceArea />
    </div>
  );
}

function Svg15() {
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

function Button3() {
  return (
    <div className="backdrop-blur-[4px] bg-[rgba(255,255,255,0.7)] content-stretch flex items-center justify-center p-px relative rounded-[24px] shrink-0 size-[48px]" data-name="Button">
      <div aria-hidden className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[24px]" />
      <div className="absolute bg-[rgba(255,255,255,0)] left-0 rounded-[24px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] size-[48px] top-0" data-name="Button:shadow" />
      <Svg15 />
    </div>
  );
}

function FloatingExpandControl() {
  return (
    <div className="absolute bottom-[32px] content-stretch flex flex-col items-start right-[32px]" data-name="Floating Expand Control">
      <Button3 />
    </div>
  );
}

export default function HtmlBody() {
  const user = getStoredUser();
  const [sessions, setSessions] = useState([]);
  useEffect(() => {
    if (user.email) {
      fetch(`/chat/sessions?email=${user.email}`)
        .then(res => res.json())
        .then(setSessions)
        .catch(err => console.error('Failed to fetch chat sessions', err));
    }
  }, [user.email]);
  return (
    <div className="content-stretch flex gap-[16px] items-start p-[16px] relative size-full" style={{ backgroundImage: "linear-gradient(90deg, rgb(226, 228, 231) 0%, rgb(226, 228, 231) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }} data-name="Html → Body">
      <AsideHistorySidebarFromObsidianGlassTheme sessions={sessions} />
      <MainContentArea />
      <FloatingExpandControl />
    </div>
  );
}
