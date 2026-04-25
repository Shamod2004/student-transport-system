import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts'
import * as busService from '../services/busService'
import * as driverService from '../services/driverService'
import * as routeAssignmentService from '../services/routeAssignmentService'
import * as leaveService from '../services/leaveService'
import * as workOrderService from '../services/workOrderService'
import Sidebar from '../components/Sidebar'
import './Dashboard.css'

const RADIAN = Math.PI / 180
const renderPct = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>{`${(percent * 100).toFixed(0)}%`}</text>
}

const Dashboard = () => {
  const [buses, setBuses] = useState([])
  const [drivers, setDrivers] = useState([])
  const [routes, setRoutes] = useState([])
  const [leaves, setLeaves] = useState([])
  const [workOrders, setWorkOrders] = useState([])

  useEffect(() => {
    Promise.all([
      busService.getAllBuses(),
      driverService.getAllDrivers(),
      routeAssignmentService.getAllRouteAssignments(),
      leaveService.getAllLeaveRequests(),
      workOrderService.getAllWorkOrders(),
    ]).then(([b, d, r, l, w]) => {
      setBuses(b.data); setDrivers(d.data); setRoutes(r.data); setLeaves(l.data); setWorkOrders(w.data)
    }).catch(console.error)
  }, [])

  const activeBuses   = buses.filter(b => b.status === 'Active').length
  const maintBuses    = buses.filter(b => b.status === 'Under Maintenance').length
  const retiredBuses  = buses.filter(b => b.status === 'Retired').length
  const activeDrivers = drivers.filter(d => d.status === 'Active').length
  const onLeave       = drivers.filter(d => d.status === 'On Leave').length
  const suspended     = drivers.filter(d => d.status === 'Suspended').length
  const pendingLeaves = leaves.filter(l => l.status === 'Pending').length
  const openOrders    = workOrders.filter(w => w.status !== 'Completed')
  const sevCounts     = { Low: 0, Medium: 0, High: 0, Critical: 0 }
  openOrders.forEach(w => { if (sevCounts[w.severity] !== undefined) sevCounts[w.severity]++ })

  const fleetPie = [
    { name: 'Active', value: activeBuses },
    { name: 'In Maintenance', value: maintBuses },
    { name: 'Retired', value: retiredBuses },
  ].filter(d => d.value > 0)

  const driverPie = [
    { name: 'Active', value: activeDrivers },
    { name: 'On Leave', value: onLeave },
    { name: 'Suspended', value: suspended },
  ].filter(d => d.value > 0)

  const severityBar = [
    { name: 'Low', count: sevCounts.Low, fill: '#38bdf8' },
    { name: 'Medium', count: sevCounts.Medium, fill: '#facc15' },
    { name: 'High', count: sevCounts.High, fill: '#f97316' },
    { name: 'Critical', count: sevCounts.Critical, fill: '#ef4444' },
  ]

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const base = routes.length || 4
  const activityData = days.map((day, i) => ({
    day,
    routes: Math.max(0, base + (i % 3 === 0 ? 2 : i % 2 === 0 ? -1 : 1)),
    drivers: Math.max(0, activeDrivers + (i % 2 === 0 ? 1 : -1)),
  }))

  const FLEET_COLORS  = ['#10b981', '#f59e0b', '#94a3b8']
  const DRIVER_COLORS = ['#3b82f6', '#f59e0b', '#ef4444']

  return (
    <div className="db-layout">
      <Sidebar />
      <main className="db-main">
        {/* Header */}
        <header className="db-header">
          <div>
            <p className="db-breadcrumb">Overview</p>
            <h1 className="db-title">System Dashboard</h1>
          </div>
          {/* <div className="db-header-right">
            <span className="db-bell">🔔</span>
            <div className="db-avatar">
              <img src="https://i.pravatar.cc/100?img=11" alt="Admin" />
            </div>
          </div> */}
        </header>

        <div className="db-content">
          {/* KPI Row */}
          <div className="db-kpi-grid">
            <div className="db-kpi-card db-gradient-blue">
              <span className="db-kpi-top">🚌 Total Fleet</span>
              <span className="db-kpi-val">{buses.length}</span>
              <span className="db-kpi-bottom">{maintBuses} in maintenance</span>
            </div>
            <div className="db-kpi-card db-gradient-green">
              <span className="db-kpi-top">🗺️ Active Routes</span>
              <span className="db-kpi-val">{routes.length}</span>
              <span className="db-kpi-bottom">Serving daily schedule</span>
            </div>
            {/* <div className="db-kpi-card db-gradient-orange">
              <span className="db-kpi-top">👤 Staff Roster</span>
              <span className="db-kpi-val">{drivers.length}</span>
              <span className="db-kpi-bottom">{pendingLeaves} pending leaves</span>
            </div>
            <div className="db-kpi-card db-gradient-red">
              <span className="db-kpi-top">🔧 Open Work Orders</span>
              <span className="db-kpi-val">{openOrders.length}</span>
              <span className="db-kpi-bottom">{sevCounts.Critical} critical alerts</span>
            </div> */}
          </div>

          {/* Charts Row 1: Donuts */}
          <div className="db-grid-middle">
            <div className="db-card">
              <div className="db-card-header">
                <h2 className="db-card-title">Fleet Status</h2>
                <span className="db-card-badge">{buses.length ? Math.round((activeBuses/buses.length)*100) : 0}% Operational</span>
              </div>
              {fleetPie.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={fleetPie} cx="50%" cy="50%" innerRadius={60} outerRadius={88} paddingAngle={3} dataKey="value" label={renderPct} labelLine={false}>
                      {fleetPie.map((_, i) => <Cell key={i} fill={FLEET_COLORS[i % FLEET_COLORS.length]} />)}
                    </Pie>
                    <Tooltip /><Legend iconType="circle" iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="db-empty-chart">No fleet data available</div>}
            </div>

            <div className="db-card">
              <div className="db-card-header">
                <h2 className="db-card-title">Driver Availability</h2>
                <span className="db-card-badge db-badge-blue">{drivers.length ? Math.round((activeDrivers/drivers.length)*100) : 0}% Available</span>
              </div>
              {driverPie.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={driverPie} cx="50%" cy="50%" innerRadius={60} outerRadius={88} paddingAngle={3} dataKey="value" label={renderPct} labelLine={false}>
                      {driverPie.map((_, i) => <Cell key={i} fill={DRIVER_COLORS[i % DRIVER_COLORS.length]} />)}
                    </Pie>
                    <Tooltip /><Legend iconType="circle" iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="db-empty-chart">No driver data available</div>}
            </div>
          </div>

          {/* Charts Row 2: Area & Bar */}
          <div className="db-grid-middle">
            <div className="db-card">
              <div className="db-card-header">
                <h2 className="db-card-title">Weekly Activity</h2>
                <span className="db-card-badge db-badge-green">This Week</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={activityData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="colorRoutes" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorDrivers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Legend iconType="circle" iconSize={10} />
                  <Area type="monotone" dataKey="routes" name="Routes" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRoutes)" strokeWidth={2} />
                  <Area type="monotone" dataKey="drivers" name="Drivers" stroke="#10b981" fillOpacity={1} fill="url(#colorDrivers)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="db-card">
              <div className="db-card-header">
                <h2 className="db-card-title">Work Order Severity</h2>
                <span className="db-card-badge db-badge-orange">{openOrders.length} Open Tickets</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={severityBar} margin={{ top: 10, right: 10, bottom: 0, left: -20 }} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Bar dataKey="count" name="Tickets" radius={[6,6,0,0]}>
                    {severityBar.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Tables */}
          <div className="db-grid-bottom">
            {/* Routes Table */}
            <div className="db-card db-logs-card">
              <div className="db-card-header"><h3 className="db-card-title">Latest Route Assignments</h3></div>
              <table className="db-table">
                <thead>
                  <tr><th>Route</th><th>Bus No.</th><th>Driver</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {routes.slice(0, 5).map(route => (
                    <tr key={route._id}>
                      <td className="db-fw-bold">{route.routeName}</td>
                      <td>{route.bus?.plateNumber}</td>
                      <td>{route.driver?.name}</td>
                      <td>{route.startTime}</td>
                    </tr>
                  ))}
                  {routes.length === 0 && <tr><td colSpan="4" style={{textAlign:'center', color:'#94a3b8'}}>No active routes</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Work Orders Table */}
            <div className="db-card db-logs-card">
              <div className="db-card-header"><h3 className="db-card-title">Recent Work Orders</h3></div>
              <table className="db-table">
                <thead>
                  <tr><th>Ticket ID</th><th>Issue</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {workOrders.slice(0, 5).map(order => (
                    <tr key={order._id}>
                      <td className="db-fw-bold">{order.ticketId}</td>
                      <td>{order.issueTitle}</td>
                      <td>
                        <span className={`db-badge db-badge--${order.status.replace(/\s+/g, '').toLowerCase()}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {workOrders.length === 0 && <tr><td colSpan="3" style={{textAlign:'center', color:'#94a3b8'}}>No recent work orders</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

export default Dashboard
