import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import * as driverService from '../services/driverService'
import * as busService from '../services/busService'
import * as routeAssignmentService from '../services/routeAssignmentService'
import * as leaveService from '../services/leaveService'
import api from '../services/api'
import { formatDate } from '../utils/formatDate'
import Sidebar from '../components/Sidebar'
import DriverRouteAssignmentCard from '../components/DriverRouteAssignmentCard'
import './DriverManagement.css'

const DriverManagement = () => {
  // State
  const [drivers, setDrivers] = useState([])
  const [buses, setBuses] = useState([])
  const [routeAssignments, setRouteAssignments] = useState([])
  const [leaves, setLeaves] = useState([])
  const [availableRoutes, setAvailableRoutes] = useState([])
  const [selectedDriverForDetails, setSelectedDriverForDetails] = useState(null)

  // Form State - Driver
  const initialForm = { name: '', licenseNumber: '', contactNumber: '', status: 'Active' }
  const [formData, setFormData] = useState(initialForm)
  const [isEditing, setIsEditing] = useState(null)
  const [filterStatus, setFilterStatus] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  // Form State - Route Assignment
  const initialAssignment = { driver: '', bus: '', startTime: '08:00', endTime: '16:00', status: 'Scheduled' }
  const [assignment, setAssignment] = useState(initialAssignment)
  const [isEditingAssignment, setIsEditingAssignment] = useState(null)

  // Fetch Data
  const loadData = async () => {
    // Individual try-catch blocks ensure that one failing API doesn't break the whole dashboard
    try {
      const res = await driverService.getAllDrivers()
      setDrivers(res.data)
    } catch (err) { console.error('Drivers load error:', err) }

    try {
      // Route catalog is served by booking backend route service.
      const routeApiBase = import.meta.env.VITE_ROUTE_BACKEND_API_URL || 'http://localhost:5001/api'
      const rRes = await fetch(`${routeApiBase}/routes?limit=100`)
      const rData = await rRes.json()
      if (rRes.ok && rData?.data?.routes) {
        setAvailableRoutes(rData.data.routes)
      } else {
        setAvailableRoutes([])
      }
    } catch (err) {
      console.error('Available routes load error:', err)
      setAvailableRoutes([])
    }

    try {
      const res = await busService.getAllBuses()
      setBuses(res.data)
    } catch (err) { console.error('Buses load error:', err) }

    try {
      const res = await routeAssignmentService.getAllRouteAssignments()
      setRouteAssignments(res.data)
    } catch (err) { console.error('Route assignments load error:', err) }

    try {
      const res = await leaveService.getAllLeaveRequests()
      setLeaves(res.data)
    } catch (err) { console.error('Leaves load error:', err) }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Derived Stats
  const activeDuty = drivers.filter(d => d.status === 'Active').length
  const onLeave = drivers.filter(d => d.status === 'On Leave').length
  const pendingApprovals = leaves.filter(l => l.status === 'Pending').length

  // Handlers
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.licenseNumber || !formData.contactNumber) {
      toast.error('Please fill all required driver fields.')
      return
    }
    try {
      const payload = {
        name: formData.name.trim(),
        licenseNumber: formData.licenseNumber.trim(),
        contactNumber: formData.contactNumber.trim(),
        status: formData.status || 'Active'
      }

      if (isEditing) {
        await driverService.updateDriver(isEditing, payload)
        toast.success('Driver updated successfully.')
      } else {
        await driverService.createDriver(payload)
        toast.success('Driver registered successfully.')
      }
      setFormData(initialForm)
      setIsEditing(null)
      loadData()
    } catch (err) {
      console.error('Driver submission error:', err)
      console.error('Server response:', JSON.stringify(err.response?.data, null, 2))
      console.error('Status:', err.response?.status)
      console.error('Full error data:', err.response?.data?.message, err.response?.data?.errors)
      const errorMsg = err.response?.data?.message || err.message
      toast.error(`Failed to save: ${errorMsg}`)
    }
  }

  const handleEdit = (driver) => {
    setIsEditing(driver._id)
    setFormData({
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      contactNumber: driver.contactNumber,
      status: driver.status
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this driver?')) {
      try {
        await driverService.deleteDriver(id)
        toast.success('Driver deleted.')
        loadData()
      } catch (err) {
        toast.error(err.response?.data?.message || err.message)
      }
    }
  }

  const handleAssignRoute = async (e) => {
    e.preventDefault()
    if (!assignment.driver || !assignment.bus) {
      toast.error('Please select both driver and bus.')
      return
    }
    try {
      if (isEditingAssignment) {
        await routeAssignmentService.updateRouteAssignment(isEditingAssignment, assignment)
        toast.success('Route assignment updated.')
      } else {
        await routeAssignmentService.createRouteAssignment(assignment)
        toast.success('Route assigned successfully.')
      }
      setAssignment(initialAssignment)
      setIsEditingAssignment(null)
      loadData()
    } catch (err) {
      console.error('Assignment error:', err)
      toast.error(err.response?.data?.message || err.message)
    }
  }

  const handleEditAssignment = (ra) => {
    setIsEditingAssignment(ra._id)
    setAssignment({
      driver: ra.driver?._id || '',
      bus: ra.bus?._id || '',
      routeName: ra.routeName,
      destination: ra.destination,
      startTime: ra.startTime,
      endTime: ra.endTime,
      status: ra.status
    })
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }

  const handleCancelAssignment = async (id) => {
    if (window.confirm('Cancel and remove this route assignment?')) {
      try {
        await routeAssignmentService.deleteRouteAssignment(id)
        toast.success('Assignment removed.')
        loadData()
      } catch (err) {
        toast.error('Failed to remove assignment.')
      }
    }
  }

  const handleApproveLeave = async (id) => {
    try {
      await leaveService.updateLeaveStatus(id, 'Approved')
      // Also update driver status to 'On Leave'
      const leave = leaves.find(l => l._id === id)
      if (leave && leave.driver) {
        await driverService.updateDriver(leave.driver._id, { status: 'On Leave' })
      }
      toast.success('Leave request approved.')
      loadData()
    } catch (err) {
      toast.error('Failed to approve leave.')
    }
  }

  const handleRejectLeave = async (id) => {
    try {
      await leaveService.updateLeaveStatus(id, 'Rejected')
      toast.success('Leave request rejected.')
      loadData()
    } catch (err) {
      toast.error('Failed to reject leave.')
    }
  }

  const filteredDrivers = drivers.filter(d => {
    const matchesStatus = filterStatus === 'All' || d.status === filterStatus
    const matchesSearch = !searchQuery || 
                         (d.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                         (d.licenseNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="adm-layout">
      <Sidebar />
      <main className="adm-main">
        <header className="adm-header">
          <h1 className="adm-title">Driver Management Hub</h1>
          {/* <div className="adm-user">
            <span className="adm-bell">🔔</span>
            <div className="adm-avatar">A</div>
          </div> */}
        </header>

        <div className="adm-content">
          <div className="adm-left">
            {/* Stats */}
            <div className="adm-stats">
              <div className="adm-stat-card">
                <span className="adm-stat-title">Total Drivers</span>
                <span className="adm-stat-icon">👥</span>
                <div className="adm-stat-val">{drivers.length}</div>
              </div>
              <div className="adm-stat-card">
                <span className="adm-stat-title">Active Duty</span>
                <div className="adm-stat-val">{activeDuty}</div>
              </div>
              <div className="adm-stat-card">
                <span className="adm-stat-title">On Leave</span>
                <div className="adm-stat-val">{onLeave}</div>
              </div>
              <div className="adm-stat-card">
                <span className="adm-stat-title">Pending Approvals</span>
                <span className="adm-stat-icon">📅</span>
                <div className="adm-stat-val">{pendingApprovals}</div>
              </div>
            </div>

            {/* Driver Directory */}
            <div className="adm-table-card">
              <div className="adm-table-header">
                <h2>👤 Driver Directory</h2>
                <div className="adm-filter" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="adm-search-wrap" style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      placeholder="Search name or license..." 
                      className="adm-btn" 
                      style={{ padding: '6px 30px 6px 12px', border: '1px solid #e2e8f0', background: 'transparent' }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <span 
                        onClick={() => setSearchQuery('')} 
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#999' }}
                      >
                        ✕
                      </span>
                    )}
                  </div>
                  <select 
                    className="adm-btn" 
                    style={{ padding: '6px 12px', border: '1px solid #e2e8f0', cursor: 'pointer', background: 'transparent' }}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active Duty</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Driver Info</th>
                    <th>License No.</th>
                    <th>Phone Number</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.map(d => (
                    <tr key={d._id} onClick={() => setSelectedDriverForDetails(d)} style={{ cursor: 'pointer' }}>
                      <td>{d.fullName || d.name}</td>
                      <td>{d.licenseNumber}</td>
                      <td>{d.phone || d.contactNumber}</td>
                      <td>
                        <span className={`adm-badge adm-badge--${d.status.replace(/\s+/g, '').toLowerCase()}`}>
                          {d.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button type="button" className="adm-action-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => handleEdit(d)}>✏️</button>
                          <button type="button" className="adm-action-link" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0 }} onClick={() => handleDelete(d._id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredDrivers.length === 0 && <tr><td colSpan="5">No drivers found.</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Leave Approvals */}
            <div className="adm-table-card">
              <div className="adm-table-header">
                <h2>🗒️ Leave Approvals & History</h2>
              </div>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Req ID</th>
                    <th>Driver Name</th>
                    <th>Leave Details</th>
                    <th>Dates</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map(l => (
                    <tr key={l._id}>
                      <td>{l._id.substring(0, 6).toUpperCase()}</td>
                      <td>{l.driver?.name}</td>
                      <td>
                        <div style={{fontWeight: '600'}}>{l.leaveType}</div>
                        <div style={{fontSize: '11px', color: '#64748b', marginTop: '2px'}}>{l.reason}</div>
                      </td>
                      <td>{formatDate(l.startDate)} - {formatDate(l.endDate)}</td>
                      <td><span className={`adm-badge adm-badge--${l.status.toLowerCase()}`}>{l.status}</span></td>
                      <td>
                        {l.status === 'Pending' ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="adm-action-btn adm-btn-approve" onClick={() => handleApproveLeave(l._id)}>Approve</button>
                            <button className="adm-action-btn adm-btn-reject" onClick={() => handleRejectLeave(l._id)}>Reject</button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leaves.length === 0 && <tr><td colSpan="6">No leave requests found.</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Active Route Assignments */}
            <div className="adm-table-card">
              <div className="adm-table-header">
                <h2>📍 Active Route Assignments</h2>
              </div>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Driver Info</th>
                    <th>Assigned Bus No.</th>
                    <th>Route & Destination</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {routeAssignments.map(ra => (
                    <tr key={ra._id}>
                      <td>{ra.driver?.name}</td>
                      <td>{ra.bus?.plateNumber}</td>
                      <td>{ra.routeName} - {ra.destination}</td>
                      <td>
                        <span className={`adm-badge adm-badge--${ra.status.toLowerCase()}`}>{ra.status}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button type="button" className="adm-action-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => handleEditAssignment(ra)}>✏️</button>
                          <button type="button" className="adm-action-link" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0 }} onClick={() => handleCancelAssignment(ra._id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {routeAssignments.length === 0 && <tr><td colSpan="5">No active route assignments.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="adm-right">
            {/* Register/Update Driver Component */}
            <div className="adm-form-card">
              <h2>{isEditing ? '✏️ Update Driver' : '👤 Register New Driver'}</h2>
              <p className="adm-form-sub">{isEditing ? 'Modify driver details' : 'Add a new driver to the system'}</p>
              <form onSubmit={handleSubmit} className="adm-form">
                <div className="adm-form-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="e.g. John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="adm-form-group">
                  <label>License No.</label>
                  <input type="text" placeholder="e.g. DL-XXXXXX" value={formData.licenseNumber} onChange={e => setFormData({...formData, licenseNumber: e.target.value})} />
                </div>
                <div className="adm-form-group">
                  <label>Phone Number</label>
                  <input type="text" placeholder="+1..." value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} />
                </div>
                
                {isEditing && (
                  <div className="adm-form-group">
                    <label>Operational Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="Active">Active Duty</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                )}
                
                <button type="submit" className="adm-btn adm-btn-primary" style={{ width: '100%', marginBottom: '8px' }}>
                  {isEditing ? 'Update Driver' : 'Add Driver'}
                </button>
                {isEditing && (
                  <button type="button" className="adm-btn" style={{ width: '100%', background: 'transparent', border: '1px solid #e2e8f0' }} onClick={() => { setIsEditing(null); setFormData(initialForm); }}>
                    Cancel
                  </button>
                )}
              </form>
            </div>

            {/* Quick Assign/Update Route */}
            <div className="adm-form-card">
              <h2>{isEditingAssignment ? '✏️ Update Route Assignment' : '🔄 Quick Assign Route'}</h2>
              <p className="adm-form-sub">{isEditingAssignment ? 'Modify existing assignment' : 'Assign an available driver to a bus'}</p>
              <form onSubmit={handleAssignRoute} className="adm-form">
                <div className="adm-form-group">
                  <label>Select Driver</label>
                  <select value={assignment.driver} onChange={e => setAssignment({...assignment, driver: e.target.value})}>
                    <option value="">Choose driver...</option>
                    {drivers.map(d => (
                      <option key={d._id} value={d._id} disabled={d.status === 'Suspended'}>
                        {d.name} {d.status === 'Suspended' ? `(${d.status})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="adm-form-group">
                  <label>Select Bus</label>
                  <select value={assignment.bus} onChange={e => setAssignment({...assignment, bus: e.target.value})}>
                    <option value="">Choose available bus...</option>
                    {buses.map(b => {
                      const isUnavailable = b.status === 'Retired'
                      const isMaintenance = b.status === 'Under Maintenance'
                      return (
                        <option key={b._id} value={b._id} disabled={isUnavailable}>
                          {b.plateNumber || 'No Plate'} 
                          {isMaintenance ? ' (In Maintenance)' : ''} 
                          {isUnavailable ? ' (Retired)' : ''}
                          {b.brand ? ` — ${b.brand}` : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>
                <div className="adm-form-group">
                  <label>Route Assignment Details</label>
                  <select 
                    value={assignment.routeName ? `${assignment.routeName}|${assignment.destination}` : ''}
                    onChange={(e) => {
                      if(!e.target.value) {
                        setAssignment({...assignment, routeName: '', destination: ''});
                        return;
                      }
                      const [rName, dest] = e.target.value.split('|');
                      setAssignment({...assignment, routeName: rName, destination: dest});
                    }}
                    style={{marginBottom: '8px'}}
                  >
                    <option value="">Select pre-defined route...</option>
                    {availableRoutes.map(r => (
                      <option key={r._id} value={`${r.routeName}|${r.arrivalLocation}`}>
                        {r.routeName} (To: {r.arrivalLocation}) - {r.departureTime}
                      </option>
                    ))}
                  </select>
                  
                  {/* Read-only feedback for what got selected */}
                  {(assignment.routeName || assignment.destination) && (
                    <div style={{display: 'flex', gap: '8px', fontSize: '13px', color: '#64748b'}}>
                      <span style={{background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', flex: 1}}>
                        <b>Route:</b> {assignment.routeName}
                      </span>
                      <span style={{background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', flex: 1}}>
                        <b>Destination:</b> {assignment.destination}
                      </span>
                    </div>
                  )}
                </div>

                {isEditingAssignment && (
                  <div className="adm-form-group">
                    <label>Assignment Status</label>
                    <select value={assignment.status} onChange={e => setAssignment({...assignment, status: e.target.value})}>
                      <option value="Scheduled">Scheduled</option>
                      <option value="En Route">En Route</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                )}

                <button type="submit" className="adm-btn adm-btn-primary" style={{ width: '100%', marginBottom: '8px' }}>
                  {isEditingAssignment ? 'Update Assignment' : 'Assign Route'}
                </button>
                {isEditingAssignment && (
                  <button type="button" className="adm-btn" style={{ width: '100%', background: 'transparent', border: '1px solid #e2e8f0' }} onClick={() => { setIsEditingAssignment(null); setAssignment(initialAssignment); }}>
                    Cancel
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Driver Route & Bus Details Modal */}
        {selectedDriverForDetails && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px rgba(0,0,0,0.15)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#2c3e50' }}>📋 Assignment Details</h2>
                <button onClick={() => setSelectedDriverForDetails(null)} style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#999'
                }}>✕</button>
              </div>
              <DriverRouteAssignmentCard driver={selectedDriverForDetails} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default DriverManagement
