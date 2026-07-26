import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import SearchPage from './pages/SearchPage'

function App() {
  const [view, setView] = useState('search') // default to search for testing Phase A

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
          onClick={() => setView('search')}
          className={`px-4 py-2 rounded text-sm ${view === 'search' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}
        >
          Search
        </button>
      </div>
      {view === 'login' ? <LoginPage /> : <SearchPage />}
    </div>
  )
}

export default App
