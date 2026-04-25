import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import api from '../services/api'
import Sidebar from '../components/Sidebar'
import './PreTripInspections.css'

const initialAssign = {
  driver: '',
  bus: '',
  routeName: 'City Center Express',
  destination: 'Main Campus',
  startTime: '08:00',
  endTime: '16:00',
  status: 'Scheduled'
}

const PreTripInspections = () => {
  const [data, setData] = useState({ stats: {}, reports: [] })
  const [filter, setFilter] = useState('All')
  const [viewingReport, setViewingReport] = useState(null)

  // Quick Assign Panel
  const [showAssignPanel, setShowAssignPanel] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [drivers, setDrivers] = useState([])
  const [buses, setBuses] = useState([])
  const [assignForm, setAssignForm] = useState(initialAssign)
  const panelRef = useRef(null)

  const loadData = async () => {
    try {
      const res = await api.get('/inspections/daily-operations')
      setData({
        stats: res.data.stats || {},
        reports: res.data.reports || []
      })
    } catch (err) {
      console.error('Error loading daily operations:', err)
    }
  }

  const loadResources = async () => {
    try {
      const [driversRes, busesRes] = await Promise.all([
        api.get('/drivers'),
        api.get('/buses')
      ])
      setDrivers(driversRes.data)
      setBuses(busesRes.data)
    } catch (err) {
      console.error('Error loading resources:', err)
    }
  }

  const openAssignPanel = () => {
    setEditingAssignment(null)
    setAssignForm(initialAssign)
    setShowAssignPanel(true)
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  const handleEditClick = (report) => {
    setEditingAssignment(report._id)
    setAssignForm({
      driver: report.driver?._id || '',
      bus: report.bus?._id || '',
      routeName: report.route || '',
      destination: report.destination || '',
      startTime: report.startTime || '08:00',
      endTime: '16:00',
      status: 'Scheduled'
    })
    setShowAssignPanel(true)
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  const handleAssignSubmit = async (e) => {
    e.preventDefault()
    if (!assignForm.driver || !assignForm.bus) {
      return toast.error('Please select both driver and bus.')
    }

    try {
      if (editingAssignment) {
        await api.put(`/route-assignments/${editingAssignment}`, assignForm)
        toast.success('Assignment updated successfully')
      } else {
        await api.post('/route-assignments', {
          ...assignForm,
          assignedDate: new Date()
        })
        toast.success('Driver assigned successfully')
      }

      setShowAssignPanel(false)
      setEditingAssignment(null)
      setAssignForm(initialAssign)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    }
  }

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Delete this route assignment?')) return
    try {
      await api.delete(`/route-assignments/${id}`)
      toast.success('Assignment deleted')
      loadData()
    } catch (err) {
      toast.error('Failed to delete assignment')
    }
  }

  const handleDeleteInspection = async (id) => {
    if (!window.confirm('Remove this inspection report?')) return
    try {
      await api.delete(`/inspections/${id}`)
      toast.success('Inspection removed')
      loadData()
    } catch (err) {
      toast.error('Failed to remove report')
    }
  }

  const handleViewReport = async (reportId) => {
    try {
      const res = await api.get(`/inspections/${reportId}`)
      setViewingReport(res.data)
    } catch (err) {
      toast.error('Could not load report details')
    }
  }

  useEffect(() => {
    loadData()
    loadResources()
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [])

  const filteredReports = data.reports.filter(r =>
    filter === 'All' || r.status === filter
  )

  return (
    <div className="pti-layout">
      <Sidebar />
      <main className="pti-main">

        {/* Header */}
        <header className="pti-header">
          <div className="pti-header__left">
            <span className="pti-breadcrumb">Daily Operations</span>
            <h1 className="pti-title">Daily Roster &amp; Inspections</h1>
            <p className="pti-subtitle">Manage daily driver assignments and vehicle pre-trip readiness.</p>
          </div>
          <div className="pti-header__right">
            <div className="pti-search-wrapper">
              <span className="pti-search-icon">🔍</span>
              <input type="text" placeholder="Search roster" className="pti-search-input" />
            </div>
            <button
              className="pti-btn-primary"
              onClick={openAssignPanel}
            >
              {showAssignPanel && !editingAssignment ? '✕ Close' : '+ Assign Driver'}
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="pti-stats-grid">
          <div className="pti-stat-card">
            <div className="pti-stat-top">
              <div><p className="pti-stat-label">Scheduled Today</p><h2 className="pti-stat-val">{data.stats.scheduledToday ?? 0}</h2></div>
              <span className="pti-stat-icon pti-icon-blue">📅</span>
            </div>
            <p className="pti-stat-footer">Active route assignments</p>
          </div>
          <div className="pti-stat-card">
            <div className="pti-stat-top">
              <div><p className="pti-stat-label">Pending Check-in</p><h2 className="pti-stat-val">{data.stats.pending ?? 0}</h2></div>
              <span className="pti-stat-icon pti-icon-orange">🕒</span>
            </div>
            <p className="pti-stat-footer">Awaiting driver report</p>
          </div>
          <div className="pti-stat-card">
            <div className="pti-stat-top">
              <div><p className="pti-stat-label">Fit to Duty</p><h2 className="pti-stat-val">{data.stats.fitToDuty ?? 0}</h2></div>
              <span className="pti-stat-icon pti-icon-green">✅</span>
            </div>
            <p className="pti-stat-footer">Ready for departure</p>
          </div>
          <div className="pti-stat-card">
            <div className="pti-stat-top">
              <div><p className="pti-stat-label">Issues Reported</p><h2 className="pti-stat-val">{data.stats.issues ?? 0}</h2></div>
              <span className="pti-stat-icon pti-icon-red">⚠️</span>
            </div>
            <p className="pti-stat-footer">Maintenance required</p>
          </div>
        </div>

        {/* ── Quick Assign Panel ── */}
        {showAssignPanel && (
          <div className="pti-assign-panel" ref={panelRef}>
            <div className="pti-assign-panel__header">
              <div>
                <span className="pti-assign-panel__icon">🔄</span>
                <div>
                  <h3>{editingAssignment ? '✏️ Update Route Assignment' : 'Quick Assign Route'}</h3>
                  <p>{editingAssignment ? 'Modify existing assignment' : 'Assign an available driver to a bus'}</p>
                </div>
              </div>
              <button className="pti-panel-close" onClick={() => { setShowAssignPanel(false); setEditingAssignment(null); setAssignForm(initialAssign) }}>✕</button>
            </div>

            <form onSubmit={handleAssignSubmit} className="pti-assign-panel__body">
              <div className="pti-panel-grid">

                {/* Select Driver */}
                <div className="pti-panel-field">
                  <label>Select Driver</label>
                  <select value={assignForm.driver} onChange={e => setAssignForm({ ...assignForm, driver: e.target.value })} required>
                    <option value="">Choose driver...</option>
                    {drivers.map(d => (
                      <option key={d._id} value={d._id} disabled={d.status === 'Suspended'}>
                        {d.name} {d.status === 'Suspended' ? '(Suspended)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Bus */}
                <div className="pti-panel-field">
                  <label>Select Bus</label>
                  <select value={assignForm.bus} onChange={e => setAssignForm({ ...assignForm, bus: e.target.value })} required>
                    <option value="">Choose available bus...</option>
                    {buses.map(b => {
                      const isRetired = b.status === 'Retired'
                      const isMaint = b.status === 'Under Maintenance'
                      return (
                        <option key={b._id} value={b._id} disabled={isRetired}>
                          {b.plateNumber || 'No Plate'}
                          {isMaint ? ' (In Maintenance)' : ''}
                          {isRetired ? ' (Retired)' : ''}
                          {b.brand ? ` — ${b.brand}` : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>

                {/* Route Details */}
                <div className="pti-panel-field">
                  <label>Route Name</label>
                  <input
                    type="text"
                    placeholder="e.g. City Center Express"
                    value={assignForm.routeName}
                    onChange={e => setAssignForm({ ...assignForm, routeName: e.target.value })}
                  />
                </div>

                <div className="pti-panel-field">
                  <label>Destination</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Campus"
                    value={assignForm.destination}
                    onChange={e => setAssignForm({ ...assignForm, destination: e.target.value })}
                  />
                </div>

                {/* Times */}
                <div className="pti-panel-field">
                  <label>Start Time</label>
                  <input type="time" value={assignForm.startTime} onChange={e => setAssignForm({ ...assignForm, startTime: e.target.value })} />
                </div>

                <div className="pti-panel-field">
                  <label>End Time</label>
                  <input type="time" value={assignForm.endTime} onChange={e => setAssignForm({ ...assignForm, endTime: e.target.value })} />
                </div>

              </div>

              {/* Status when editing */}
              {editingAssignment && (
                <div className="pti-panel-field" style={{ marginTop: '8px' }}>
                  <label>Assignment Status</label>
                  <select value={assignForm.status} onChange={e => setAssignForm({ ...assignForm, status: e.target.value })}>
                    <option value="Scheduled">Scheduled</option>
                    <option value="En Route">En Route</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              <div className="pti-panel-actions">
                <button type="button" className="pti-btn-cancel" onClick={() => { setShowAssignPanel(false); setEditingAssignment(null); setAssignForm(initialAssign) }}>
                  Cancel
                </button>
                <button type="submit" className="pti-btn-primary">
                  {editingAssignment ? 'Save Changes' : 'Assign Route'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table Section */}
        <div className="pti-table-card">
          <div className="pti-table-header">
            <div className="pti-table-title"><span className="pti-table-icon">📋</span> Today's Daily Roster</div>
            <div className="pti-table-actions">
              <select className="pti-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="All">Status: All</option>
                <option value="Fit for Duty">Fit for Duty</option>
                <option value="Issue Reported">Issue Reported</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="pti-table-wrapper">
            <table className="pti-table">
              <thead>
                <tr>
                  <th>Driver Details</th>
                  <th>Assigned Vehicle</th>
                  <th>Route Info</th>
                  <th>Time / Check-In</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report._id}>
                    <td>
                      <div className="pti-driver-cell">
                        <div className="pti-avatar">
                          {report.driver?.avatar ? <img src={report.driver.avatar} alt="" /> : <span>{report.driver?.name?.charAt(0)}</span>}
                        </div>
                        <div><p className="pti-driver-name">{report.driver?.name}</p><p className="pti-driver-id">{report.driver?.driverId}</p></div>
                      </div>
                    </td>
                    <td><p className="pti-bus-plate">{report.bus?.plateNumber}</p><p className="pti-bus-model">{report.bus?.brand}</p></td>
                    <td><div className="pti-route-cell"><p className="pti-route-name">{report.route}</p><p className="pti-route-dest">to {report.destination}</p></div></td>
                    <td>
                      <p className="pti-checkin-time">{report.startTime}</p>
                      {report.checkInTime && <p className="pti-actual-checkin">Checked: {new Date(report.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
                    </td>
                    <td><span className={`pti-status-badge pti-status-${report.status.toLowerCase().replace(/ /g, '-')}`}>{report.status}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="pti-actions-flex">
                        {report.inspectionId ? (
                          <>
                            <button className="pti-btn-view" onClick={() => handleViewReport(report.inspectionId)}>View Report</button>
                            <button className="pti-btn-delete" onClick={() => handleDeleteInspection(report.inspectionId)}>🗑️</button>
                          </>
                        ) : (
                          <>
                            <button className="pti-btn-view" onClick={() => handleEditClick(report)}>Edit Assignment</button>
                            <button className="pti-btn-delete" onClick={() => handleDeleteAssignment(report._id)}>🛑</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredReports.length === 0 && <div className="pti-empty">No entries found.</div>}
          </div>
        </div>

        {/* Inspection Details Modal */}
        {viewingReport && (
          <div className="pti-modal-overlay" onClick={() => setViewingReport(null)}>
            <div className="pti-modal" onClick={e => e.stopPropagation()}>
              <div className="pti-modal-header">
                <h3>Pre-Trip Inspection Details</h3>
                <button className="pti-modal-close" onClick={() => setViewingReport(null)}>✕</button>
              </div>
              <div className="pti-modal-body">
                <div className="pti-modal-grid">
                  <div className="pti-modal-info"><label>Driver</label><p>{viewingReport.driver?.name}</p></div>
                  <div className="pti-modal-info"><label>Vehicle</label><p>{viewingReport.bus?.plateNumber}</p></div>
                  <div className="pti-modal-info"><label>Mileage</label><p>{viewingReport.currentMileage} km</p></div>
                  <div className="pti-modal-info"><label>Fuel Level</label><p>{viewingReport.fuelLevel}</p></div>
                </div>
                <h4 className="pti-modal-sub">Checklist Conditions</h4>
                <div className="pti-checklist">
                  {Object.entries(viewingReport.conditions || {}).map(([key, val]) => (
                    <div key={key} className="pti-check-item">
                      <span className="pti-check-label">{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
                      <span className={`pti-check-badge pti-check-${val.toLowerCase()}`}>{val}</span>
                    </div>
                  ))}
                </div>
                <div className="pti-modal-notes"><label>Additional Notes</label><p>{viewingReport.additionalNotes || 'No notes provided.'}</p></div>
              </div>
              <div className="pti-modal-footer">
                <span className={`pti-result-banner pti-res-${viewingReport.result?.toLowerCase().replace(/ /g, '-')}`}>Result: {viewingReport.result}</span>
                <button className="pti-btn-primary" onClick={() => window.print()}>Print Report</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

export default PreTripInspections
