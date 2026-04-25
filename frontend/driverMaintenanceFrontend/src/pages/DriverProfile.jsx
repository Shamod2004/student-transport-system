import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import * as leaveService from '../services/leaveService'
import { getDriverByUserId } from '../services/driverService'
import { getAssignmentsByDriver } from '../services/routeAssignmentService'
import { logout } from '../services/authService'
import { formatDate } from '../utils/formatDate'
import toast from 'react-hot-toast'
import './DriverProfile.css'

/* ── Sidebar Component ── */
const Sidebar = ({ driver, activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
    { id: 'schedule',  label: 'My Schedule', icon: '📅' },
    { id: 'inspections', label: 'Vehicle Inspection', icon: '📋' },
    { id: 'leave',     label: 'Leave Requests', icon: '🗒️' },
  ]

  const handleLogout = () => {
    logout()
    window.location.assign(import.meta.env.VITE_CENTRAL_LOGIN_URL || 'http://localhost:3001/login')
  }

  return (
    <aside className="dp-sidebar">
      <div className="dp-sidebar__logo">
        <span className="dp-sidebar__logo-icon">🚌</span>
        <span className="dp-sidebar__logo-text">UniFleet</span>
      </div>
      <nav className="dp-sidebar__nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`dp-sidebar__link${activeTab === item.id ? ' dp-sidebar__link--active' : ''}`}
          >
            <span className="dp-sidebar__icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div style={{marginTop: 'auto'}}>
        <div className="dp-sidebar__user">
          <div className="dp-sidebar__avatar">
            {driver.name ? driver.name.charAt(0) : 'D'}
          </div>
          <div>
            <p className="dp-sidebar__user-name">{driver.name || 'Driver'}</p>
            <p className="dp-sidebar__user-role">Driver Portal</p>
          </div>
        </div>
        <button className="dp-sidebar__logout" onClick={handleLogout}>🚪 Sign Out</button>
      </div>
    </aside>
  )
}

