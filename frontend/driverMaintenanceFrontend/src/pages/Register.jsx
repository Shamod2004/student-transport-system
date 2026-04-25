import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { register } from '../services/authService'
import './Register.css'

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'admin' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await register(formData)
      toast.success('Account created! Welcome.')
      if (response.role === 'driver' || formData.role === 'driver') {
        navigate('/login')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <div className="register-logo">
            <span>🚌</span>
          </div>
          <h1 className="register-title">Create Account</h1>
          <p className="register-subtitle">Join the UniBus Fleet Management Hub</p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="register-form-group">
            <label htmlFor="role">Account Type</label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
              className="register-select"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px', color: '#0f172a', backgroundColor: '#f8fafc', outline: 'none', transition: 'all 0.2s ease', fontFamily: 'inherit' }}
            >
              <option value="admin">Administrator</option>
              <option value="driver">Driver</option>
            </select>
          </div>

          <div className="register-form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              placeholder={formData.role === 'admin' ? "Administrator Name" : "Driver Name"}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="register-form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="admin@unibus.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="register-form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="register-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register & Continue'}
          </button>
        </form>

        <div className="register-footer">
          <p>Already have an account? <Link to="/" className="register-link">Sign In</Link></p>
        </div>
      </div>
      
      <div className="register-bg-decoration">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
      </div>
    </div>
  )
}

export default Register
