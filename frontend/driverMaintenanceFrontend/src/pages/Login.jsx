import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import './Login.css'

const CENTRAL_LOGIN_URL = import.meta.env.VITE_CENTRAL_LOGIN_URL || 'http://localhost:3001/login'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const handoffToken = params.get('handoffToken')
    const handoffAdmin = params.get('handoffAdmin')
    const handoffDestination = params.get('handoffDestination')

    if (handoffToken) {
      try {
        let parsedAdmin = null
        if (handoffAdmin) {
          parsedAdmin = JSON.parse(handoffAdmin)
        }

        const parsedRole = String(parsedAdmin?.role || '').toLowerCase()
        const destination = handoffDestination || (parsedRole === 'driver' ? '/driver/dashboard' : '/dashboard')

        localStorage.setItem('token', handoffToken)
        localStorage.setItem('user', JSON.stringify(parsedAdmin || {}))
        navigate(destination, { replace: true })
        return
      } catch (_err) {
        toast.error('Login handoff failed. Redirecting to central login.')
      }
    }

    const centralLogin = new URL(CENTRAL_LOGIN_URL)
    centralLogin.searchParams.set('redirectTo', `${window.location.origin}/login`)
    window.location.replace(centralLogin.toString())
  }, [location.search, navigate])

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <span>🚌</span>
          </div>
          <h1 className="login-title">Driver Maintenance</h1>
          <p className="login-subtitle">Redirecting to central login...</p>
        </div>
      </div>
    </div>
  )
}

export default Login
