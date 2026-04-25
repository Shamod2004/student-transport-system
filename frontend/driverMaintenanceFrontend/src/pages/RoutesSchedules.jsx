import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import * as driverService from '../services/driverService'
import * as busService from '../services/busService'
import * as routeAssignmentService from '../services/routeAssignmentService'
import Sidebar from '../components/Sidebar'
import './RoutesSchedules.css'

const ROUTE_BACKEND_API_URL = import.meta.env.VITE_ROUTE_BACKEND_API_URL || 'http://localhost:5001/api'

const RoutesSchedules = () => {
  const [drivers, setDrivers] = useState([])
  const [buses, setBuses] = useState([])
  const [routeAssignments, setRouteAssignments] = useState([])
  const [availableRoutes, setAvailableRoutes] = useState([])

  // Form State
  const initialFormState = {
    routeName: '',
    destination: '',
    driver: '',
    bus: '',
    startTime: '',
    endTime: '',
    status: 'Scheduled',
    frequency: 'Daily'
  }
  const [formData, setFormData] = useState(initialFormState)
  const [isEditing, setIsEditing] = useState(null) // ID of assignment being edited

  const getRouteCatalog = async () => {
    const response = await fetch(`${ROUTE_BACKEND_API_URL}/routes?limit=100`)
    if (!response.ok) {
      throw new Error('Failed to load route catalog')
    }
    return response.json()
  }

  const loadData = async () => {
    try {
      const [dRes, bRes, raRes, rRes] = await Promise.all([
        driverService.getAllDrivers(),
        busService.getAllBuses(),
        routeAssignmentService.getAllRouteAssignments(),
        getRouteCatalog().catch(() => ({ data: { routes: [] } }))
      ])
      setDrivers(dRes.data)
      setBuses(bRes.data)
      setRouteAssignments(raRes.data)

      const routeList = rRes?.data?.routes || rRes?.data?.data?.routes || []
      const normalizedRoutes = routeList.map((route) => ({
        _id: route._id || `${route.routeName || 'route'}-${route.arrivalLocation || route.destination || 'dest'}`,
        routeName: route.routeName || route.name || '',
        destination: route.arrivalLocation || route.destination || route.to || ''
      }))
      setAvailableRoutes(normalizedRoutes.filter((route) => route.routeName && route.destination))
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Derived Stats & Busy Checks
  const activeRoutes = new Set(routeAssignments.map(ra => ra.routeName)).size
  const scheduledTrips = routeAssignments.length
  
  // Create sets of busy drivers/buses for the dropdowns
  const busyDriverIds = new Set(
    routeAssignments
      .filter(ra => ra.status === 'Scheduled' || ra.status === 'En Route')
      .map(ra => ra.driver?._id)
  )
  const busyBusIds = new Set(
    routeAssignments
      .filter(ra => ra.status === 'Scheduled' || ra.status === 'En Route')
      .map(ra => ra.bus?._id)
  )

  const availableDrivers = drivers.filter(d => d.status === 'Active' && !busyDriverIds.has(d._id)).length
  const availableBuses = buses.filter(b => b.status === 'Active' && !busyBusIds.has(b._id)).length

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.routeName || !formData.destination || !formData.driver || !formData.bus || !formData.startTime || !formData.endTime) {
      toast.error('Please fill all required fields.')
      return
    }

    if (formData.endTime <= formData.startTime) {
      toast.error('End time must be later than departure time.')
      return
    }

    try {
      if (isEditing) {
        await routeAssignmentService.updateRouteAssignment(isEditing, formData)
        toast.success('Route assignment updated successfully.')
      } else {
        await routeAssignmentService.createRouteAssignment(formData)
        toast.success('Route assignment created successfully.')
      }
      setFormData(initialFormState)
      setIsEditing(null)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    }
  }

  const handleEdit = (ra) => {
    setIsEditing(ra._id)
    setFormData({
      routeName: ra.routeName,
      destination: ra.destination,
      driver: ra.driver?._id || '',
      bus: ra.bus?._id || '',
      startTime: ra.startTime,
      endTime: ra.endTime || ra.startTime,
      status: ra.status,
      frequency: ra.frequency || 'Daily'
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this route assignment?')) {
      try {
        await routeAssignmentService.deleteRouteAssignment(id)
        toast.success('Route assignment deleted.')
        loadData()
      } catch (err) {
        toast.error(err.response?.data?.message || err.message)
      }
    }
  }

  return (
    <div className="rs-layout">
      <Sidebar />
      <main className="rs-main">
        <header className="rs-header">
          <div>
            <h1 className="rs-title">Routes & Schedules</h1>
            <p className="rs-subtitle">Manage bus routes, assign available drivers, and monitor schedules.</p>
          </div>
          <button className="rs-btn-export">📥 Export Schedule</button>
        </header>

        <div className="rs-content">
          <div className="rs-left">
            {/* Stats Cards */}
            <div className="rs-stats">
              <div className="rs-stat-card">
                <span className="rs-stat-label">Active Routes</span>
                <span className="rs-stat-icon">📍</span>
                <div className="rs-stat-value">{activeRoutes}</div>
              </div>
              <div className="rs-stat-card">
                <span className="rs-stat-label">Scheduled Trips</span>
                <span className="rs-stat-icon">📅</span>
                <div className="rs-stat-value">{scheduledTrips}</div>
              </div>
              <div className="rs-stat-card">
                <span className="rs-stat-label">Available Drivers</span>
                <span className="rs-stat-icon">👤</span>
                <div className="rs-stat-value">{availableDrivers}</div>
              </div>
              <div className="rs-stat-card">
                <span className="rs-stat-label">Available Buses</span>
                <span className="rs-stat-icon">🚌</span>
                <div className="rs-stat-value">{availableBuses}</div>
              </div>
            </div>

            {/* Main Table */}
            <div className="rs-table-container">
              <div className="rs-table-header">
                <h2>Current Route Assignments</h2>
                <button className="rs-btn-filter">▽ Filter</button>
              </div>
              <table className="rs-table">
                <thead>
                  <tr>
                    <th>ROUTE & DESTINATION</th>
                    <th>DRIVER INFO</th>
                    <th>BUS NO</th>
                    <th>SCHEDULE</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {routeAssignments.map((ra) => (
                    <tr key={ra._id}>
                      <td>
                        <div className="rs-route-name">{ra.routeName}</div>
                        <div className="rs-route-dest">⦾ {ra.destination}</div>
                      </td>
                      <td>
                        <div className="rs-driver-info">
                          <div className="rs-avatar">
                            {ra.driver?.name?.charAt(0) || 'D'}
                          </div>
                          <div>
                            <div className="rs-driver-name">{ra.driver?.name}</div>
                            <div className="rs-driver-id">ID: {ra.driver?.licenseNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="rs-bus-reg">{ra.bus?.plateNumber}</div>
                        <div className="rs-bus-brand">{ra.bus?.brand}</div>
                      </td>
                      <td>
                        <div className="rs-time">{ra.startTime}</div>
                        <div className="rs-freq">{ra.frequency}</div>
                      </td>
                      <td>
                        <span className={`rs-status-badge rs-status--${ra.status.replace(/\s+/g, '').toLowerCase()}`}>
                          {ra.status}
                        </span>
                      </td>
                      <td>
                        <div className="rs-actions">
                          <button className="rs-action-btn" onClick={() => handleEdit(ra)}>✏️</button>
                          <button className="rs-action-btn rs-action-btn--delete" onClick={() => handleDelete(ra._id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {routeAssignments.length === 0 && (
                    <tr>
                      <td colSpan="6" className="rs-empty">No route assignments found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rs-right">
            {/* Form */}
            <div className="rs-form-container">
              <h2 className="rs-form-title">
                <span className="rs-form-icon">📍</span> 
                {isEditing ? 'Edit Route & Schedule' : 'Assign Route & Schedule'}
              </h2>
              <p className="rs-form-desc">
                {isEditing ? 'Update the details for the selected route assignment.' : 'Assign an available driver and bus to a specific route.'}
              </p>

              <form className="rs-form" onSubmit={handleSubmit}>
                <div className="rs-form-group" style={{ marginBottom: '16px' }}>
                  <label>Route & Destination</label>
                  <select
                    value={formData.routeName ? `${formData.routeName}|${formData.destination}` : ''}
                    onChange={(e) => {
                      if(!e.target.value) {
                        setFormData({ ...formData, routeName: '', destination: '' });
                        return;
                      }
                      const [rName, dest] = e.target.value.split('|');
                      setFormData({ ...formData, routeName: rName, destination: dest });
                    }}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', marginBottom: '8px' }}
                  >
                    <option value="">Select a registered route...</option>
                    {availableRoutes.map(r => (
                      <option key={r._id} value={`${r.routeName}|${r.destination}`}>
                        {r.routeName} ➔ {r.destination}
                      </option>
                    ))}
                  </select>
                  
                  {/* Read-only feedback for selected route */}
                  {(formData.routeName || formData.destination) && (
                    <div style={{display: 'flex', gap: '8px', fontSize: '13px', color: '#64748b'}}>
                      <span style={{background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', flex: 1}}>
                        <b>Route:</b> {formData.routeName}
                      </span>
                      <span style={{background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', flex: 1}}>
                        <b>Destination:</b> {formData.destination}
                      </span>
                    </div>
                  )}
                </div>

                <div className="rs-form-group">
                  <div className="rs-label-flex">
                    <label>Assign Driver</label>
                    <span className="rs-hint-badge">Available Only</span>
                  </div>
                  <select
                    value={formData.driver}
                    onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                  >
                    <option value="">Select driver...</option>
                    {drivers.map(d => {
                      const isBusy = busyDriverIds.has(d._id) && d._id !== formData.driver
                      const isSuspended = d.status === 'Suspended'
                      return (
                        <option key={d._id} value={d._id} disabled={isSuspended || isBusy}>
                          {d.name} {isSuspended ? ` (${d.status})` : ''} {isBusy ? ' (Already Busy)' : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div className="rs-form-group">
                  <div className="rs-label-flex">
                    <label>Assign Bus</label>
                    <span className="rs-hint-badge">Available Only</span>
                  </div>
                  <select
                    value={formData.bus}
                    onChange={(e) => setFormData({ ...formData, bus: e.target.value })}
                  >
                    <option value="">Select bus...</option>
                    {buses.map(b => {
                      const isBusy = busyBusIds.has(b._id) && b._id !== formData.bus
                      const isRetired = b.status === 'Retired'
                      const isMaintenance = b.status === 'Under Maintenance'
                      
                      return (
                        <option key={b._id} value={b._id} disabled={isRetired || isBusy}>
                          {b.plateNumber} ({b.brand}) 
                          {isRetired ? ' (Retired)' : ''} 
                          {isMaintenance ? ' (Maintenance)' : ''} 
                          {isBusy ? ' (Already Routed)' : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div className="rs-form-row">
                  <div className="rs-form-group">
                    <label>Departure Time</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div className="rs-form-group">
                    <label>Arrival Time</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="rs-form-row">
                  <div className="rs-form-group">
                    <label>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="En Route">En Route</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="rs-submit-btn">
                  {isEditing ? '✔️ Update Assignment' : '+ Create Assignment'}
                </button>
                
                {isEditing && (
                  <button 
                    type="button" 
                    className="rs-cancel-btn"
                    onClick={() => {
                      setIsEditing(null);
                      setFormData(initialFormState);
                    }}
                  >
                    Cancel Editing
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default RoutesSchedules
