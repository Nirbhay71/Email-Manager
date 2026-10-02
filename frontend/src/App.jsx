import { useEffect, useState } from 'react'
import GeneratedLoginPage from './pages/LoginPage.tsx'
import InboxPage from './pages/InboxPage.tsx'
import MailPage from './pages/MailPage.tsx'
import AIChatPage from './pages/AIChatPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import LegalPage from './pages/LegalPage.tsx'
import { apiFetch, BACKEND, GOOGLE_REAUTH_EVENT } from './utils/api.ts'

const PUBLIC_PAGES = { '/privacy': 'privacy', '/terms': 'terms' }
const BACKFILL_POLL_MS = 5000

function startGoogleLogin() {
  window.location.href = `${BACKEND}/auth/google`
}

function navigate(path) {
  if (window.location.pathname !== path || window.location.search) {
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}

function replacePath(path) {
  if (window.location.pathname !== path || window.location.search) {
    window.history.replaceState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const syncPathname = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', syncPathname)
    return () => window.removeEventListener('popstate', syncPathname)
  }, [])

  return pathname
}

function LoadingScreen() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-white font-['Inter',sans-serif]">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <svg width="32" height="32" viewBox="0 0 160 80" fill="none">
          <path
            d="M 20 60 C 40 65, 55 55, 60 45 C 65 30, 50 15, 40 22 C 30 30, 45 55, 75 50 C 105 45, 120 25, 135 15"
            stroke="#CBD5E1"
            strokeDasharray="5 5"
            strokeLinecap="round"
            strokeWidth="2.5"
          />
          <g transform="translate(133, 13) rotate(-18)">
            <path d="M0,0 L20,8 L2,12 L3,6 Z" fill="#0F172A" />
            <path d="M0,0 L20,8 L2,7 Z" fill="#475569" />
          </g>
        </svg>
        <p className="text-sm">Loading...</p>
      </div>
    </div>
  )
}

function LoginRoute() {
  return (
    <div className="relative h-screen w-screen overflow-auto bg-white">
      <GeneratedLoginPage onGoogleLogin={startGoogleLogin} />
    </div>
  )
}

function Banner({ tone, children }) {
  const toneClass = tone === 'warn'
    ? 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]'
    : 'bg-white text-[#374151] border-[#e5e7eb]'
  return (
    <div role="status" className={`fixed top-[16px] left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-32px)] flex items-center gap-[12px] rounded-full border px-[18px] py-[10px] text-[13px] font-medium shadow-[0px_4px_12px_rgba(0,0,0,0.08)] ${toneClass}`}>
      {children}
    </div>
  )
}

function DashboardRoute({ pathname, needsReauth, syncing }) {
  let Page = InboxPage
  if (pathname === '/mail') Page = MailPage
  if (pathname === '/ai-chat') Page = AIChatPage
  if (pathname === '/profile') Page = ProfilePage

  return (
    <div className="relative h-screen w-screen overflow-auto">
      {needsReauth ? (
        <Banner tone="warn">
          <span>Google access expired — new mail isn't syncing.</span>
          <button type="button" onClick={startGoogleLogin} className="underline font-semibold cursor-pointer">Reconnect Google</button>
        </Banner>
      ) : syncing ? (
        <Banner>
          <span className="w-[8px] h-[8px] rounded-full bg-[#3b82f6] animate-pulse" />
          <span>Importing your recent emails…</span>
        </Banner>
      ) : null}
      <Page />
    </div>
  )
}

export default function App() {
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [needsReauth, setNeedsReauth] = useState(false)
  const [backfillStatus, setBackfillStatus] = useState(null)

  // Any API call that finds Google's grant revoked flips the banner on.
  useEffect(() => {
    const onReauth = () => setNeedsReauth(true)
    window.addEventListener(GOOGLE_REAUTH_EVENT, onReauth)
    return () => window.removeEventListener(GOOGLE_REAUTH_EVENT, onReauth)
  }, [])

  // While the first-login import runs, poll /auth/me until it settles.
  const syncing = backfillStatus === 'pending' || backfillStatus === 'running'
  useEffect(() => {
    if (!user || !syncing) return
    const id = window.setInterval(async () => {
      try {
        const res = await apiFetch('/auth/me')
        if (!res.ok) return
        const data = await res.json()
        setBackfillStatus(data.backfillStatus)
        setNeedsReauth(Boolean(data.needsReauth))
      } catch { /* try again next tick */ }
    }, BACKFILL_POLL_MS)
    return () => window.clearInterval(id)
  }, [user, syncing])

  const publicPage = PUBLIC_PAGES[pathname]

  useEffect(() => {
    // Privacy/Terms must render for signed-out visitors (Google's reviewers
    // included) without bouncing them to the login screen.
    if (PUBLIC_PAGES[window.location.pathname]) {
      setLoading(false)
      return
    }
    const init = async () => {
      // Identity always comes from the backend (via the httpOnly session
      // cookie), never from URL params or trusted localStorage — the OAuth
      // callback redirects here with no query string attached.
      try {
        const res = await apiFetch('/auth/me')
        if (!res.ok) {
          localStorage.removeItem('user')
          setUser(false)
          replacePath('/')
          setLoading(false)
          return
        }
        const data = await res.json()
        const freshUser = { email: data.email, avatar: data.avatar }
        localStorage.setItem('user', JSON.stringify(freshUser))
        setUser(freshUser)
        setNeedsReauth(Boolean(data.needsReauth))
        setBackfillStatus(data.backfillStatus ?? null)
        // /management is a placeholder mock — not reachable until it's real.
        if (window.location.pathname === '/' || window.location.pathname === '/management') replacePath('/inbox')
      } catch {
        localStorage.removeItem('user')
        setUser(false)
        replacePath('/')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  if (publicPage) return <LegalPage page={publicPage} />

  if (loading) return <LoadingScreen />

  if (!user) return <LoginRoute />

  return <DashboardRoute pathname={pathname} needsReauth={needsReauth} syncing={syncing} />
}
