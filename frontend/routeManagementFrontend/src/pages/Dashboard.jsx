import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { routeAPI } from '../services/api'
import { getRouteStatus, formatDate, formatTime, calculateDuration, getDurationColor, getErrorMessage, getSuccessMessage, formatPrice, safePriceToString } from '../utils/helpers'
import { generateRouteReport } from '../utils/pdfGenerator'
import toast from 'react-hot-toast'
import RouteModal from '../components/RouteModal'
import DeleteModal from '../components/DeleteModal'
import ScheduleModal from '../components/ScheduleModal'

// Icons import karanna
import { Bus, Plus, Filter, Download, Edit, Trash2, Calendar, MapPin, Clock, X } from 'lucide-react'

// Error boundary component
class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dashboard Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Component Stack:', errorInfo.componentStack)
    
    // Log additional debugging info
    console.error('Current routes state:', this.props.routes?.length || 'undefined')
    console.error('Current loading state:', this.props.loading || 'undefined')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 flex items-center justify-center">
          <div className="text-center max-w-2xl">
            <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Bus className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              The dashboard encountered an error. Please try refreshing the page.
            </p>
            
            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                <p className="text-sm font-semibold text-red-800 mb-2">Error Details:</p>
                <p className="text-xs text-red-700 break-all">{this.state.error.toString()}</p>
              </div>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="btn-primary transition-all duration-300 hover:scale-105 hover:shadow-soft"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Main Dashboard component
