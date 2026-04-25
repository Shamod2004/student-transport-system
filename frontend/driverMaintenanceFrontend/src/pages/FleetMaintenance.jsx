import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import * as busService from '../services/busService'
import * as maintenanceService from '../services/maintenanceService'
import { formatDate } from '../utils/formatDate'
import Sidebar from '../components/Sidebar'
import './FleetMaintenance.css'

const FleetMaintenance = () => {
  // State
  const [buses, setBuses] = useState([])
  const [tickets, setTickets] = useState([])
  const [reports, setReports] = useState([])

  // Form State
  const initialForm = {
    bus: '',
    serviceType: 'Engine Oil Change',
    currentMileage: '',
    nextServiceAt: '',
    priority: 'Normal',
    notes: '',
    status: 'Pending'
  }
  const [formData, setFormData] = useState(initialForm)
  const [isEditing, setIsEditing] = useState(null)

  // Condition Report State
  const [formMode, setFormMode] = useState('Service') // 'Service' or 'Report'
  const initialReportForm = { bus: '', issueDetails: '', severity: 'Medium', vehicleStatus: 'Grounded' }
  const [reportFormData, setReportFormData] = useState(initialReportForm)
  const [isEditingReport, setIsEditingReport] = useState(null)
  const [severityFilter, setSeverityFilter] = useState('All')

  const loadData = async () => {
    try {
      const [busRes, ticketRes, reportRes] = await Promise.all([
        busService.getAllBuses(),
        maintenanceService.getAllTickets(),
        maintenanceService.getAllReports()
      ])
      setBuses(busRes.data)
      setTickets(ticketRes.data)
      setReports(reportRes.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto-fill current mileage when bus is selected
  useEffect(() => {
    if (formData.bus) {
      const selectedBus = buses.find(b => b._id === formData.bus)
      if (selectedBus) {
        setFormData(prev => ({ ...prev, currentMileage: selectedBus.mileage }))
      }
    }
  }, [formData.bus, buses])

  // Stats
  const totalBuses = buses.length
  const activeFleet = buses.filter(b => b.status === 'Active').length
  const inMaintenance = buses.filter(b => b.status === 'Under Maintenance').length
  const criticalIssues = reports.filter(r => 
    (r.severity === 'Critical' || r.severity === 'High') && 
    r.vehicleStatus !== 'Available'
  ).length

  const activeFleetPercentage = totalBuses ? Math.round((activeFleet / totalBuses) * 100) : 0

  // Handlers
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.bus || !formData.serviceType || !formData.nextServiceAt) {
      toast.error('Bus, Service Type, and Next Service target are required.')
      return
    }

    try {
      const payload = {
        ...formData,
        currentMileage: Number(formData.currentMileage) || 0,
        nextServiceAt: Number(formData.nextServiceAt) || 0,
      }

      if (isEditing) {
        await maintenanceService.updateTicket(isEditing, payload)
        toast.success('Service ticket updated.')
      } else {
        await maintenanceService.createTicket(payload)
        toast.success('Service ticket created successfully.')
      }
      setFormData(initialForm)
      setIsEditing(null)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    }
  }

  const handleEdit = (ticket) => {
    setIsEditing(ticket._id)
    setFormData({
      bus: ticket.bus?._id || '',
      serviceType: ticket.serviceType,
      currentMileage: ticket.currentMileage,
      nextServiceAt: ticket.nextServiceAt,
      priority: ticket.priority,
      notes: ticket.notes || '',
      status: ticket.status
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this service ticket?')) {
      try {
        await maintenanceService.deleteTicket(id)
        toast.success('Ticket deleted.')
        loadData()
      } catch (err) {
        toast.error(err.response?.data?.message || err.message)
      }
    }
  }

  // Report Handlers
  const handleReportSubmit = async (e) => {
    e.preventDefault()
    if (!reportFormData.bus || !reportFormData.issueDetails) {
      toast.error('Bus and Issue Details are required.')
      return
    }

    try {
      if (isEditingReport) {
        await maintenanceService.updateReport(isEditingReport, reportFormData)
        toast.success('Condition report updated.')
      } else {
        await maintenanceService.createReport(reportFormData)
        toast.success('Condition report submitted.')

        // Auto-update bus status if grounded
        if (reportFormData.vehicleStatus === 'Grounded') {
          await busService.updateBus(reportFormData.bus, { status: 'Under Maintenance' })
        }
      }
      setReportFormData(initialReportForm)
      setIsEditingReport(null)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    }
  }

  const handleEditReport = (report) => {
    setFormMode('Report')
    setIsEditingReport(report._id)
    setReportFormData({
      bus: report.bus?._id || '',
      issueDetails: report.issueDetails || '',
      severity: report.severity || 'Medium',
      vehicleStatus: report.vehicleStatus || report.status || 'Available'
    })
    document.querySelector('.fm-form-panel').scrollIntoView({ behavior: 'smooth' })
  }

  const handleDeleteReport = async (id) => {
    if (window.confirm('Remove this condition report?')) {
      try {
        await maintenanceService.deleteReport(id)
        toast.success('Report removed.')
        loadData()
      } catch (err) {
        toast.error('Failed to remove report.')
      }
    }
  }

  const filteredReports = reports.filter(r =>
    severityFilter === 'All' || r.severity === severityFilter
  )

  return (
    <div className="fm-layout">
      <Sidebar />
      <main className="fm-main">
        <header className="fm-header-top">
          <h1 className="fm-title-top">Fleet & Maintenance Hub</h1>
          <div className="fm-header-right">
            <div className="fm-search-bar">
              <span className="fm-search-icon">🔍</span>
              <input type="text" placeholder="Search bus, plate or report" />
            </div>
            {/* <div className="fm-bell-wrapper" style={{ position: 'relative' }}>
              <span className="fm-bell">🔔</span>
              {criticalIssues > 0 && <span className="fm-bell-badge"></span>}
            </div>
            <div className="fm-avatar"><img src="https://i.pravatar.cc/100?img=11" alt="User" /></div> */}
          </div>
        </header>

        <div className="fm-content-grid">
          <div className="fm-left-col">

            {/* Headers Area */}
            <div className="fm-section-header">
              <div>
                <span className="fm-eyebrow">Fleet overview</span>
              </div>
              <div className="fm-header-btns">
                <button className="fm-btn-outline">Export Report</button>
                <button className="fm-btn-primary" onClick={() => { setFormMode('Report'); document.querySelector('.fm-form-panel').scrollIntoView({ behavior: 'smooth' }); }}>+ New Condition Report</button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="fm-stats-grid">
              <div className="fm-stat-card">
                <div className="fm-stat-top">
                  <span className="fm-stat-label">Total Buses</span>
                  <span className="fm-stat-icon">🚌</span>
                </div>
                <div className="fm-stat-val">{totalBuses}</div>
                <div className="fm-stat-sub">{tickets.length} service tickets open</div>
              </div>
              <div className="fm-stat-card">
                <div className="fm-stat-top">
                  <span className="fm-stat-label">Active Fleet</span>
                  <span className="fm-stat-icon fm-text-green">✓</span>
                </div>
                <div className="fm-stat-val">{activeFleet}</div>
                <div className="fm-stat-sub">{activeFleetPercentage}% currently available</div>
              </div>
              <div className="fm-stat-card">
                <div className="fm-stat-top">
                  <span className="fm-stat-label">In Maintenance</span>
                  <span className="fm-stat-icon fm-text-orange">🔧</span>
                </div>
                <div className="fm-stat-val">{inMaintenance}</div>
                <div className="fm-stat-sub">{tickets.filter(t => t.priority === 'Urgent').length} urgent tickets</div>
              </div>
              <div className="fm-stat-card">
                <div className="fm-stat-top">
                  <span className="fm-stat-label">Critical Issues</span>
                  <span className="fm-stat-icon fm-text-red">⚠️</span>
                </div>
                <div className="fm-stat-val">{criticalIssues}</div>
                <div className="fm-stat-sub">Immediate action required</div>
              </div>
            </div>

            {/* Upcoming Services Section */}
            <div className="fm-card">
              <div className="fm-card-header">
                <h3>Upcoming Services (Mileage)</h3>
                <button className="fm-btn-outline fm-btn-sm">View All</button>
              </div>
              <div className="fm-services-grid">
                {tickets.slice(0, 2).map((ticket) => {
                  const remaining = ticket.nextServiceAt - ticket.currentMileage
                  const progress = Math.min(100, Math.max(0, (ticket.currentMileage / ticket.nextServiceAt) * 100))

                  return (
                    <div className="fm-service-card" key={ticket._id}>
                      <div className="fm-sc-header">
                        <span className="fm-sc-bus">{ticket.bus?.plateNumber || 'Unknown'}</span>
                        <span className={`fm-badge fm-badge--${ticket.serviceType?.includes('Oil') ? 'orange' : 'blue'}`}>
                          {ticket.serviceType || 'General Service'}
                        </span>
                      </div>
                      <div className="fm-sc-data">
                        <div>
                          <div className="fm-sc-label">Current</div>
                          <div className="fm-sc-val">{(ticket.currentMileage || 0).toLocaleString()} km</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="fm-sc-label">Target</div>
                          <div className="fm-sc-val">{(ticket.nextServiceAt || 0).toLocaleString()} km</div>
                        </div>
                      </div>
                      <div className="fm-progress-bar">
                        <div className={`fm-progress-fill fm-bg-${ticket.serviceType?.includes('Oil') ? 'orange' : 'blue'}`} style={{ width: `${progress}%` }}></div>
                      </div>
                      <div className="fm-sc-footer">
                        <span className={`fm-text-${ticket.serviceType?.includes('Oil') ? 'orange' : 'blue'} fm-fw-600`}>{(remaining || 0).toLocaleString()} km remaining</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" className="fm-btn-outline fm-btn-sm" onClick={() => handleEdit(ticket)}>Edit</button>
                          <button type="button" className="fm-btn-outline fm-btn-sm" onClick={() => handleDelete(ticket._id)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {tickets.length === 0 && <p className="fm-empty-text">No upcoming services.</p>}
              </div>
            </div>

            {/* Vehicle Condition Reports List */}
            <div className="fm-card">
              <div className="fm-card-header">
                <h3>Vehicle Condition Reports</h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <select
                    className="fm-btn-outline fm-btn-sm"
                    value={severityFilter}
                    onChange={e => setSeverityFilter(e.target.value)}
                  >
                    <option value="All">Severity: All</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                  <button className="fm-btn-outline fm-btn-sm" onClick={() => { setFormMode('Report'); document.querySelector('.fm-form-panel').scrollIntoView({ behavior: 'smooth' }); }}>New Report</button>
                </div>
              </div>
              <div className="fm-table-wrap">
                <table className="fm-table">
                  <thead>
                    <tr>
                      <th>Bus No.</th>
                      <th>Report Date</th>
                      <th>Issue Details</th>
                      <th>Severity</th>
                      <th>Vehicle Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => (
                      <tr key={report._id}>
                        <td className="fm-fw-600">{report.bus?.plateNumber?.replace('-', '-\n') || 'Unknown'}</td>
                        <td>{report.reportDate ? new Date(report.reportDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/ /g, '\n') : 'N/A'}</td>
                        <td className="fm-wrap-text">{report.issueDetails || 'No details'}</td>
                        <td>
                          <span className={`fm-severity-badge fm-sev-${report.severity?.toLowerCase() || 'low'}`}>
                            {report.severity || 'Low'}
                          </span>
                        </td>
                        <td>
                          <span className={`fm-status-dot ${report.vehicleStatus === 'Grounded' ? 'dot-red' : (report.vehicleStatus === 'Available' ? 'dot-green' : 'dot-orange')}`}></span>
                          {(report.vehicleStatus || report.status || 'Available').replace(' ', '\n')}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="fm-action-link" onClick={() => handleEditReport(report)}>✏️</button>
                            <button className="fm-action-link" style={{ color: '#dc2626' }} onClick={() => handleDeleteReport(report._id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredReports.length === 0 && <tr><td colSpan="6" className="fm-empty-text" style={{ textAlign: 'center' }}>No condition reports found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          <div className="fm-right-col">

            {/* Critical Alerts Banner List */}
            {reports.filter(r => (r.severity === 'Critical' || r.severity === 'High') && r.vehicleStatus !== 'Available').length > 0 && (
              <div className="fm-alerts-panel">
                <div className="fm-alerts-header">
                  <span>⚠️ Critical Alerts ({reports.filter(r => r.severity === 'Critical' || r.severity === 'High').length})</span>
                </div>
                <div className="fm-alerts-body">
                  {reports.filter(r => (r.severity === 'Critical' || r.severity === 'High') && r.vehicleStatus !== 'Available').map(r => (
                    <div className="fm-alert-box" key={r._id}>
                      <div className="fm-alert-title">
                        <span className="fm-icon">🔥</span> {r.bus?.plateNumber}: {r.issueDetails.substring(0, 20)}...
                      </div>
                      <div className="fm-alert-desc">
                        {r.issueDetails}
                      </div>
                      <div className="fm-alert-time">Reported {formatDate(r.reportDate)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create Panel (Dual Mode) */}
            <div className="fm-form-panel">
              <div className="fm-mode-tabs">
                <button className={`fm-mode-btn ${formMode === 'Service' ? 'active' : ''}`} onClick={() => setFormMode('Service')}>Service Ticket</button>
                <button className={`fm-mode-btn ${formMode === 'Report' ? 'active' : ''}`} onClick={() => setFormMode('Report')}>Condition Report</button>
              </div>

              <div className="fm-form-content">
                {formMode === 'Service' ? (
                  <>
                    <div className="fm-form-header">
                      <h3>{isEditing ? '✏️ Edit Service Ticket' : '⊕ Add Upcoming Service'}</h3>
                      <p>{isEditing ? 'Update service details for this bus.' : 'Create a mileage-based service entry from the side panel.'}</p>
                    </div>

                    <form className="fm-form" onSubmit={handleSubmit}>
                      <div className="fm-form-group">
                        <label>Bus No</label>
                        <select value={formData.bus} onChange={e => setFormData({ ...formData, bus: e.target.value })}>
                          <option value="">Select bus</option>
                          {buses.map(b => (
                            <option key={b._id} value={b._id}>{b.plateNumber}</option>
                          ))}
                        </select>
                      </div>

                      <div className="fm-form-group">
                        <label>Service Type</label>
                        <select value={formData.serviceType} onChange={e => setFormData({ ...formData, serviceType: e.target.value })}>
                          <option value="Engine Oil Change">Engine Oil Change</option>
                          <option value="Transmission Check">Transmission Check</option>
                          <option value="Brake Pad Replacement">Brake Pad Replacement</option>
                          <option value="General Inspection">General Inspection</option>
                        </select>
                      </div>

                      <div className="fm-form-row">
                        <div className="fm-form-group">
                          <label>Current Mileage</label>
                          <div className="fm-input-wrapper">
                            <input type="number" readOnly value={formData.currentMileage} className="fm-readonly" />
                            <span className="fm-suffix">km</span>
                          </div>
                        </div>
                        <div className="fm-form-group">
                          <label>Next Service At</label>
                          <div className="fm-input-wrapper">
                            <input type="number" value={formData.nextServiceAt} onChange={e => setFormData({ ...formData, nextServiceAt: e.target.value })} />
                            <span className="fm-suffix">km</span>
                          </div>
                        </div>
                      </div>

                      <div className="fm-form-group">
                        <label>Priority</label>
                        <div className="fm-toggle-group">
                          <button type="button" className={`fm-toggle-btn ${formData.priority === 'Normal' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, priority: 'Normal' })}>Normal</button>
                          <button type="button" className={`fm-toggle-btn ${formData.priority === 'Urgent' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, priority: 'Urgent' })}>Urgent</button>
                        </div>
                      </div>

                      <div className="fm-form-group">
                        <label>Notes</label>
                        <textarea
                          placeholder="Add service note, inspection reminder, or assign workshop..."
                          value={formData.notes}
                          onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        ></textarea>
                      </div>

                      <div className="fm-form-actions">
                        <button type="button" className="fm-btn-clear" onClick={() => { setFormData(initialForm); setIsEditing(null); }}>Clear</button>
                        <button type="submit" className="fm-btn-primary fm-btn-submit">{isEditing ? 'Update Ticket' : 'Create Ticket'}</button>
                      </div>
                    </form>
                  </>
                ) : (
                  <>
                    <div className="fm-form-header">
                      <h3>{isEditingReport ? '✏️ Edit Condition Report' : '📑 New Condition Report'}</h3>
                      <p>{isEditingReport ? 'Modify issue details for the reported bus.' : 'Submit a new safety report or maintenance issue.'}</p>
                    </div>

                    <form className="fm-form" onSubmit={handleReportSubmit}>
                      <div className="fm-form-group">
                        <label>Target Bus</label>
                        <select value={reportFormData.bus} onChange={e => setReportFormData({ ...reportFormData, bus: e.target.value })}>
                          <option value="">Select bus</option>
                          {buses.map(b => (
                            <option key={b._id} value={b._id}>{b.plateNumber}</option>
                          ))}
                        </select>
                      </div>

                      <div className="fm-form-group">
                        <label>Issue Details</label>
                        <textarea
                          placeholder="Describe the issue (e.g. Unusual noise in engine, brake squeak)..."
                          value={reportFormData.issueDetails}
                          onChange={e => setReportFormData({ ...reportFormData, issueDetails: e.target.value })}
                        ></textarea>
                      </div>

                      <div className="fm-form-row">
                        <div className="fm-form-group">
                          <label>Severity</label>
                          <select value={reportFormData.severity} onChange={e => setReportFormData({ ...reportFormData, severity: e.target.value })}>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                        </div>
                        <div className="fm-form-group">
                          <label>Vehicle Status</label>
                          <select value={reportFormData.vehicleStatus} onChange={e => setReportFormData({ ...reportFormData, vehicleStatus: e.target.value })}>
                            <option value="Grounded">Grounded</option>
                            <option value="Inspection Scheduled">Inspection Scheduled</option>
                            <option value="Available">Available (Service Complete)</option>
                          </select>
                        </div>
                      </div>

                      <div className="fm-form-actions" style={{ marginTop: '20px' }}>
                        <button type="button" className="fm-btn-clear" onClick={() => { setReportFormData(initialReportForm); setIsEditingReport(null); }}>Clear</button>
                        <button type="submit" className="fm-btn-primary fm-btn-submit">{isEditingReport ? 'Update Report' : 'Submit Report'}</button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

export default FleetMaintenance
