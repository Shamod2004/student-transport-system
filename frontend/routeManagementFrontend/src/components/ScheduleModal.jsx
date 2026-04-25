import React, { useState, useEffect } from 'react'
import { routeAPI } from '../services/api'
import { formatTime, formatDate, getErrorMessage, formatPrice } from '../utils/helpers'
import { generateScheduleReport } from '../utils/schedulePdfGenerator'
import toast from 'react-hot-toast'
import { Calendar, Search, Download, Bus, Clock, MapPin, X, Filter, RefreshCw } from 'lucide-react'

const ScheduleModal = ({ onClose }) => {
  const [selectedDate, setSelectedDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [scheduleData, setScheduleData] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredBuses, setFilteredBuses] = useState([])
  const [selectedRoute, setSelectedRoute] = useState('')
  const [routeBuses, setRouteBuses] = useState([])
  const [showRouteSuggestions, setShowRouteSuggestions] = useState(false)
  const [routeLoading, setRouteLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Manual refresh function
  const handleRefresh = async () => {
    if (selectedDate) {
      setRefreshing(true)
      try {
        await handleDateChange(selectedDate)
        toast.success('Schedule refreshed successfully!')
      } catch (error) {
        toast.error('Failed to refresh schedule')
      } finally {
        setRefreshing(false)
      }
    }
  }

  // Date change wadima schedule load karanna
  const handleDateChange = async (date) => {
    setSelectedDate(date)
    if (!date) {
      // If no date provided, let backend handle current date automatically
      try {
        setLoading(true)
        const response = await routeAPI.getScheduleByDate('')
        setScheduleData(response.data.data)
        setFilteredBuses(response.data.data.buses)
        setSelectedDate(response.data.data.selectedDate)
      } catch (error) {
        console.error('Error loading schedule:', error)
        toast.error(getErrorMessage(error))
        setScheduleData(null)
        setFilteredBuses([])
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      setLoading(true)
      const response = await routeAPI.getScheduleByDate(date)
      setScheduleData(response.data.data)
      setFilteredBuses(response.data.data.buses)
      
      if (response.data.data.metadata?.autoCurrentDate) {
        toast.success(`Showing today's schedule (${response.data.data.selectedDate})`)
      }
    } catch (error) {
      console.error('Error loading schedule:', error)
      toast.error(getErrorMessage(error))
      setScheduleData(null)
      setFilteredBuses([])
    } finally {
      setLoading(false)
    }
  }

  // Search functionality
  useEffect(() => {
    if (!scheduleData?.buses) return

    const filtered = scheduleData.buses.filter(bus => 
      bus.busId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.departureLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.arrivalLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.busType.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredBuses(filtered)
  }, [searchTerm, scheduleData])

  // Route-based search functionality
  const handleRouteSearch = async (routeName) => {
    if (!routeName.trim()) {
      setRouteBuses([])
      setShowRouteSuggestions(false)
      return
    }
    
    try {
      setRouteLoading(true)
      const response = await routeAPI.getBusesByRoute(routeName)
      setRouteBuses(response.data.data.buses || [])
      setShowRouteSuggestions(true)
      
      if (scheduleData?.buses) {
        const routeFiltered = scheduleData.buses.filter(bus =>
          bus.routeName.toLowerCase().includes(routeName.toLowerCase())
        )
        setFilteredBuses(routeFiltered)
      }
    } catch (error) {
      console.error('Error searching route:', error)
      toast.error(getErrorMessage(error))
      setRouteBuses([])
      setShowRouteSuggestions(false)
    } finally {
      setRouteLoading(false)
    }
  }

  // Clear route search
  const handleClearRouteSearch = () => {
    setSelectedRoute('')
    setRouteBuses([])
    setShowRouteSuggestions(false)
    if (scheduleData?.buses) {
      setFilteredBuses(scheduleData.buses)
    }
  }

  // PDF report generate karanna
  const handleGenerateReport = () => {
    if (!scheduleData) {
      toast.error('No schedule data available for report generation')
      return
    }
    
    try {
      const result = generateScheduleReport(scheduleData)
      if (result.success) {
        toast.success('Schedule report generated successfully!')
      } else {
        toast.error(result.error || 'Failed to generate report')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Failed to generate report')
    }
  }

  // Today's date set karanna as default and auto-load schedule
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)
    handleDateChange(today)
  }, [])

  // Auto-refresh schedule every 30 seconds to show latest data
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedDate) {
        handleDateChange(selectedDate)
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [selectedDate])

  return (
    <div className="modal-overlay">
      <div className="bg-white rounded-xl shadow-soft-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Bus Schedule Search</h2>
                <p className="text-gray-600 text-sm">Find buses scheduled for specific date</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Date Selection */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="input-field"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {scheduleData && (
              <div className="flex gap-3 flex-wrap">
                <div className="text-sm text-gray-600 flex items-center">
                  <span className="font-semibold text-primary-600">{scheduleData.summary.totalBuses}</span> buses found
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  onClick={handleGenerateReport}
                  className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Generate Report
                </button>
              </div>
            )}
          </div>

          {/* Route-based Search */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Route (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedRoute}
                  onChange={(e) => {
                    setSelectedRoute(e.target.value)
                    handleRouteSearch(e.target.value)
                  }}
                  placeholder="Enter route name..."
                  className="input-field pr-10"
                />
                {selectedRoute && (
                  <button
                    onClick={handleClearRouteSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Route Suggestions */}
              {showRouteSuggestions && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {routeBuses.length > 0 ? (
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        {routeBuses.length} buses found for this route
                      </p>
                      {routeBuses.slice(0, 5).map((bus, index) => (
                        <div
                          key={index}
                          className="p-2 hover:bg-gray-50 rounded cursor-pointer text-sm"
                          onClick={() => {
                            setSelectedRoute(bus.routeName)
                            setShowRouteSuggestions(false)
                          }}
                        >
                          <div className="font-medium text-gray-900">{bus.routeName}</div>
                          <div className="text-gray-500">{bus.busId} • {bus.departureTime}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-sm text-gray-500">
                      No buses available for selected route
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {scheduleData && (
          <div className="p-6 border-b border-gray-200">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by bus ID, route, location..."
                className="input-field pl-10"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="spinner"></div>
            </div>
          ) : !scheduleData ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Date</h3>
              <p className="text-gray-500">Choose a date to view scheduled buses</p>
            </div>
          ) : filteredBuses.length === 0 ? (
            <div className="text-center py-12">
              <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Buses Found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search' : 'No buses scheduled for this date'}
              </p>
            </div>
          ) : (
            <div>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Total Buses</p>
                      <p className="text-2xl font-bold text-blue-900">{scheduleData.summary.totalBuses}</p>
                    </div>
                    <Bus className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Available Seats</p>
                      <p className="text-2xl font-bold text-green-900">{scheduleData.summary.totalAvailableSeats || 0}</p>
                    </div>
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-600 text-sm font-medium">Booked Seats</p>
                      <p className="text-2xl font-bold text-yellow-900">{scheduleData.summary.totalBookedSeats || 0}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">Fully Booked</p>
                      <p className="text-2xl font-bold text-purple-900">{scheduleData.summary.fullyBookedBuses || 0}</p>
                    </div>
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">!</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time-based Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center">
                      <span className="text-green-700 text-xs font-bold">M</span>
                    </div>
                    <div>
                      <p className="text-green-600 text-xs font-medium">Morning</p>
                      <p className="text-lg font-bold text-green-900">{scheduleData.summary.morningBuses || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center">
                      <span className="text-yellow-700 text-xs font-bold">A</span>
                    </div>
                    <div>
                      <p className="text-yellow-600 text-xs font-medium">Afternoon</p>
                      <p className="text-lg font-bold text-yellow-900">{scheduleData.summary.afternoonBuses || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center">
                      <span className="text-blue-700 text-xs font-bold">E</span>
                    </div>
                    <div>
                      <p className="text-blue-600 text-xs font-medium">Evening</p>
                      <p className="text-lg font-bold text-blue-900">{scheduleData.summary.eveningBuses || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center">
                      <span className="text-purple-700 text-xs font-bold">N</span>
                    </div>
                    <div>
                      <p className="text-purple-600 text-xs font-medium">Night</p>
                      <p className="text-lg font-bold text-purple-900">{scheduleData.summary.nightBuses || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buses Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bus ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Route
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Departure
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Arrival
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seats
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Utilization
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time Slot
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredBuses.map((bus, index) => {
                        const isHighlightedBus = ['BUS003', 'BUS004', 'BUS005', 'BUS011', 'BUS012'].includes(bus.busId)
                        return (
                        <tr key={bus._id || index} className={`hover:bg-gray-50 transition-colors ${isHighlightedBus ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}`}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`font-semibold px-2 py-1 rounded text-sm ${
                              isHighlightedBus 
                                ? 'bg-yellow-200 text-yellow-900' 
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              {bus.busId}
                              {isHighlightedBus && <span className="ml-1 text-xs">✨</span>}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{bus.routeName}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded">
                              {bus.busType}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <div className="flex items-center text-gray-900">
                                <MapPin className="w-3 h-3 mr-1 text-primary-500" />
                                {bus.departureLocation}
                              </div>
                              <div className="flex items-center text-gray-500 text-xs mt-1">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTime(bus.departureTime)}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <div className="flex items-center text-gray-900">
                                <MapPin className="w-3 h-3 mr-1 text-success-500" />
                                {bus.arrivalLocation}
                              </div>
                              <div className="flex items-center text-gray-500 text-xs mt-1">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTime(bus.arrivalTime)}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {bus.availableSeats}/{bus.totalSeats}
                              </div>
                              <div className="text-xs text-gray-500">
                                {bus.availableSeats} available
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={`w-12 h-2 rounded-full ${
                                bus.seatUtilization >= 90 ? 'bg-red-400' :
                                bus.seatUtilization >= 70 ? 'bg-yellow-400' :
                                'bg-green-400'
                              }`}></div>
                              <span className={`text-sm font-medium ${
                                bus.seatUtilization >= 90 ? 'text-red-600' :
                                bus.seatUtilization >= 70 ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {bus.seatUtilization}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              bus.status === 'Certified' 
                                ? 'bg-success-100 text-success-800' 
                                : bus.status === 'Pending'
                                ? 'bg-warning-100 text-warning-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {bus.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              bus.timeCategory === 'morning' ? 'bg-green-100 text-green-800' :
                              bus.timeCategory === 'afternoon' ? 'bg-yellow-100 text-yellow-800' :
                              bus.timeCategory === 'evening' ? 'bg-blue-100 text-blue-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {bus.timeCategory === 'morning' ? '🌅 Morning' :
                               bus.timeCategory === 'afternoon' ? '☀️ Afternoon' :
                               bus.timeCategory === 'evening' ? '🌆 Evening' :
                               '🌙 Night'}
                            </span>
                          </td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ScheduleModal