const Dashboard = () => {
  // State management
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalRoutes: 0,
    totalBuses: 0,
    certified: 0,
    pending: 0
  }) // Summary statistics state add karanna
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRoutes: 0,
    limit: 21, // Changed from 30 to 21 as requested
    hasNextPage: false,
    hasPrevPage: false
  })
  
  // Filters state - all date fields follow consistent behavior
  const [filters, setFilters] = useState({
    search: '',
    from: '',
    to: '',
    endDate: ''
  })
  
  // Modal states
  const [showRouteModal, setShowRouteModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false) // Schedule modal state add karanna
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isStatusOnlyMode, setIsStatusOnlyMode] = useState(false) // NEW: Status-only mode
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0])
  const [filteredSchedules, setFilteredSchedules] = useState([])
  
  // Location options for filters
  const [locationOptions, setLocationOptions] = useState({
    departureLocations: [],
    arrivalLocations: []
  })


  // Routes load karanna API eken
  const loadRoutes = useCallback(async (page = 1, appliedFilters = filters) => {
    try {
      setLoading(true)

      const sanitizedFilters = Object.fromEntries(
        Object.entries(appliedFilters || {}).filter(([, value]) => {
          if (value === null || value === undefined) return false
          return String(value).trim() !== ''
        })
      )
      
      // Query parameters build karanna
      const params = {
        page,
        limit: 21, // Changed from 30 to 21 as requested
        ...sanitizedFilters // Include only active filters
      };
      
      const response = await routeAPI.getRoutes(params)
      
      // Log the raw API response
      console.log('RAW API RESPONSE:', response);
      
      // Ensure response has expected structure before accessing
      if (response?.data?.data) {
        const routesData = response.data.data.routes || []
        console.log('ROUTES DATA FROM API:', routesData);
        console.log('TOTAL ROUTES LOADED:', routesData.length);
        
        // Check specifically for BUS003, BUS004, BUS005
        const targetBuses = routesData.filter(route => 
          route.busId === 'BUS003' || route.busId === 'BUS004' || route.busId === 'BUS005'
        );
        console.log('TARGET BUSES (BUS003-005):', targetBuses);
        
        // Enhanced data validation and completion
        const enhancedRoutes = routesData.map(route => {
          const enhancedRoute = { ...route };
          
          // Ensure all required fields have values
          if (!enhancedRoute.busId) {
            enhancedRoute.busId = `BUS${String(enhancedRoute._id).slice(-3)}`;
          }
          
          if (!enhancedRoute.routeName) {
            enhancedRoute.routeName = `${enhancedRoute.departureLocation || 'Unknown'} to ${enhancedRoute.arrivalLocation || 'Unknown'}`;
          }
          
          if (!enhancedRoute.busType) {
            enhancedRoute.busType = 'Standard';
          }
          
          if (!enhancedRoute.status) {
            enhancedRoute.status = 'pending';
          }
          
          if (!enhancedRoute.departureLocation) {
            enhancedRoute.departureLocation = 'Starting Point';
          }
          
          if (!enhancedRoute.arrivalLocation) {
            enhancedRoute.arrivalLocation = 'Destination';
          }
          
          if (!enhancedRoute.departureTime) {
            enhancedRoute.departureTime = '08:00';
          }
          
          if (!enhancedRoute.arrivalTime) {
            enhancedRoute.arrivalTime = '09:00';
          }
          
          if (!enhancedRoute.departureDate) {
            enhancedRoute.departureDate = new Date().toISOString();
          }
          
          if (!enhancedRoute.price) {
            enhancedRoute.price = '500';
          }
          
          // Log enhanced data for target buses
          if (enhancedRoute.busId === 'BUS003' || enhancedRoute.busId === 'BUS004' || enhancedRoute.busId === 'BUS005') {
            console.log(`=== ENHANCED ${enhancedRoute.busId} DATA ===`);
            console.log('Bus ID:', enhancedRoute.busId);
            console.log('Route Name:', enhancedRoute.routeName);
            console.log('Bus Type:', enhancedRoute.busType);
            console.log('Status:', enhancedRoute.status);
            console.log('Departure Location:', enhancedRoute.departureLocation);
            console.log('Arrival Location:', enhancedRoute.arrivalLocation);
            console.log('Departure Time:', enhancedRoute.departureTime);
            console.log('Arrival Time:', enhancedRoute.arrivalTime);
            console.log('Departure Date:', enhancedRoute.departureDate);
            console.log('Price:', enhancedRoute.price);
            console.log('=====================================');
          }
          
          return enhancedRoute;
        });
        
        setRoutes(enhancedRoutes)
        setPagination(response.data.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalRoutes: 0,
          hasNextPage: false,
          hasPrevPage: false
        })
        
        // Summary data set karanna - API response eken summary extract karanna
        if (response.data.data.summary) {
          setSummary(response.data.data.summary)
        } else {
          // Fallback: Calculate summary from routes data if API doesn't provide it
          updateSummaryCounts(enhancedRoutes)
        }
        
        console.log('FINAL ROUTES STATE:', enhancedRoutes);
        console.log('=== DATA LOADING COMPLETE ===');
      } else {
        // Fallback for malformed response
        console.log('MALFORMED API RESPONSE - USING FALLBACK');
        setRoutes([])
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalRoutes: 0,
          hasNextPage: false,
          hasPrevPage: false
        })
        setSummary({
          totalRoutes: 0,
          totalBuses: 0,
          certified: 0,
          pending: 0
        })
      }
    } catch (error) {
      console.error('Error loading routes:', error)
      // Set fallback data to prevent crash
      setRoutes([])
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalRoutes: 0,
        hasNextPage: false,
        hasPrevPage: false
      })
      setSummary({
        totalRoutes: 0,
        totalBuses: 0,
        certified: 0,
        pending: 0
      })
      
      // Show user-friendly error message
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        toast.error('Unable to connect to server. Please check if the backend is running.')
      } else {
        toast.error(getErrorMessage(error) || 'Failed to load routes')
      }
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Location options load karanna
  const loadLocationOptions = useCallback(async () => {
    try {
      const response = await routeAPI.getLocations()
      // Ensure response has expected structure
      if (response?.data?.data) {
        setLocationOptions(response.data.data)
      } else {
        // Fallback for malformed response
        setLocationOptions({
          departureLocations: [],
          arrivalLocations: []
        })
      }
    } catch (error) {
      console.error('Error loading locations:', error)
      // Set fallback data to prevent crash
      setLocationOptions({
        departureLocations: [],
        arrivalLocations: []
      })
      // Don't show toast for location errors to avoid spamming user
    }
  }, [])


  // Initial load
  useEffect(() => {
    loadRoutes()
    loadLocationOptions()
  }, [loadRoutes, loadLocationOptions])


  // Filter handlers
  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value }
    setFilters(newFilters)
    loadRoutes(1, newFilters)
  }

  // Pagination handler
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadRoutes(newPage)
    }
  }

  // Add route handler
  const handleAddRoute = () => {
    try {
      setSelectedRoute(null)
      setIsEditMode(false)
      setShowRouteModal(true)
    } catch (error) {
      console.error('Error opening add route modal:', error)
      toast.error('Failed to open add route modal')
    }
  }

  // Edit route handler
  const handleEditRoute = (route) => {
    try {
      if (!route || !route._id) {
        toast.error('Invalid route selected')
        return
      }
      setSelectedRoute(route)
      setIsEditMode(true)
      setShowRouteModal(true)
    } catch (error) {
      console.error('Error opening edit route modal:', error)
      toast.error('Failed to open edit route modal')
    }
  }

  // Delete route handler
  const handleDeleteRoute = (route) => {
    try {
      if (!route || !route._id) {
        toast.error('Invalid route selected')
        return
      }
      setSelectedRoute(route)
      setShowDeleteModal(true)
    } catch (error) {
      console.error('Error opening delete route modal:', error)
      toast.error('Failed to open delete route modal')
    }
  }

  // Routes are now filtered by backend API, no need for client-side filtering

  // NEW: Handle route selection for schedule filtering
  const handleRouteSelect = async (route) => {
    try {
      setSelectedRoute(route)
      // Fetch schedules for selected route and departure date from API
      const response = await routeAPI.getSchedules(route._id, departureDate)
      if (response?.data?.success) {
        setFilteredSchedules(response.data.data || [])
      } else {
        setFilteredSchedules([])
      }
    } catch (error) {
      console.error('Error selecting route:', error)
      toast.error('Failed to select route')
      setFilteredSchedules([])
    }
  }

  // NEW: Handle departure date change
  const handleDepartureDateChange = async (newDate) => {
    try {
      setDepartureDate(newDate)
      if (selectedRoute) {
        // Fetch schedules for selected route and new departure date from API
        const response = await routeAPI.getSchedules(selectedRoute._id, newDate)
        if (response?.data?.success) {
          setFilteredSchedules(response.data.data || [])
        } else {
          setFilteredSchedules([])
        }
      }
    } catch (error) {
      console.error('Error changing departure date:', error)
      toast.error('Failed to update departure date')
      setFilteredSchedules([])
    }
  }

  // NEW: Handle route status update
  const handleStatusUpdate = async (routeId, newStatus) => {
    try {
      await routeAPI.updateStatus(routeId, newStatus)
      toast.success(`Route status updated to ${newStatus}`)
      
      // Update local state to reflect the change
      setRoutes(prev => 
        prev.map(route => 
          route._id === routeId 
            ? { ...route, status: newStatus }
            : route
        )
      )
      
      // Recalculate summary counts
      const updatedRoutes = routes.map(route => 
        route._id === routeId 
          ? { ...route, status: newStatus }
          : route
      )
      updateSummaryCounts(updatedRoutes)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update route status')
      
      // Prevent dashboard crash by ensuring routes state remains valid
      setRoutes(prev => prev.filter(route => route && route._id))
    }
  }

  // NEW: Handle status-only modal opening
  const handleStatusOnlyModal = (route) => {
    setSelectedRoute(route)
    setIsEditMode(true)
    setIsStatusOnlyMode(true)
    setShowRouteModal(true)
  }

  // NEW: Calculate summary counts dynamically with case-insensitive filtering
  const updateSummaryCounts = (routesData) => {
    // Ensure routesData is a valid array
    if (!Array.isArray(routesData)) {
      console.log('Invalid routes data:', routesData)
      return
    }
    
    // Debug: Log actual status values in data
    const statusValues = routesData.map(r => r.status).filter(Boolean)
    console.log('Status values in data:', [...new Set(statusValues)])
    
    const certifiedCount = routesData.filter(route => 
      route.status && route.status.toLowerCase() === 'certified'
    ).length
    
    const pendingCount = routesData.filter(route => 
      route.status && route.status.toLowerCase() === 'pending'
    ).length
    
    const cancelledCount = routesData.filter(route => 
      route.status && route.status.toLowerCase() === 'cancelled'
    ).length
    
    console.log('Counts:', { certifiedCount, pendingCount, cancelledCount })
    
    setSummary(prev => ({
      ...prev,
      certified: certifiedCount,
      pending: pendingCount,
      totalBuses: routesData.length,
      totalRoutes: routesData.length
    }))
  }

  // Status Badge Component for better status display
  const StatusBadge = ({ status }) => {
    const styles = {
      pending:    { bg: "#fef3c7", color: "#d97706", label: "Pending" },
      certified:  { bg: "#d1fae5", color: "#059669", label: "Certified" },
      approved:   { bg: "#dbeafe", color: "#2563eb", label: "Approved" },
      rejected:   { bg: "#fee2e2", color: "#dc2626", label: "Rejected" },
      active:     { bg: "#d1fae5", color: "#059669", label: "Active" },
      inactive:   { bg: "#f3f4f6", color: "#6b7280", label: "Inactive" },
    };
    
    const key = status?.toLowerCase().trim() || "pending";
    const style = styles[key] || { bg: "#f3f4f6", color: "#374151", label: status };
    
    return (
      <span style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: "4px 12px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: "600",
        whiteSpace: "nowrap",
        display: "inline-block"
      }}>
        {style.label}
      </span>
    );
  };

  // Reactive counts using useMemo with correct logic and debugging
  // Debug: Log data structure to understand field names
  useEffect(() => {
    if (routes && routes.length > 0) {
      console.log("Sample bus record:", routes[0]);
      console.log("All statuses:", [...new Set(routes.map(b => b.status))]);
    }
  }, [routes]);

  const totalCount = useMemo(() => {
    if (!Array.isArray(routes)) return 0
    return routes.length
  }, [routes])

  const pendingCount = useMemo(() => {
    if (!Array.isArray(routes)) return 0
    return routes.filter(b => 
      b.status?.toLowerCase().trim() === "pending"
    ).length
  }, [routes])

  const certifiedCount = useMemo(() => {
    if (!Array.isArray(routes)) return 0
    return routes.filter(b => 
      ["certified", "approved", "active"].includes(b.status?.toLowerCase().trim())
    ).length
  }, [routes])

  const rejectedCount = useMemo(() => {
    if (!Array.isArray(routes)) return 0
    return routes.filter(b => 
      ["rejected", "inactive", "declined"].includes(b.status?.toLowerCase().trim())
    ).length
  }, [routes])

  // Route save handler (create/update)
  const handleSaveRoute = async (routeData) => {
    if (!routeData) {
      toast.error('Invalid route data provided')
      return
    }
    
    try {
      if (isEditMode && selectedRoute?._id) {
        // Update existing route
        await routeAPI.update(selectedRoute._id, routeData)
        toast.success(getSuccessMessage('update'))
      } else {
        // Create new route
        await routeAPI.create(routeData)
        toast.success(getSuccessMessage('create'))
      }
      
      setShowRouteModal(false)
      setIsStatusOnlyMode(false)
      loadRoutes(pagination.currentPage)
    } catch (error) {
      console.error('Error saving route:', error)
      toast.error(getErrorMessage(error))
    }
  }

  // Route delete handler
  const handleConfirmDelete = async () => {
    if (!selectedRoute?._id) {
      toast.error('No route selected for deletion')
      return
    }
    
    try {
      await routeAPI.delete(selectedRoute._id)
      toast.success(getSuccessMessage('delete'))
      setShowDeleteModal(false)
      loadRoutes(pagination.currentPage)
    } catch (error) {
      console.error('Error deleting route:', error)
      toast.error(getErrorMessage(error))
    }
  }

  // PDF report generate karanna
  const handleGenerateReport = async () => {
    if (!routes || routes.length === 0) {
      toast.error('No routes available to generate report')
      return
    }
    
    try {
      const result = generateRouteReport(routes, filters)
      if (result?.success) {
        toast.success('PDF report generated successfully')
      } else {
        toast.error(result?.error || 'Failed to generate PDF report')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Failed to generate PDF report. Please try again.')
    }
  }

  // Clear filters - consistent behavior for all date fields
  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      from: '',
      to: '',
      endDate: '' // Only remaining date fields
    }
    setFilters(clearedFilters)
    loadRoutes(1, clearedFilters)
  }

  return (
    <DashboardErrorBoundary>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-8 p-6 bg-white rounded-xl shadow-soft-lg border border-gray-100 transition-all duration-300 hover:shadow-soft">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-primary-200 hover:scale-105">
            <Bus className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Route & Schedule Management</h1>
            <p className="text-gray-600 text-sm">Manage bus routes, schedules, and transport operations</p>
          </div>
        </div>
        
        {/* Summary Cards Section - Reduced Size 4 Card Design */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '20px'
        }}>
          
          {/* Total Routes Card */}
          <div 
            style={{
              borderRadius: '16px',
              padding: '18px',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '100px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(139,92,246,0.3)',
              transition: 'transform 0.25s, box-shadow 0.25s',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(139,92,246,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(139,92,246,0.3)'
            }}
          >
            {/* Decorative circle */}
            <div style={{
              position: 'absolute',
              right: '-15px',
              top: '-15px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)'
            }} />
            
            {/* Top Row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <p style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  opacity: '0.85',
                  margin: '0'
                }}>
                  TOTAL ROUTES
                </p>
                <p style={{
                  fontSize: '32px',
                  fontWeight: '800',
                  margin: '4px 0 0',
                  lineHeight: '1'
                }}>
                  {totalCount}
                </p>
              </div>
              <span style={{
                fontSize: '28px',
                opacity: '0.9'
              }}>
                🛣️
              </span>
            </div>
            
            {/* Bottom Row */}
            <p style={{
              fontSize: '10px',
              opacity: '0.8',
              margin: '0',
              marginTop: '12px'
            }}>
              All active routes
            </p>
          </div>

          {/* Total Buses Card */}
          <div 
            style={{
              borderRadius: '16px',
              padding: '18px',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '100px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
              transition: 'transform 0.25s, box-shadow 0.25s',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(59,130,246,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.3)'
            }}
          >
            {/* Decorative circle */}
            <div style={{
              position: 'absolute',
              right: '-15px',
              top: '-15px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)'
            }} />
            
            {/* Top Row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <p style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  opacity: '0.85',
                  margin: '0'
                }}>
                  TOTAL BUSES
                </p>
                <p style={{
                  fontSize: '32px',
                  fontWeight: '800',
                  margin: '4px 0 0',
                  lineHeight: '1'
                }}>
                  {totalCount}
                </p>
              </div>
              <span style={{
                fontSize: '28px',
                opacity: '0.9'
              }}>
                🚌
              </span>
            </div>
            
            {/* Bottom Row */}
            <p style={{
              fontSize: '10px',
              opacity: '0.8',
              margin: '0',
              marginTop: '12px'
            }}>
              All registered buses
            </p>
          </div>

          {/* Certified Buses Card */}
          <div 
            style={{
              borderRadius: '16px',
              padding: '18px',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '100px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
              transition: 'transform 0.25s, box-shadow 0.25s',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(16,185,129,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,185,129,0.3)'
            }}
          >
            {/* Decorative circle */}
            <div style={{
              position: 'absolute',
              right: '-15px',
              top: '-15px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)'
            }} />
            
            {/* Top Row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <p style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  opacity: '0.85',
                  margin: '0'
                }}>
                  CERTIFIED BUSES
                </p>
                <p style={{
                  fontSize: '32px',
                  fontWeight: '800',
                  margin: '4px 0 0',
                  lineHeight: '1'
                }}>
                  {certifiedCount}
                </p>
              </div>
              <span style={{
                fontSize: '28px',
                opacity: '0.9'
              }}>
                ✅
              </span>
            </div>
            
            {/* Bottom Row */}
            <p style={{
              fontSize: '10px',
              opacity: '0.8',
              margin: '0',
              marginTop: '12px'
            }}>
              Fully certified & active
            </p>
          </div>

          {/* Pending Buses Card */}
          <div 
            style={{
              borderRadius: '16px',
              padding: '18px',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '100px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
              transition: 'transform 0.25s, box-shadow 0.25s',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(245,158,11,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,158,11,0.3)'
            }}
          >
            {/* Decorative circle */}
            <div style={{
              position: 'absolute',
              right: '-15px',
              top: '-15px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)'
            }} />
            
            {/* Top Row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <p style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  opacity: '0.85',
                  margin: '0'
                }}>
                  PENDING BUSES
                </p>
                <p style={{
                  fontSize: '32px',
                  fontWeight: '800',
                  margin: '4px 0 0',
                  lineHeight: '1'
                }}>
                  {pendingCount}
                </p>
              </div>
              <span style={{
                fontSize: '28px',
                opacity: '0.9'
              }}>
                ⏳
              </span>
            </div>
            
            {/* Bottom Row */}
            <p style={{
              fontSize: '10px',
              opacity: '0.8',
              margin: '0',
              marginTop: '12px'
            }}>
              Awaiting certification
            </p>
          </div>
        </div>
        
        {/* Action Bar - Exact Layout */}
        <div 
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            width: '100%',
            overflowX: 'auto',
            flexWrap: 'nowrap'
          }}
        >

          {/* FIELD 2: From Location Dropdown */}
          <select
            value={filters.from}
            onChange={(e) => handleFilterChange('from', e.target.value)}
            style={{
              width: '160px',
              minWidth: '160px',
              height: '40px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '0 12px',
              fontSize: '14px',
              appearance: 'none',
              whiteSpace: 'nowrap',
              boxSizing: 'border-box',
              flexShrink: 0
            }}
          >
            <option value="">From Location</option>
            {locationOptions.departureLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>

          {/* FIELD 3: To Location Dropdown */}
          <select
            value={filters.to}
            onChange={(e) => handleFilterChange('to', e.target.value)}
            style={{
              width: '160px',
              minWidth: '160px',
              height: '40px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '0 12px',
              fontSize: '14px',
              appearance: 'none',
              whiteSpace: 'nowrap',
              boxSizing: 'border-box',
              flexShrink: 0
            }}
          >
            <option value="">To Location</option>
            {locationOptions.arrivalLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>

          {/* FIELD 4: Departure Date */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => handleDepartureDateChange(e.target.value)}
              style={{
                width: '160px',
                minWidth: '160px',
                height: '40px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '0 8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                overflow: 'visible'
              }}
            />
          </div>

          {/* FIELD 5: Arrival Date */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              style={{
                width: '160px',
                minWidth: '160px',
                height: '40px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '0 8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                overflow: 'visible'
              }}
            />
          </div>

          {/* FIELD 6: Clear Filters Button */}
          <button
            onClick={handleClearFilters}
            style={{
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              height: '40px',
              padding: '0 16px',
              fontSize: '14px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              cursor: 'pointer'
            }}
          >
            Clear Filters
          </button>

          {/* BUTTON 1: Generate PDF */}
          <button
            onClick={handleGenerateReport}
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              height: '48px',
              minWidth: '130px',
              padding: '0 20px',
              fontSize: '14px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Download style={{ width: '16px', height: '16px', marginBottom: '4px' }} />
            Generate PDF
          </button>

          {/* BUTTON 2: Schedule Search */}
          <button
            onClick={() => setShowScheduleModal(true)}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              height: '48px',
              minWidth: '130px',
              padding: '0 20px',
              fontSize: '14px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Calendar style={{ width: '16px', height: '16px', marginBottom: '4px' }} />
            Schedule Search
          </button>

          {/* BUTTON 3: Add Route */}
          <button
            onClick={handleAddRoute}
            style={{
              background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              height: '48px',
              minWidth: '130px',
              padding: '0 20px',
              fontSize: '14px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Plus style={{ width: '16px', height: '16px', marginBottom: '4px' }} />
            Add Route
          </button>
        </div>
      </div>

      {/* Routes Table */}
      <div className="card shadow-soft-lg border border-gray-100 transition-all duration-300 hover:shadow-soft">
        {loading ? (
          // Loading state
          <div className="flex justify-center items-center py-16">
            <div className="spinner"></div>
          </div>
        ) : routes.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Bus Records Available</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">Get started by adding your first bus route to manage your transport schedule efficiently</p>
            <button onClick={handleAddRoute} className="btn-primary transition-all duration-300 hover:scale-105 hover:shadow-soft">
              <Plus className="w-4 h-4 mr-2" />
              Add Bus Route
            </button>
          </div>
        ) : (
          // Table
          <div className="overflow-x-auto scrollbar-thin">
            <table className="table">
              <thead>
                <tr>
                  <th className="table-header font-semibold text-gray-700 bg-gray-50">Bus ID</th>
                  <th className="table-header font-semibold text-gray-700 bg-gray-50">Route Name</th>
                  <th className="table-header font-semibold text-gray-700 bg-gray-50">Bus Type</th>
                  <th className="table-header font-semibold text-gray-700 bg-gray-50">Status</th>
                  <th className="table-header font-semibold text-gray-700 bg-gray-50">Departure</th>
                  <th className="table-header font-semibold text-gray-700 bg-gray-50">Arrival</th>
                  <th className="table-header font-semibold text-gray-700 bg-gray-50">Duration</th>
                  <th className="table-header font-semibold text-gray-700 bg-gray-50">Price</th>
                  <th className="table-header font-semibold text-gray-700 bg-gray-50">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {routes && routes.length > 0 ? (
                  routes.map((route) => {
                    // Enhanced Debug: Log specific bus records with all fields
                    if (route.busId === 'BUS003' || route.busId === 'BUS004' || route.busId === 'BUS005') {
                      console.log(`=== DEBUG ${route.busId} COMPLETE DATA ===`);
                      console.log('Bus ID:', route.busId);
                      console.log('Route Name:', route.routeName);
                      console.log('Bus Type:', route.busType);
                      console.log('Status:', route.status);
                      console.log('Departure Location:', route.departureLocation);
                      console.log('Arrival Location:', route.arrivalLocation);
                      console.log('Departure Time:', route.departureTime);
                      console.log('Arrival Time:', route.arrivalTime);
                      console.log('Departure Date:', route.departureDate);
                      console.log('Price:', route.price);
                      console.log('Complete Route Object:', route);
                      console.log('=====================================');
                    }
                    
                    // Ensure route has required properties before rendering
                    if (!route || !route._id) return null;
                    
                    return (
                      <tr 
                        key={route._id} 
                        className={`hover:bg-gray-50 transition-all duration-200 hover:shadow-soft cursor-pointer ${
                          selectedRoute?._id === route._id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                        }`}
                        onClick={() => handleRouteSelect(route)}
                      >
                        
                        {/* Bus ID */}
                        <td className="table-cell">
                          <span className="font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg text-sm">
                            {route.busId || `BUS${String(route._id).slice(-3)}`}
                          </span>
                        </td>
                        
                        {/* Route Name */}
                        <td className="table-cell font-medium text-gray-800">
                          {route.routeName || `${route.departureLocation || 'Unknown'} to ${route.arrivalLocation || 'Unknown'}`}
                        </td>
                        
                        {/* Bus Type */}
                        <td className="table-cell">
                          <span className="text-gray-700 bg-blue-50 px-2 py-1 rounded-md text-sm font-medium">
                            {route.busType || 'Standard'}
                          </span>
                        </td>
                        
                        {/* Status */}
                        <td className="table-cell">
                          <StatusBadge status={route.status || 'pending'} />
                        </td>
                      
                        {/* Departure */}
                        <td className="table-cell">
                          <div className="space-y-2">
                            <div className="flex items-center text-sm font-medium text-gray-800">
                              <MapPin className="w-3 h-3 mr-2 text-primary-500" />
                              <span className="text-truncate max-w-[120px]">
                                {route.departureLocation || 'Starting Point'}
                              </span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md w-fit">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTime(route.departureTime || '08:00')}
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(route.departureDate || new Date().toISOString())}
                            </div>
                          </div>
                        </td>
                      
                        {/* Arrival */}
                        <td className="table-cell">
                          <div className="space-y-2">
                            <div className="flex items-center text-sm font-medium text-gray-800">
                              <MapPin className="w-3 h-3 mr-2 text-success-500" />
                              <span className="text-truncate max-w-[120px]">
                                {route.arrivalLocation || 'Destination'}
                              </span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md w-fit">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTime(route.arrivalTime || '09:00')}
                            </div>
                          </div>
                        </td>
                      
                        {/* Duration */}
                        <td className="table-cell">
                          <div className="flex items-center">
                            {(() => {
                              // Calculate duration using the helper function
                              const calculatedDuration = calculateDuration(
                                route.departureTime || '08:00', 
                                route.arrivalTime || '09:00'
                              );
                              
                              // Validate calculated duration before rendering
                              if (calculatedDuration && typeof calculatedDuration === 'string') {
                                return (
                                  <div className={`bg-gray-50 px-3 py-1 rounded-lg text-sm font-semibold ${getDurationColor(calculatedDuration)}`}>
                                    {calculatedDuration}
                                  </div>
                                )
                              } else {
                                return (
                                  <div className="bg-gray-50 text-gray-500 px-3 py-1 rounded-lg text-sm font-semibold">
                                    1 hour
                                  </div>
                                )
                              }
                            })()}
                          </div>
                        </td>
                      
                        {/* Price */}
                        <td className="table-cell">
                          <div className="flex items-center">
                            <span className="text-gray-700 bg-green-50 px-2 py-1 rounded-md text-sm font-medium">
                              {formatPrice(route.price || '500')}
                            </span>
                          </div>
                        </td>
                      
                        {/* Actions */}
                        <td className="table-cell">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditRoute(route)
                              }}
                              className="p-2 bg-success-50 text-success-600 rounded-lg hover:bg-success-100 hover:text-success-800 transition-all duration-300 hover:scale-110 hover:shadow-soft group"
                              title="Edit route"
                            >
                              <Edit className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteRoute(route)
                              }}
                              className="p-2 bg-danger-50 text-danger-600 rounded-lg hover:bg-danger-100 hover:text-danger-800 transition-all duration-300 hover:scale-110 hover:shadow-soft group"
                              title="Delete route"
                            >
                              <Trash2 className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="10" className="table-cell text-center py-8">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <Bus className="w-16 h-16 text-gray-300" />
                        <div>
                          <p className="text-gray-500 font-medium">No bus records available</p>
                          <p className="text-gray-400 text-sm">Add your first bus route to get started</p>
                        </div>
                        <button
                          onClick={handleAddRoute}
                          className="btn-primary transition-all duration-300 hover:scale-105 hover:shadow-soft"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Bus Route
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Filtered Schedules Section */}
      {selectedRoute && (
        <div className="card p-6 shadow-soft-lg border border-gray-100 transition-all duration-300 hover:shadow-soft">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Schedules for {selectedRoute.routeName}
            </h2>
            <p className="text-gray-600 text-sm">
              Showing schedules for {formatDate(departureDate)}
            </p>
          </div>
          
          {filteredSchedules && filteredSchedules.length > 0 ? (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="table">
                <thead>
                  <tr>
                    <th className="table-header font-semibold text-gray-700 bg-gray-50">Bus ID</th>
                    <th className="table-header font-semibold text-gray-700 bg-gray-50">Departure</th>
                    <th className="table-header font-semibold text-gray-700 bg-gray-50">Arrival</th>
                    <th className="table-header font-semibold text-gray-700 bg-gray-50">Time</th>
                    <th className="table-header font-semibold text-gray-700 bg-gray-50">Status</th>
                    <th className="table-header font-semibold text-gray-700 bg-gray-50">Available Seats</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredSchedules.map((schedule) => (
                    <tr key={schedule._id} className="hover:bg-gray-50 transition-all duration-200 hover:shadow-soft">
                      <td className="table-cell">
                        <span className="font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg text-sm">
                          {schedule.busId || 'N/A'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center text-sm">
                          <MapPin className="w-3 h-3 mr-2 text-primary-500" />
                          {schedule.departureLocation || 'N/A'}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center text-sm">
                          <MapPin className="w-3 h-3 mr-2 text-success-500" />
                          {schedule.arrivalLocation || 'N/A'}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(schedule.departureTime || '')}
                        </div>
                      </td>
                      <td className="table-cell">
                        <StatusBadge status={schedule.status} />
                      </td>
                      <td className="table-cell">
                        <span className="text-green-700 bg-green-50 px-2 py-1 rounded-md text-sm font-medium">
                          {schedule.availableSeats || 'N/A'} seats
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Schedules Available</h3>
              <p className="text-gray-500">No schedules found for this route on {formatDate(departureDate)}</p>
            </div>
          )}
        </div>
      )}

      {/* Route Modal */}
      {showRouteModal && (
        <RouteModal
          route={selectedRoute}
          isEditMode={isEditMode}
          isStatusOnlyMode={isStatusOnlyMode}
          onClose={() => setShowRouteModal(false)}
          onSave={handleSaveRoute}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRoute && (
        <DeleteModal
          route={selectedRoute}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Schedule Search Modal */}
      {showScheduleModal && (
        <ScheduleModal
          onClose={() => setShowScheduleModal(false)}
        />
      )}
      </div>
    </DashboardErrorBoundary>
  )
}

export default Dashboard
