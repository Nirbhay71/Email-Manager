import { useEffect, useState } from 'react'
import GeneratedLoginPage from './pages/LoginPage.tsx'
import InboxPage from './pages/InboxPage.tsx'
import AIChatPage from './pages/AIChatPage.tsx'
import ManagementPage from './pages/ManagementPage.tsx'

const BACKEND_URL = 'http://localhost:5000'

function parseCallbackUser() {
  const params = new URLSearchParams(window.location.search)
  const email = params.get('email')
  const avatar = params.get('avatar')
  const name = params.get('name')

  return email ? { email, avatar, name } : null
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
  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/auth/google`
  }

  return (
    <div className="relative h-screen w-screen overflow-auto bg-white">
      <GeneratedLoginPage />
      <button
        aria-label="Continue with Google"
        className="absolute z-20 h-16 w-[448px] max-w-[calc(100vw-64px)] cursor-pointer opacity-0"
        onClick={handleGoogleLogin}
        style={{
          left: 'max(32px, calc(50% - 528px))',
          top: '598px',
        }}
        type="button"
      />
    </div>
  )
}

function DashboardRoute({ pathname }) {
  let Page = InboxPage
  if (pathname === '/ai-chat') Page = AIChatPage
  if (pathname === '/management') Page = ManagementPage

  return (
    <div className="relative h-screen w-screen overflow-auto">
      <Page />
    </div>
  )
}

export default function App() {
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const callbackUser = parseCallbackUser()

      if (callbackUser) {
        localStorage.setItem('user', JSON.stringify(callbackUser))
        setUser(callbackUser)
        replacePath('/inbox')
        setLoading(false)
        return
      }

      const stored = localStorage.getItem('user')
      if (!stored) {
        setUser(false)
        replacePath('/')
        setLoading(false)
        return
      }

      let parsed
      try {
        parsed = JSON.parse(stored)
      } catch {
        localStorage.removeItem('user')
        setUser(false)
        replacePath('/')
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`${BACKEND_URL}/auth/me?email=${encodeURIComponent(parsed.email)}`)
        if (!res.ok) {
          localStorage.removeItem('user')
          setUser(false)
          replacePath('/')
          return
        }

        const data = await res.json()
        const freshUser = {
          email: data.email,
          avatar: data.avatar,
          name: data.name ?? parsed.name,
        }
        localStorage.setItem('user', JSON.stringify(freshUser))
        setUser(freshUser)
      } catch {
        setUser(parsed)
      } finally {
        if (window.location.pathname === '/') replacePath('/inbox')
        setLoading(false)
      }
    }

    init()
  }, [])

  if (loading) return <LoadingScreen />

  if (!user) return <LoginRoute />

  return <DashboardRoute pathname={pathname} />
}