/* ── Main Driver Profile Page ── */
const DriverProfile = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [driverData, setDriverData] = useState(null)
  const [assignment, setAssignment] = useState(null)
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [shiftStatus, setShiftStatus] = useState('Checked In')

  /* Leave form state */
  const [leaveForm, setLeaveForm] = useState({ leaveType: 'Sick Leave', startDate: '', endDate: '', reason: '' })

  /* Inspection form state */
  const [mileage, setMileage] = useState('')
  const [fuelLevel, setFuelLevel] = useState('3/4')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  
  const [conditions, setConditions] = useState({
    brakes: 'Good', tireCondition: 'Good', batteryCondition: 'Good', engineCondition: 'Good',
    oilAndCoolant: 'Good', lights: 'Good', mirrorsAndGlasses: 'Good', interiorCleanliness: 'Good',
  })
  const conditionLabels = {
    brakes: 'Brakes', tireCondition: 'Tire Condition', batteryCondition: 'Battery Condition', engineCondition: 'Engine Condition',
    oilAndCoolant: 'Oil & Coolant', lights: 'Lights', mirrorsAndGlasses: 'Mirrors & Glasses', interiorCleanliness: 'Interior Cleanliness',
  }

  const loadData = async () => {
    try {
      const storedUser = localStorage.getItem('user')
      if (!storedUser) {
        setLoading(false)
        navigate('/login', { replace: true })
        return
      }

      let user = null
      try {
        user = JSON.parse(storedUser)
      } catch (_err) {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        setLoading(false)
        navigate('/login', { replace: true })
        return
      }

      // 1. Get Driver Info via service
      const dRes = await getDriverByUserId(user._id || user.id)
      const driver = dRes.data
      setDriverData(driver)

      // 2. Get Today's Assignment via service
      try {
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        const end = new Date()
        end.setHours(23, 59, 59, 999)

        const aRes = await getAssignmentsByDriver(driver._id)
        setAssignment(aRes.data.find(a => {
          const d = new Date(a.assignedDate)
          return d >= start && d <= end
        }))
      } catch (err) { console.log('No assignments found or error loading assignment') }

      // 3. Get Leave Requests via service
      try {
        const lRes = await leaveService.getLeavesByDriver(driver._id)
        setLeaves(lRes.data)
      } catch (err) { console.log('No leaves found or error loading leaves') }

      setLoading(false)
    } catch (err) {
      console.error('Error loading driver data:', err)
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  /* Handlers */
  const handleConditionChange = (key, val) => setConditions((prev) => ({ ...prev, [key]: val }))

  const handleInspectionSubmit = async (result) => {
    if (!mileage) return toast.error('Please enter current mileage')
    if (!assignment) return toast.error('No assignment found for today')
    try {
      await api.post('/inspections', {
        driver: driverData._id, bus: assignment.bus?._id || assignment.bus,
        currentMileage: Number(mileage), fuelLevel, conditions, additionalNotes, result
      })
      setSubmitted(true)
      toast.success(result === 'Fit for Duty' ? 'Inspection submitted!' : 'Issue reported to maintenance.')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit inspection') }
  }

  const handleLeaveSubmit = async (e) => {
    e.preventDefault()
    if(!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) return toast.error('Fill all fields')
    try {
      await leaveService.createLeaveRequest({ ...leaveForm, driver: driverData._id })
      toast.success('Leave request submitted successfully')
      setLeaveForm({ leaveType: 'Sick Leave', startDate: '', endDate: '', reason: '' })
      loadData()
    } catch (err) {
      toast.error('Failed to submit leave request')
    }
  }

  if (loading) return <div style={{padding: '40px', textAlign: 'center'}}>Loading Portal...</div>
  if (!driverData) return <div style={{padding: '40px', textAlign: 'center'}}>Driver data not found. Please log in again.</div>

  const driver = driverData

  return (
    <div className="dp-layout">
      <Sidebar driver={driver} activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="dp-main">
        <header className="dp-header">
          <div>
            <h1 className="dp-header__title">
              {activeTab === 'dashboard' ? 'Overview' : 
               activeTab === 'schedule' ? 'My Schedule' :
               activeTab === 'inspections' ? 'Pre-Trip Inspection' : 'Leave Management'}
            </h1>
            <p className="dp-header__sub">Welcome back, {driver.name.split(' ')[0]}!</p>
          </div>
          <div className="dp-shift">
            <div className="dp-shift__status"><span className="dp-shift__dot" /> {shiftStatus}</div>
            <button className="dp-shift__btn dp-shift__btn--out" onClick={() => setShiftStatus(shiftStatus === 'Checked Out' ? 'Checked In' : 'Checked Out')}>
              {shiftStatus === 'Checked Out' ? 'Check In' : '✕ Check Out'}
            </button>
          </div>
        </header>

        {/* ── DASHBOARD TAB ── */}
        {activeTab === 'dashboard' && (
          <div className="dp-content-grid">
            <div className="dp-card dp-profile-summary">
              <div className="dp-profile-summary__avatar">{driver.name.charAt(0)}</div>
              <h2 className="dp-profile-summary__name">{driver.name}</h2>
              <span className={`dp-profile-summary__status ${driver.status.toLowerCase().replace(/\s/g, '')}`}>{driver.status}</span>
              
              <div className="dp-info-list">
                <div className="dp-info-item"><span className="dp-info-label">License</span><span className="dp-info-val">{driver.licenseNumber}</span></div>
                <div className="dp-info-item"><span className="dp-info-label">Phone</span><span className="dp-info-val">{driver.contactNumber}</span></div>
                <div className="dp-info-item"><span className="dp-info-label">Joining Date</span><span className="dp-info-val">{formatDate(driver.joiningDate)}</span></div>
              </div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '32px'}}>
              <div className="dp-card dp-route-card">
                <p className="dp-card-title">Today's Active Assignment</p>
                {assignment ? (
                  <>
                    <h2 className="dp-route__name">{assignment.routeName}</h2>
                    <p className="dp-route__dest">Terminal: {assignment.destination}</p>
                    <div className="dp-route__details">
                      <div className="dp-route__stat"><span className="dp-route__stat-label">Assigned Bus</span><span className="dp-route__stat-val">{assignment.bus?.plateNumber || assignment.bus}</span></div>
                      <div className="dp-route__stat"><span className="dp-route__stat-label">Schedule Time</span><span className="dp-route__stat-val">{assignment.startTime} - {assignment.endTime}</span></div>
                      <div className="dp-route__stat"><span className="dp-route__stat-label">Status</span><span className="dp-route__stat-val">{assignment.status}</span></div>
                    </div>
                  </>
                ) : (
                  <p style={{color: '#94a3b8', margin: '20px 0'}}>No route assigned for today. You are on standby.</p>
                )}
              </div>

              <div className="dp-card">
                <h2 className="dp-card-title">Recent Leave Requests</h2>
                <table className="dp-table">
                  <thead><tr><th>Dates</th><th>Type</th><th>Status</th></tr></thead>
                  <tbody>
                    {leaves.slice(0, 3).map(l => (
                      <tr key={l._id}>
                        <td>{formatDate(l.startDate)} to {formatDate(l.endDate)}</td>
                        <td>{l.leaveType}</td>
                        <td><span className={`dp-badge dp-badge-${l.status.toLowerCase()}`}>{l.status}</span></td>
                      </tr>
                    ))}
                    {leaves.length===0 && <tr><td colSpan="3">No leave history.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── SCHEDULE TAB (Placeholder) ── */}
        {activeTab === 'schedule' && (
          <div className="dp-card">
            <h2 className="dp-card-title">Weekly Schedule</h2>
            <p style={{color: '#64748b'}}>Your full weekly schedule will appear here. Currently viewing today's assignment in the Dashboard.</p>
          </div>
        )}

        {/* ── INSPECTIONS TAB ── */}
        {activeTab === 'inspections' && (
          <div className="dp-card">
            <h2 className="dp-card-title">Pre-Trip Inspection Form</h2>
            {submitted ? (
              <div style={{background: '#dcfce7', padding: '24px', borderRadius: '12px', color: '#166534'}}>
                <h3 style={{margin: '0 0 8px 0'}}>Inspection Complete!</h3>
                <p style={{margin: 0}}>Your daily vehicle inspection has been securely logged.</p>
              </div>
            ) : (
              <div className="dp-form">
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                  <div className="dp-form-group">
                    <label>Current Mileage (km)</label>
                    <input type="number" className="dp-form-input" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="e.g., 45100" />
                  </div>
                  <div className="dp-form-group">
                    <label>Fuel Level</label>
                    <select className="dp-form-select" value={fuelLevel} onChange={(e) => setFuelLevel(e.target.value)}>
                      <option>Empty</option><option>1/4</option><option>1/2</option><option>3/4</option><option>Full</option>
                    </select>
                  </div>
                </div>

                <div style={{marginTop: '24px', marginBottom: '16px'}}>
                  <h3 style={{fontSize: '14px', margin: '0 0 16px 0'}}>Vehicle Modules Checklist</h3>
                  <div className="dp-inspect-grid">
                    {Object.entries(conditionLabels).map(([key, label]) => (
                      <div className="dp-condition-item" key={key}>
                        <span className="dp-condition-label">{label}</span>
                        <div className="dp-toggle-group">
                          <button type="button" className={`dp-toggle-btn good ${conditions[key]==='Good'?'active':''}`} onClick={()=>handleConditionChange(key, 'Good')}>Good</button>
                          <button type="button" className={`dp-toggle-btn issue ${conditions[key]==='Issue'?'active':''}`} onClick={()=>handleConditionChange(key, 'Issue')}>Issue</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dp-form-group">
                  <label>Additional Notes</label>
                  <textarea rows="3" className="dp-form-textarea" placeholder="Report any minor damages or concerns..." value={additionalNotes} onChange={e=>setAdditionalNotes(e.target.value)}></textarea>
                </div>

                <div className="dp-inspect-actions">
                  <button className="dp-btn dp-btn-success" onClick={()=>handleInspectionSubmit('Fit for Duty')}>Submit as Fit for Duty</button>
                  <button className="dp-btn dp-btn-danger" onClick={()=>handleInspectionSubmit('Issue Reported')}>Flag Critical Issue</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── LEAVE TAB ── */}
        {activeTab === 'leave' && (
          <div className="dp-leave-grid">
            <div className="dp-card">
              <h2 className="dp-card-title">Request New Leave</h2>
              <form onSubmit={handleLeaveSubmit} className="dp-form">
                <div className="dp-form-group">
                  <label>Leave Type</label>
                  <select className="dp-form-select" value={leaveForm.leaveType} onChange={e=>setLeaveForm({...leaveForm, leaveType: e.target.value})}>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Annual Leave">Annual Leave</option>
                    <option value="Emergency Leave">Emergency Leave</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="dp-form-group">
                  <label>Start Date</label>
                  <input type="date" className="dp-form-input" value={leaveForm.startDate} onChange={e=>setLeaveForm({...leaveForm, startDate: e.target.value})} />
                </div>
                <div className="dp-form-group">
                  <label>End Date</label>
                  <input type="date" className="dp-form-input" value={leaveForm.endDate} onChange={e=>setLeaveForm({...leaveForm, endDate: e.target.value})} />
                </div>
                <div className="dp-form-group">
                  <label>Reason for Leave</label>
                  <textarea rows="4" className="dp-form-textarea" placeholder="Please provide details..." value={leaveForm.reason} onChange={e=>setLeaveForm({...leaveForm, reason: e.target.value})}></textarea>
                </div>
                <button type="submit" className="dp-btn dp-btn-primary" style={{marginTop: '8px'}}>Submit Request</button>
              </form>
            </div>

            <div className="dp-card">
              <h2 className="dp-card-title">Leave History</h2>
              <table className="dp-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map(l => (
                    <tr key={l._id}>
                      <td style={{fontWeight: 600}}>{l.leaveType}</td>
                      <td>{formatDate(l.startDate)} - {formatDate(l.endDate)}</td>
                      <td style={{color: '#64748b', fontSize: '12px'}}>
                        {String(l.reason || '').slice(0, 30)}
                        {String(l.reason || '').length > 30 ? '...' : ''}
                      </td>
                      <td><span className={`dp-badge dp-badge-${l.status.toLowerCase()}`}>{l.status}</span></td>
                    </tr>
                  ))}
                  {leaves.length === 0 && <tr><td colSpan="4" style={{textAlign: 'center'}}>No leave requests submitted yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

export default DriverProfile
