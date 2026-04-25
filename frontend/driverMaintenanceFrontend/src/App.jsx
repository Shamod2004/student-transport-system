import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Dashboard from './pages/Dashboard'
import BusManagement from './pages/BusManagement'
import DriverManagement from './pages/DriverManagement'
import DriverProfile from './pages/DriverProfile'
import RoutesSchedules from './pages/RoutesSchedules'
import FleetMaintenance from './pages/FleetMaintenance'
import MaintenanceHub from './pages/MaintenanceHub'
import PreTripInspections from './pages/PreTripInspections'
import Login from './pages/Login'
import Register from './pages/Register'

const ProtectedRoute = ({ children, requireRole }) => {
  const location = useLocation()
  const token = localStorage.getItem('token')
  const rawUser = localStorage.getItem('user')

  if (!token || !rawUser) {
    return <Navigate to={`/login?redirectTo=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }

  let parsedUser = null
  try {
    parsedUser = JSON.parse(rawUser)
  } catch (_err) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return <Navigate to={`/login?redirectTo=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }

  if (requireRole) {
    const role = String(parsedUser?.role || '').toLowerCase()
    if (role !== requireRole) {
      return <Navigate to={role === 'driver' ? '/driver/dashboard' : '/dashboard'} replace />
    }
  }

  return children
}

function App() {
  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute requireRole="admin"><Dashboard /></ProtectedRoute>} />
        <Route path="/buses" element={<ProtectedRoute requireRole="admin"><BusManagement /></ProtectedRoute>} />
        <Route path="/drivers" element={<ProtectedRoute requireRole="admin"><DriverManagement /></ProtectedRoute>} />
        <Route path="/routes" element={<ProtectedRoute requireRole="admin"><RoutesSchedules /></ProtectedRoute>} />
        <Route path="/driver/dashboard" element={<ProtectedRoute requireRole="driver"><DriverProfile /></ProtectedRoute>} />
        <Route path="/driver/schedule" element={<ProtectedRoute requireRole="driver"><DriverProfile /></ProtectedRoute>} />
        <Route path="/driver/inspections" element={<ProtectedRoute requireRole="driver"><DriverProfile /></ProtectedRoute>} />
        <Route path="/driver/leave" element={<ProtectedRoute requireRole="driver"><DriverProfile /></ProtectedRoute>} />
        <Route path="/maintenance" element={<ProtectedRoute requireRole="admin"><FleetMaintenance /></ProtectedRoute>} />
        <Route path="/maintenance-hub" element={<ProtectedRoute requireRole="admin"><MaintenanceHub /></ProtectedRoute>} />
        <Route path="/pre-trip" element={<ProtectedRoute requireRole="admin"><PreTripInspections /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App
