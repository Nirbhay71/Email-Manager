import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import SearchPage from './pages/SearchPage'
import OnboardingLabeling from './pages/OnboardingLabeling'
import InboxPage from './pages/InboxPage'

function App() {
  const [view, setView] = useState('inbox') // default to inbox for Phase 5

  return (
    <div>
      <div className="absolute top-4 left-4 z-50 flex gap-2">
        <button 
          onClick={() => setView('login')}
          className={`px-4 py-2 rounded text-sm ${view === 'login' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}
        >
          Login
        </button>
        <button 
          onClick={() => setView('inbox')}
          className={`px-4 py-2 rounded text-sm ${view === 'inbox' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}
        >
          Inbox
        </button>
        <button 
          onClick={() => setView('search')}
          className={`px-4 py-2 rounded text-sm ${view === 'search' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}
        >
          Search
        </button>
        <button 
          onClick={() => setView('onboarding')}
          className={`px-4 py-2 rounded text-sm ${view === 'onboarding' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}
        >
          Onboarding
        </button>
      </div>
      {view === 'login' && <LoginPage />}
      {view === 'inbox' && <InboxPage />}
      {view === 'search' && <SearchPage />}
      {view === 'onboarding' && <OnboardingLabeling />}
    </div>
  )
}

export default App
