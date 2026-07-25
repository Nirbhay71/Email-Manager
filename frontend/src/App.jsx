import { useState, useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  const [email, setEmail] = useState(null)

  useEffect(() => {
    // Check if email is in the URL query string
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('email')

    if (emailParam) {
      // Store in state and localStorage
      setEmail(emailParam)
      localStorage.setItem('userEmail', emailParam)

      // Clean the URL address bar without reloading
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
    } else {
      // Check if email is already saved in localStorage
      const savedEmail = localStorage.getItem('userEmail')
      if (savedEmail) {
        setEmail(savedEmail)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('userEmail')
    setEmail(null)
  }

  if (email) {
    return <DashboardPage userEmail={email} onLogout={handleLogout} />
  }

  return <LoginPage />
}

export default App
