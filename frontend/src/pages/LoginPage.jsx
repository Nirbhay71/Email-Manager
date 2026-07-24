import { useEffect, useRef } from 'react'
import { animate, createTimeline } from 'animejs'
import mailboxIllustration from '../assets/mailbox-illustration.png'

export default function LoginPage() {
    const headingRef = useRef(null)
    const subtitleRef = useRef(null)
    const buttonRef = useRef(null)
    const planeContainerRef = useRef(null)
    const rightPanelRef = useRef(null)
    const footerRef = useRef(null)

    // Handle Google Login Integration
    const handleGoogleLogin = () => {
        // Redirect to backend OAuth route
        window.location.href = 'http://localhost:5000/auth/google'
    }

    useEffect(() => {
        const tl = createTimeline({
            defaults: { ease: 'outExpo' },
        })

        // Elegant sequential entrance animations
        tl.add(planeContainerRef.current, { opacity: [0, 1], scale: [0.8, 1], duration: 800 }, 100)
            .add(headingRef.current, { opacity: [0, 1], translateY: [20, 0], duration: 800 }, 300)
            .add(subtitleRef.current, { opacity: [0, 1], translateY: [15, 0], duration: 700 }, 450)
            .add(buttonRef.current, { opacity: [0, 1], translateY: [15, 0], scale: [0.97, 1], duration: 800 }, 600)
            .add(footerRef.current, { opacity: [0, 1], duration: 900 }, 800)
            .add(rightPanelRef.current, { opacity: [0, 1], duration: 1200 }, 200)
    }, [])

    return (
        <div className="flex h-screen w-screen bg-[#FFFFFF] overflow-hidden select-none" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ═══════════ LEFT PANEL (FORM AREA) ═══════════ */}
            <div className="relative flex flex-col justify-between items-center w-full lg:w-[48%] h-full p-8 sm:p-12 lg:p-16 bg-[#FFFFFF]">

                {/* Top spacer / logo placement if needed */}
                <div className="h-6"></div>

                {/* Center Form Container */}
                <div className="w-full max-w-sm mx-auto flex flex-col items-stretch justify-center text-center">

                    {/* Decorative Paper Plane Icon with Dotted Trail */}
                    <div ref={planeContainerRef} className="relative w-48 h-24 mb-10 mx-auto flex items-center justify-center">
                        <svg viewBox="0 0 160 80" fill="none" className="w-full h-full overflow-visible">
                            {/* Dotted trail */}
                            <path
                                d="M 20 60 C 40 65, 55 55, 60 45 C 65 30, 50 15, 40 22 C 30 30, 45 55, 75 50 C 105 45, 120 25, 135 15"
                                stroke="#CBD5E1"
                                strokeWidth="2.5"
                                strokeDasharray="5 5"
                                fill="none"
                                strokeLinecap="round"
                            />
                            {/* Paper plane polygon */}
                            <g transform="translate(133, 13) rotate(-18)">
                                <path
                                    d="M0,0 L20,8 L2,12 L3,6 Z"
                                    fill="#0F172A"
                                />
                                <path
                                    d="M0,0 L20,8 L2,7 Z"
                                    fill="#475569"
                                />
                            </g>
                        </svg>
                    </div>

                    {/* Copy Headers */}
                    <h1
                        ref={headingRef}
                        className="text-[40px] font-bold text-[#0F172A] tracking-[-0.03em] leading-tight mb-2"
                    >
                        Welcome back!
                    </h1>
                    <p
                        ref={subtitleRef}
                        className="text-base text-[#64748B] font-normal leading-relaxed mb-10"
                    >
                        Your inbox, smarter. Your day, organized.
                    </p>

                    {/* Google OAuth Login Button */}
                    <div ref={buttonRef} className="w-full">
                        <button
                            onClick={handleGoogleLogin}
                            className="flex items-center justify-center gap-3.5 w-full py-4 px-6 bg-white border border-[#E2E8F0] rounded-2xl text-[15px] font-semibold text-[#1E293B] shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all duration-200 cursor-pointer active:scale-[0.98]"
                        >
                            <svg className="w-5.5 h-5.5" viewBox="0 0 48 48">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                            </svg>
                            Continue with Google
                        </button>
                    </div>

                </div>

                {/* Footer links */}
                <div
                    ref={footerRef}
                    className="flex justify-center items-center gap-6 text-[13px] text-[#94A3B8] font-medium"
                >
                    <a href="#privacy" className="hover:text-[#64748B] transition-colors">Privacy</a>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E2E8F0]"></span>
                    <a href="#terms" className="hover:text-[#64748B] transition-colors">Terms</a>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E2E8F0]"></span>
                    <a href="#security" className="hover:text-[#64748B] transition-colors">Security</a>
                </div>

            </div>

            {/* ═══════════ RIGHT PANEL (STIPPLE ILLUSTRATION) ═══════════ */}
            <div
                ref={rightPanelRef}
                className="hidden lg:block relative w-[52%] h-full bg-[#F4F4F1] border-l border-[#F1F1ED]"
            >
                <img
                    src={mailboxIllustration}
                    alt="Stipple mailbox illustration"
                    className="w-full h-full object-cover select-none"
                    draggable="false"
                />
            </div>

        </div>
    )
}
