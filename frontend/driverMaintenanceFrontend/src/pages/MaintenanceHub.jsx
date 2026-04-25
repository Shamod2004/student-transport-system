import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import * as busService from '../services/busService'
import * as workOrderService from '../services/workOrderService'
import { formatDate } from '../utils/formatDate'
import Sidebar from '../components/Sidebar'
import './MaintenanceHub.css'

const MaintenanceHub = () => {
  const [buses, setBuses] = useState([])
  const [workOrders, setWorkOrders] = useState([])
  
  // Filters string just to demonstrate matching the screenshot tabs
  const [activeTab, setActiveTab] = useState('In Maintenance')
  const [search, setSearch] = useState('')

  // Form State
  const initialForm = {
    bus: '',
    issueTitle: '',
    description: '',
    status: 'In Progress',
    severity: 'Medium'
  }
  const [formData, setFormData] = useState(initialForm)
  const [isEditing, setIsEditing] = useState(null)

  const loadData = async () => {
    try {
      const [busRes, woRes] = await Promise.all([
        busService.getAllBuses(),
        workOrderService.getAllWorkOrders()
      ])
      setBuses(busRes.data)
      setWorkOrders(woRes.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Derived Stats based exactly on screenshot numbers / metrics mapping
  const totalTickets = workOrders.length
  const inMaintenance = workOrders.filter(o => o.status === 'In Progress').length
  const completedStats = workOrders.filter(o => o.status === 'Completed').length
  const pendingStats = workOrders.filter(o => o.status === 'Pending').length

  const filteredOrders = workOrders
    .filter(o => o.status === (activeTab === 'In Maintenance' ? 'In Progress' : 'Completed'))
    .filter(o => {
      if (!search) return true
      const term = search.toLowerCase()
      return o.ticketId?.toLowerCase().includes(term) || o.issueTitle?.toLowerCase().includes(term) || o.bus?.plateNumber?.toLowerCase().includes(term)
    })

  // Handlers
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.bus || !formData.issueTitle || !formData.description) {
      toast.error('Bus, Issue Title, and Description are required.')
      return
    }

    try {
      if (isEditing) {
        await workOrderService.updateWorkOrder(isEditing, formData)
        toast.success('Ticket updated successfully.')
      } else {
        await workOrderService.createWorkOrder(formData)
        toast.success('Ticket created successfully.')
      }
      setFormData(initialForm)
      setIsEditing(null)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    }
  }

  const handleEdit = (order) => {
    setIsEditing(order._id)
    setFormData({
      bus: order.bus?._id || '',
      issueTitle: order.issueTitle,
      description: order.description,
      status: order.status,
      severity: order.severity
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleComplete = async (id) => {
    try {
        await workOrderService.updateWorkOrder(id, { status: 'Completed' })
        toast.success('Ticket marked as Completed.')
        loadData()
      } catch (err) {
        toast.error('Failed to update status.')
      }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this ticket?')) {
      try {
        await workOrderService.deleteWorkOrder(id)
        toast.success('Ticket deleted.')
        loadData()
      } catch (err) {
        toast.error(err.response?.data?.message || err.message)
      }
    }
  }

  return (
    <div className="mh-layout">
      <Sidebar />
      <main className="mh-main">
        <header className="mh-header-top">
          <h1 className="mh-title-top">Maintenance Hub</h1>
        </header>

        <div className="mh-content">

          {/* Stats Header Grid */}
          <div className="mh-stats-grid">
            <div className="mh-stat-card">
              <div className="mh-stat-header">
                <span className="mh-stat-title">Total Tickets</span>
                <span className="mh-icon">🎟️</span>
              </div>
              <div className="mh-stat-val">{totalTickets}</div>
              <div className="mh-subtext">All time maintenance logs</div>
            </div>
            <div className="mh-stat-card">
              <div className="mh-stat-header">
                <span className="mh-stat-title">In Maintenance</span>
                <span className="mh-icon mh-text-orange">🔧</span>
              </div>
              <div className="mh-stat-val">{inMaintenance}</div>
              <div className="mh-subtext">Active repair works</div>
            </div>
            <div className="mh-stat-card">
              <div className="mh-stat-header">
                <span className="mh-stat-title">Completed (This Month)</span>
                <span className="mh-icon mh-text-green">✅</span>
              </div>
              <div className="mh-stat-val">{completedStats}</div>
              <div className="mh-subtext">Successfully serviced</div>
            </div>
            <div className="mh-stat-card">
              <div className="mh-stat-header">
                <span className="mh-stat-title">Pending Inspections</span>
                <span className="mh-icon mh-text-blue">📋</span>
              </div>
              <div className="mh-stat-val">{pendingStats}</div>
              <div className="mh-subtext">Awaiting scheduling</div>
            </div>
          </div>

          <div className="mh-two-cols">
            
            {/* Left Col: Logs */}
            <div className="mh-card mh-history-card">
              <div className="mh-history-header">
                 <h2>Maintenance History</h2>
                 <div className="mh-search-box">
                    <span>🔍</span>
                    <input type="text" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} />
                 </div>
              </div>
              
              <div className="mh-tabs">
                 <button 
                  className={`mh-tab ${activeTab === 'In Maintenance' ? 'active' : ''}`}
                  onClick={() => setActiveTab('In Maintenance')}
                 >
                    In Maintenance ({inMaintenance})
                 </button>
                 <button 
                  className={`mh-tab ${activeTab === 'Completed' ? 'active' : ''}`}
                  onClick={() => setActiveTab('Completed')}
                 >
                    Completed
                 </button>
              </div>

              <div className="mh-table-wrapper">
                <table className="mh-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Bus No</th>
                      <th>Issue / Inspection</th>
                      <th>Date Created</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => (
                      <tr key={order._id}>
                        <td className="mh-fw-bold">{order.ticketId}</td>
                        <td className="mh-text-dark">{order.bus?.plateNumber?.replace('-', '-\n')}</td>
                        <td className="mh-text-dark">{order.issueTitle}</td>
                        <td className="mh-text-dark">{new Date(order.createdAt).toLocaleDateString('en-GB', {month:'short', day:'numeric', year:'numeric'}).replace(/ /g, '\n')}</td>
                        <td>
                          <span className={`mh-status-badge mh-status-${order.status.replace(/\s+/g, '').toLowerCase()}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <div className="mh-actions">
                             <button className="mh-action-btn" title="Edit" onClick={() => handleEdit(order)}>✏️</button>
                             {order.status !== 'Completed' && (
                               <button className="mh-action-btn" title="Mark Completed" onClick={() => handleComplete(order._id)}>✅</button>
                             )}
                             <button className="mh-action-btn mh-btn-del" title="Delete" onClick={() => handleDelete(order._id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr><td colSpan="6" className="mh-empty">No records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="mh-load-more">
                 <button onClick={loadData}>Refresh</button>
              </div>
            </div>

            {/* Right Col: Form */}
            <div className="mh-card mh-form-card">
              <h2>{isEditing ? 'Edit Maintenance Ticket' : 'Create Maintenance Ticket'}</h2>
              <form className="mh-form" onSubmit={handleSubmit}>
                
                <div className="mh-form-group">
                  <label>Bus Number / Fleet ID</label>
                  <select value={formData.bus} onChange={e => setFormData({...formData, bus: e.target.value})}>
                    <option value="">Select a bus...</option>
                    {buses.map(b => (
                      <option key={b._id} value={b._id}>{b.plateNumber} ({b.brand})</option>
                    ))}
                  </select>
                </div>

                <div className="mh-form-group">
                  <label>Related Inspection / Issue</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Engine Overheating, 50k Service" 
                    value={formData.issueTitle}
                    onChange={e => setFormData({...formData, issueTitle: e.target.value})}
                  />
                </div>

                <div className="mh-form-group">
                  <label>Detailed Description</label>
                  <textarea 
                    placeholder="Describe the issue or routine maintenance requirements in detail..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  ></textarea>
                </div>

                <div className="mh-form-group">
                  <label>Initial Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="mh-form-group">
                  <label>Severity Level</label>
                  <select value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value})}>
                    <option value="Low">Low - Monitored</option>
                    <option value="Medium">Medium - Needs Attention</option>
                    <option value="High">High - Urgent</option>
                    <option value="Critical">Critical - Immediate</option>
                  </select>
                </div>

                <div className="mh-form-actions">
                  <button type="submit" className="mh-btn-primary">{isEditing ? 'Update Ticket' : 'Create Ticket'}</button>
                  <button type="button" className="mh-btn-clear" onClick={() => { setFormData(initialForm); setIsEditing(null); }}>Clear</button>
                </div>

              </form>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

export default MaintenanceHub
