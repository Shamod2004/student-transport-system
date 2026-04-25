import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import * as busService from '../services/busService'
import * as inspectionService from '../services/inspectionService'
import * as maintenanceService from '../services/maintenanceService'
import Sidebar from '../components/Sidebar'
import './BusManagement.css'

const BRANDS = ['Toyota', 'Volvo', 'Mitsubishi', 'Ashok Leyland', 'Mercedes-Benz', 'Scania']

const BusManagement = () => {
  const [buses, setBuses]           = useState([])
  const [inspections, setInspections] = useState([])
  const [filterBrand, setFilterBrand] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isEditing, setIsEditing]   = useState(null)
  const brandRef = useRef(null)

  const initialForm = {
    brand: '', model: '', plateNumber: '',
    gearType: 'Automatic', seatingCapacity: 40, mileage: 0, status: 'Active'
  }
  const [formData, setFormData] = useState(initialForm)

  const loadData = async () => {
    try {
      const busRes = await busService.getAllBuses()
      setBuses(busRes.data)
    } catch { toast.error('Unable to fetch bus list.') }
    try {
      const inspRes = await inspectionService.getAllInspections()
      setInspections(inspRes.data)
    } catch { /* silent */ }
  }

  useEffect(() => { loadData() }, [])

  /* ── Derived stats ── */
  const totalBuses     = buses.length
  const activeBuses    = buses.filter(b => b.status === 'Active').length
  const inMaintenance  = buses.filter(b => b.status === 'Under Maintenance').length
  const criticalAlerts = inspections.filter(i => i.result === 'Issue Reported').length
  const readinessPct   = totalBuses ? Math.round((activeBuses / totalBuses) * 100) : 0

  /* ── Handlers ── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.brand || !formData.model || !formData.plateNumber) {
      toast.error('Brand, Model, and Plate Number are required.')
      return
    }
    try {
      const payload = {
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        plateNumber: formData.plateNumber.trim(),
        gearType: formData.gearType,
        seatingCapacity: Number(formData.seatingCapacity) || 40,
        mileage: Number(formData.mileage) || 0,
        status: formData.status || 'Active',
        year: new Date().getFullYear()
      }
      if (isEditing) {
        await busService.updateBus(isEditing, payload)
        toast.success('Bus updated successfully.')
      } else {
        await busService.createBus(payload)
        toast.success('Bus registered successfully.')
      }
      setFormData(initialForm)
      setIsEditing(null)
      setSearchQuery('')
      setFilterBrand('All')
      loadData()
    } catch (err) {
      const msg = err.response?.data?.message || err.message
      if (msg.includes('duplicate') || msg.includes('E11000') || err.response?.data?.conflictDetected) {
        toast.error(`Plate Number ${formData.plateNumber} is already registered!`)
        loadData()
      } else {
        toast.error(`Failed: ${msg}`)
      }
    }
  }

  const handleEdit = (bus) => {
    setIsEditing(bus._id)
    setFormData({
      brand: bus.brand, model: bus.model, plateNumber: bus.plateNumber,
      gearType: bus.gearType, seatingCapacity: bus.seatingCapacity,
      mileage: bus.mileage, status: bus.status
    })
    setTimeout(() => {
      document.querySelector('.bm-form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const handleCancelEdit = () => { setIsEditing(null); setFormData(initialForm) }

  const handleInitNew = () => {
    setIsEditing(null); setFormData(initialForm)
    setTimeout(() => {
      document.querySelector('.bm-form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      brandRef.current?.focus()
    }, 80)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bus from the fleet?')) return
    try {
      await busService.deleteBus(id)
      toast.success('Bus removed from fleet.')
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    }
  }

  const handleCreateTicket = async (bus) => {
    try {
      const mil = Number(bus.mileage) || 0
      await maintenanceService.createTicket({
        bus: bus._id,
        serviceType: 'General Inspection',
        currentMileage: mil,
        nextServiceAt: mil + 5000,
        priority: 'Normal',
        notes: 'Auto-generated from Bus Management.',
        status: 'Pending'
      })
      toast.success(`Service ticket created for ${bus.plateNumber}`)
    } catch (err) {
      toast.error('Failed to create ticket: ' + (err.response?.data?.message || err.message))
    }
  }

  const getUiStatus = (s) => {
    if (!s || s === 'Active' || s === 'Good') return 'Available'
    if (s === 'Under Maintenance' || s === 'Repair') return 'In Maintenance'
    if (s === 'Retired' || s === 'Inactive') return 'Unavailable'
    return s
  }

  const filteredBuses = buses.filter(bus => {
    const matchesBrand  = filterBrand === 'All' || bus.brand === filterBrand
    const matchesSearch = (bus.plateNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                          (bus.model?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                          (bus.brand?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    return matchesBrand && matchesSearch
  })

  return (
    <div className="bm-layout">
      <Sidebar />
      <main className="bm-main">

        {/* ── Header ── */}
        <header className="bm-header">
          <div className="bm-header-left">
            {/* <span className="bm-breadcrumb">Fleet Operations</span> */}
            <h1 className="bm-title">Bus Management</h1>
            <p className="bm-subtitle">Register, track and maintain your entire vehicle fleet.</p>
          </div>
          {/* <div className="bm-header-right">
            <span className="bm-bell">🔔</span>
            <div className="bm-user-info">
              <span className="bm-user-name">Admin User</span>
              <span className="bm-user-role">Fleet Manager</span>
            </div>
            <div className="bm-avatar">
              <img src="https://i.pravatar.cc/100?img=11" alt="Avatar" />
            </div>
          </div> */}
        </header>

        <div className="bm-content">

          {/* ── KPI Cards ── */}
          <div className="bm-metrics">
            <div className="bm-metric-card bm-metric-blue">
              <div className="bm-metric-top">
                <span className="bm-metric-icon-box bm-icon-blue">🚌</span>
                <span className="bm-metric-change">Fleet</span>
              </div>
              <div className="bm-metric-val">{totalBuses}</div>
              <div className="bm-metric-label">Total Fleet Buses</div>
              <div className="bm-metric-bar"><div className="bm-metric-bar-fill bm-bar-blue" style={{ width: '100%' }} /></div>
            </div>

            <div className="bm-metric-card bm-metric-green">
              <div className="bm-metric-top">
                <span className="bm-metric-icon-box bm-icon-green">✅</span>
                <span className="bm-metric-change bm-change-green">{readinessPct}%</span>
              </div>
              <div className="bm-metric-val">{activeBuses}</div>
              <div className="bm-metric-label">Active & On Route</div>
              <div className="bm-metric-bar"><div className="bm-metric-bar-fill bm-bar-green" style={{ width: `${readinessPct}%` }} /></div>
            </div>

            <div className="bm-metric-card bm-metric-orange">
              <div className="bm-metric-top">
                <span className="bm-metric-icon-box bm-icon-orange">🔧</span>
                <span className="bm-metric-change bm-change-orange">{inMaintenance} repairs</span>
              </div>
              <div className="bm-metric-val">{inMaintenance}</div>
              <div className="bm-metric-label">In Maintenance</div>
              <div className="bm-metric-bar"><div className="bm-metric-bar-fill bm-bar-orange" style={{ width: `${totalBuses ? (inMaintenance / totalBuses) * 100 : 0}%` }} /></div>
            </div>

            <div className="bm-metric-card bm-metric-red">
              <div className="bm-metric-top">
                <span className="bm-metric-icon-box bm-icon-red">⚠️</span>
                <span className="bm-metric-change bm-change-red">Urgent</span>
              </div>
              <div className="bm-metric-val">{criticalAlerts}</div>
              <div className="bm-metric-label">Critical Alerts</div>
              <div className="bm-metric-bar"><div className="bm-metric-bar-fill bm-bar-red" style={{ width: criticalAlerts > 0 ? '100%' : '0%' }} /></div>
            </div>
          </div>

          {/* ── Mid Row: Alerts + Maintenance Schedule ── */}
          <div className="bm-grid-middle">

            {/* Critical Alerts */}
            <div className="bm-card bm-alerts-card">
              <div className="bm-card-header">
                <div>
                  <h2 className="bm-card-title">Critical Alerts</h2>
                  <p className="bm-card-sub">Buses requiring immediate attention</p>
                </div>
                <span className={`bm-pill ${criticalAlerts > 0 ? 'bm-pill-red' : 'bm-pill-green'}`}>
                  {criticalAlerts > 0 ? `${criticalAlerts} Active` : 'All Clear'}
                </span>
              </div>
              <div className="bm-alerts-list">
                {inspections.filter(i => i.result === 'Issue Reported').slice(0, 3).map((insp, idx) => (
                  <div className="bm-alert-item" key={idx}>
                    <div className="bm-alert-dot" />
                    <div>
                      <div className="bm-alert-title">Bus {insp.bus?.plateNumber}</div>
                      <div className="bm-alert-desc">Reported by {insp.driver?.name} · Maintenance required</div>
                    </div>
                  </div>
                ))}
                {criticalAlerts === 0 && (
                  <div className="bm-empty-state">
                    <span>✅</span>
                    <p>No critical alerts at this time</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Maintenance */}
            <div className="bm-card bm-maintenance-card">
              <div className="bm-card-header">
                <div>
                  <h2 className="bm-card-title">Upcoming Maintenance</h2>
                  <p className="bm-card-sub">Mileage-based service schedule</p>
                </div>
                <span className="bm-pill bm-pill-blue">Next 3 Due</span>
              </div>
              <div className="bm-maintenance-list">
                {buses.slice(0, 3).map((bus) => {
                  const pct = Math.min(100, Math.round(((bus.mileage % 5000) / 5000) * 100))
                  return (
                    <div className="bm-maint-item" key={bus._id}>
                      <div className="bm-maint-icon">🚌</div>
                      <div className="bm-maint-info">
                        <div className="bm-maint-bus">{bus.plateNumber} <span>· {bus.brand} {bus.model}</span></div>
                        <div className="bm-maint-progress-track">
                          <div className="bm-maint-progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="bm-maint-meta">
                          <span>{bus.mileage.toLocaleString()} km current</span>
                          <span>Next: {(bus.mileage + 5000).toLocaleString()} km</span>
                        </div>
                      </div>
                      <button type="button" className="bm-btn-ticket" onClick={() => handleCreateTicket(bus)}>
                        + Ticket
                      </button>
                    </div>
                  )
                })}
                {buses.length === 0 && (
                  <div className="bm-empty-state"><span>🚌</span><p>No buses registered yet</p></div>
                )}
              </div>
            </div>

          </div>

          {/* ── Bottom Row: Form + Table ── */}
          <div className="bm-grid-bottom">

            {/* Registration / Edit Form */}
            <div className="bm-card bm-form-card">
              <div className="bm-form-card-header">
                <div className={`bm-form-icon ${isEditing ? 'bm-form-icon-edit' : 'bm-form-icon-new'}`}>
                  {isEditing ? '✏️' : '🚌'}
                </div>
                <div>
                  <h2 className="bm-card-title">{isEditing ? 'Edit Bus Details' : 'Register New Bus'}</h2>
                  <p className="bm-card-sub">{isEditing ? 'Modify the selected vehicle' : 'Add a new vehicle to the fleet registry'}</p>
                </div>
              </div>

              <form className="bm-form" onSubmit={handleSubmit}>
                <div className="bm-form-row">
                  <div className="bm-form-group">
                    <label>Brand</label>
                    <select ref={brandRef} value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })}>
                      <option value="">Select brand...</option>
                      {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="bm-form-group">
                    <label>Model</label>
                    <input type="text" placeholder="e.g. Coaster, B11" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
                  </div>
                </div>

                <div className="bm-form-row">
                  <div className="bm-form-group">
                    <label>Plate Number</label>
                    <input type="text" placeholder="e.g. UB-4521" value={formData.plateNumber} onChange={e => setFormData({ ...formData, plateNumber: e.target.value })} />
                  </div>
                  <div className="bm-form-group">
                    <label>Gear Type</label>
                    <select value={formData.gearType} onChange={e => setFormData({ ...formData, gearType: e.target.value })}>
                      <option value="Automatic">Automatic</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>
                </div>

                <div className="bm-form-row">
                  <div className="bm-form-group">
                    <label>Seating Capacity</label>
                    <input type="number" min="1" value={formData.seatingCapacity} onChange={e => setFormData({ ...formData, seatingCapacity: e.target.value })} />
                  </div>
                  <div className="bm-form-group">
                    <label>Mileage (km)</label>
                    <input type="number" min="0" value={formData.mileage} onChange={e => setFormData({ ...formData, mileage: e.target.value })} />
                  </div>
                </div>

                {isEditing && (
                  <div className="bm-form-group">
                    <label>Operational Status</label>
                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                      <option value="Active">Available (Active)</option>
                      <option value="Under Maintenance">In Maintenance</option>
                      <option value="Retired">Retired / Unavailable</option>
                    </select>
                  </div>
                )}

                <div className="bm-form-actions">
                  {isEditing && (
                    <button type="button" className="bm-btn-cancel" onClick={handleCancelEdit}>Cancel</button>
                  )}
                  <button type="submit" className="bm-btn-submit">
                    {isEditing ? '💾 Save Changes' : '+ Register Bus'}
                  </button>
                </div>
              </form>
            </div>

            {/* Fleet Table */}
            <div className="bm-card bm-table-card">
              <div className="bm-table-toolbar">
                <div>
                  <h3 className="bm-card-title">Fleet Registry</h3>
                  <p className="bm-card-sub">{buses.length} vehicle{buses.length !== 1 ? 's' : ''} registered</p>
                </div>
                <div className="bm-toolbar-actions">
                  <div className="bm-search-box">
                    <span className="bm-search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Search plate, brand or model..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && <button className="bm-search-clear" onClick={() => setSearchQuery('')}>✕</button>}
                  </div>
                  <select className="bm-filter-select" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
                    <option value="All">All Brands</option>
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <button className="bm-btn-primary" onClick={handleInitNew}>+ Add Bus</button>
                </div>
              </div>

              <div className="bm-table-wrapper">
                <table className="bm-table">
                  <thead>
                    <tr>
                      <th>Plate No.</th>
                      <th>Brand & Model</th>
                      <th>Gear</th>
                      <th>Seats</th>
                      <th>Mileage</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBuses.map(bus => {
                      const uiStatus   = getUiStatus(bus.status)
                      const statusCls  = uiStatus === 'Available' ? 'bm-status-green'
                                       : uiStatus === 'In Maintenance' ? 'bm-status-orange'
                                       : 'bm-status-gray'
                      return (
                        <tr key={bus._id} className={isEditing === bus._id ? 'bm-row-active' : ''}>
                          <td className="bm-td-plate">{bus.plateNumber}</td>
                          <td>
                            <div className="bm-td-brand">{bus.brand}</div>
                            <div className="bm-td-model">{bus.model}</div>
                          </td>
                          <td>{bus.gearType}</td>
                          <td>{bus.seatingCapacity}</td>
                          <td>{(bus.mileage || 0).toLocaleString()} km</td>
                          <td><span className={`bm-status-pill ${statusCls}`}>{uiStatus}</span></td>
                          <td>
                            <div className="bm-action-group">
                              <button className="bm-action-edit" onClick={() => handleEdit(bus)} title="Edit">✏️</button>
                              <button className="bm-action-delete" onClick={() => handleDelete(bus._id)} title="Delete">🗑️</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {filteredBuses.length === 0 && (
                      <tr>
                        <td colSpan="7">
                          <div className="bm-table-empty">
                            <span>🚌</span>
                            <p>{searchQuery ? 'No buses match your search.' : 'No buses registered yet.'}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

export default BusManagement
