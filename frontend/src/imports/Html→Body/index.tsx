import svgPaths from "./svg-zudsot3p28";
import imgRightIllustrationSection from "./b76797ba8438599c112f35e6643c0ef55694516a.png";

function LogoIconSvg() {
  return (
    <div className="relative shrink-0 size-[56px]" data-name="Logo/Icon → SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="56" preserveAspectRatio="none" viewBox="0 0 56 56" width="56">
        <g id="Logo/Icon â SVG">
          <path d={svgPaths.p2b6fa100} id="Vector" stroke="var(--stroke-0, #171717)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.66667" />
          <g id="Vector_2">
            <path d={svgPaths.p2a7e64c0} fill="var(--fill-0, #171717)" />
            <path d={svgPaths.p2a7e64c0} stroke="var(--stroke-0, #171717)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.66667" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function LogoIconMargin() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[48px] relative shrink-0" data-name="Logo/Icon:margin">
      <LogoIconSvg />
    </div>
  );
}

function Heading() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0 w-full" data-name="Heading 1">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#111827] text-[48px] text-center tracking-[-0.96px] whitespace-nowrap">
        <p className="leading-[48px]">Welcome back!</p>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#6b7280] text-[18px] text-center whitespace-nowrap">
        <p className="leading-[28px]">Your inbox, smarter. Your day, organized.</p>
      </div>
    </div>
  );
}

function HeaderTitles() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[329.06px]" data-name="Header Titles">
      <Heading />
      <Container1 />
    </div>
  );
}

function HeaderTitlesMargin() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[56px] relative shrink-0" data-name="Header Titles:margin">
      <HeaderTitles />
    </div>
  );
}

function Svg() {
  return (
    <div className="relative shrink-0 size-[22px]" data-name="SVG">
      <svg className="absolute block inset-0 size-full" fill="none" height="22" preserveAspectRatio="none" viewBox="0 0 22 22" width="22">
        <g clipPath="url(#clip0_1_45)" id="SVG">
          <path d={svgPaths.p169b5680} fill="var(--fill-0, #4285F4)" id="Vector" />
          <path d={svgPaths.p3314f200} fill="var(--fill-0, #34A853)" id="Vector_2" />
          <path d={svgPaths.p41a3a00} fill="var(--fill-0, #FBBC05)" id="Vector_3" />
          <path d={svgPaths.p3d9a240} fill="var(--fill-0, #EA4335)" id="Vector_4" />
        </g>
        <defs>
          <clipPath id="clip0_1_45">
            <rect fill="white" height="22" width="22" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function ButtonGoogleAuth() {
  return (
    <div className="bg-[rgba(255,255,255,0)] relative rounded-[8px] shrink-0 w-full" data-name="Button - Google Auth">
      <div aria-hidden className="absolute border border-[#e5e7eb] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[16px] items-center justify-center px-[25px] py-[17px] relative size-full">
          <Svg />
          <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#171717] text-[18px] text-center whitespace-nowrap">
            <p className="leading-[28px]">Continue with Google</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginActions() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[16px] relative shrink-0 w-full" data-name="Login Actions">
      <ButtonGoogleAuth />
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col items-center max-w-[448px] relative shrink-0 w-[448px]" data-name="Container">
      <LogoIconMargin />
      <HeaderTitlesMargin />
      <LoginActions />
    </div>
  );
}

function Link() {
  return (
    <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#9ca3af] text-[12px] whitespace-nowrap">
        <p className="leading-[16px]">Privacy</p>
      </div>
    </div>
  );
}

function BackgroundAlignCenter() {
  return (
    <div className="content-stretch flex items-center relative self-stretch shrink-0" data-name="Background:align-center">
      <div className="bg-[#d1d5db] relative rounded-[9999px] shrink-0 size-[4px]" data-name="Background" />
    </div>
  );
}

function Link1() {
  return (
    <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#9ca3af] text-[12px] whitespace-nowrap">
        <p className="leading-[16px]">Terms</p>
      </div>
    </div>
  );
}

function BackgroundAlignCenter1() {
  return (
    <div className="content-stretch flex items-center relative self-stretch shrink-0" data-name="Background:align-center">
      <div className="bg-[#d1d5db] relative rounded-[9999px] shrink-0 size-[4px]" data-name="Background" />
    </div>
  );
}

function Link2() {
  return (
    <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#9ca3af] text-[12px] whitespace-nowrap">
        <p className="leading-[16px]">Security</p>
      </div>
    </div>
  );
}

function FooterBottomLinks() {
  return (
    <div className="absolute bottom-[40px] content-stretch flex gap-[24px] h-[16px] items-start left-[225.86px]" data-name="Footer - Bottom Links">
      <Link />
      <BackgroundAlignCenter />
      <Link1 />
      <BackgroundAlignCenter1 />
      <Link2 />
    </div>
  );
}

function LeftFormSection() {
  return (
    <div className="bg-white relative self-stretch shrink-0 w-[672px]" data-name="Left Form Section">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="content-stretch flex flex-col items-center justify-center p-[32px] relative size-full">
          <Container />
          <FooterBottomLinks />
        </div>
      </div>
    </div>
  );
}

function RightIllustrationSection() {
  return (
    <div className="bg-[#f0f0f0] overflow-clip relative self-stretch shrink-0 w-[608px]" data-name="Right Illustration Section">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-full left-[-152.88%] max-w-none top-0 w-[252.88%]" src={imgRightIllustrationSection} />
      </div>
      <div className="absolute bg-[rgba(0,0,0,0.05)] inset-0 mix-blend-multiply" data-name="Overlay to ensure the stippled effect and monochrome look feel integrated" />
    </div>
  );
}

function MainLayout() {
  return (
    <div className="content-stretch flex h-[1024px] items-start justify-center min-h-[1024px] relative shrink-0 w-full" data-name="Main Layout">
      <LeftFormSection />
      <RightIllustrationSection />
    </div>
  );
}

export default function HtmlBody() {
  return (
    <div className="content-stretch flex flex-col items-start relative size-full" style={{ backgroundImage: "linear-gradient(90deg, rgb(252, 252, 252) 0%, rgb(252, 252, 252) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }} data-name="Html → Body">
      <MainLayout />
    </div>
  );
}