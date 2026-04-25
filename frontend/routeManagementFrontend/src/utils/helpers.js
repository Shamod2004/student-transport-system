import { format, parseISO, isPast, isToday, isTomorrow } from 'date-fns'

// Date format karanna - user friendly display karanna
export const formatDate = (dateString) => {
  if (!dateString) {
    return 'No Date'
  }
  
  try {
    const date = parseISO(dateString)
    return format(date, 'MMM dd, yyyy') // Example: Jan 15, 2024
  } catch (error) {
    return 'Invalid Date'
  }
}

// Time format karanna - 12-hour format eka display karanna
export const formatTime = (timeString) => {
  if (!timeString) {
    return 'No Time'
  }
  
  try {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}` // Example: 2:30 PM
  } catch (error) {
    return 'Invalid Time'
  }
}

// Calculate duration between departure and arrival times - with detailed comments
export const calculateDuration = (departureTime, arrivalTime) => {
  // STEP 1: Input validation to prevent runtime errors
  // Ensure both times are provided and are valid strings
  if (!departureTime || !arrivalTime || 
      typeof departureTime !== 'string' || typeof arrivalTime !== 'string') {
    return null // Return null for invalid inputs
  }
  
  try {
    // STEP 2: Parse time strings into Date objects for calculation
    // Using a fixed date to avoid timezone complications
    // Format expected: "HH:MM" (e.g., "14:30", "09:15")
    const [depHours, depMinutes] = departureTime.split(':').map(Number)
    const [arrHours, arrMinutes] = arrivalTime.split(':').map(Number)
    
    // Validate parsed time components
    if (isNaN(depHours) || isNaN(depMinutes) || isNaN(arrHours) || isNaN(arrMinutes)) {
      return null // Return null for invalid time formats
    }
    
    // STEP 3: Create Date objects with the same date but different times
    // This allows us to calculate the time difference accurately
    const baseDate = new Date(2000, 0, 1) // Arbitrary date (Jan 1, 2000)
    
    const departureDate = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      depHours,
      depMinutes,
      0, // seconds
      0  // milliseconds
    )
    
    let arrivalDate = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      arrHours,
      arrMinutes,
      0, // seconds
      0  // milliseconds
    )
    
    // STEP 4: Handle overnight routes (arrival next day)
    // If arrival time is earlier than departure time, it's next day
    if (arrivalDate <= departureDate) {
      arrivalDate = new Date(arrivalDate.getTime() + (24 * 60 * 60 * 1000)) // Add 24 hours
    }
    
    // STEP 5: Calculate the time difference in minutes
    // This gives us the total travel time
    const timeDifference = arrivalDate.getTime() - departureDate.getTime()
    const totalMinutes = Math.round(timeDifference / (1000 * 60))
    
    // STEP 6: Validate the calculated duration
    // Ensure we have a reasonable positive duration
    if (totalMinutes <= 0 || totalMinutes > (24 * 60)) { // Max 24 hours
      return null // Invalid duration
    }
    
    // STEP 7: Convert minutes to human-readable format
    // Create formatted string like "2h 30m" or "45m"
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    if (hours > 0 && minutes > 0) {
      // Both hours and minutes (e.g., "2h 30m")
      return `${hours}h ${minutes}m`
    } else if (hours > 0) {
      // Only hours (e.g., "2h")
      return `${hours}h`
    } else {
      // Only minutes (e.g., "45m")
      return `${minutes}m`
    }
    
  } catch (error) {
    // STEP 8: Error handling for unexpected issues
    console.error('Duration calculation error:', error)
    return null // Return null for any calculation errors
  }
}

// Duration color determine karanna - enhanced with robust error handling and detailed comments
export const getDurationColor = (durationString) => {
  // STEP 1: Comprehensive input validation
  // Ensure we have valid data before processing to prevent runtime errors
  if (!durationString) {
    // Case: duration is null, undefined, or empty string
    return 'text-gray-700 font-semibold' // Neutral gray for missing data
  }
  
  if (typeof durationString !== 'string') {
    // Case: duration is not a string (could be number, object, etc.)
    return 'text-gray-700 font-semibold' // Neutral gray for invalid type
  }
  
  // STEP 2: Clean and normalize the duration string
  // Remove extra whitespace and convert to lowercase for consistent processing
  const cleanDuration = durationString.toString().trim().toLowerCase()
  
  if (!cleanDuration) {
    // Case: duration becomes empty after cleaning
    return 'text-gray-700 font-semibold' // Neutral gray for empty data
  }
  
  // STEP 3: Extract hours and minutes using robust regex patterns
  // Handle various formats: "2h 30m", "2h", "30m", "2h30m", "2.5h", etc.
  const hourMatch = cleanDuration.match(/(\d+(?:\.\d+)?)\s*h/)
  const minuteMatch = cleanDuration.match(/(\d+)\s*m/)
  
  // Parse hours and minutes with proper fallbacks
  let hours = 0
  let minutes = 0
  
  if (hourMatch) {
    // Handle decimal hours (e.g., "2.5h" = 2.5 hours)
    hours = parseFloat(hourMatch[1]) || 0
  }
  
  if (minuteMatch) {
    // Parse minutes as integer
    minutes = parseInt(minuteMatch[1]) || 0
  }
  
  // STEP 4: Convert to total minutes for accurate comparison
  // This standardizes all durations for consistent comparison
  const totalMinutes = Math.round((hours * 60) + minutes)
  
  // STEP 5: Validate calculated duration
  // Ensure we have a reasonable duration value
  if (totalMinutes < 0 || isNaN(totalMinutes)) {
    return 'text-gray-700 font-semibold' // Neutral gray for invalid calculations
  }
  
  // STEP 6: Apply conditional color based on duration thresholds
  // These thresholds are designed for typical bus route durations
  if (totalMinutes < 60) {
    // Short duration: Less than 1 hour (0-59 minutes)
    // Green color indicates quick, efficient routes
    // High contrast against gray background for accessibility
    return 'text-green-600 font-semibold'
  } else if (totalMinutes <= 180) {
    // Medium duration: 1-3 hours (60-180 minutes)
    // Orange color indicates moderate travel time
    // Good visibility against gray background
    return 'text-orange-600 font-semibold'
  } else if (totalMinutes <= 480) {
    // Long duration: 3-8 hours (180-480 minutes)
    // Red color indicates lengthy journeys requiring planning
    // Strong contrast for immediate attention
    return 'text-red-600 font-semibold'
  } else {
    // Very long duration: More than 8 hours (480+ minutes)
    // Dark red color for extremely long routes
    // Maximum contrast for critical visibility
    return 'text-red-800 font-semibold'
  }
}

// Route status determine karanna - date base karanna
export const getRouteStatus = (departureDate, status) => {
  // Handle invalid or missing departureDate
  if (!departureDate) {
    const statusMap = {
      'Certified': { status: 'Certified', className: 'status-certified' },
      'Pending': { status: 'Pending', className: 'status-pending' },
      'Cancelled': { status: 'Cancelled', className: 'status-cancelled' }
    }
    return statusMap[status] || { status: 'Pending', className: 'status-pending' }
  }

  let date
  try {
    date = parseISO(departureDate)
  } catch (error) {
    console.error('Invalid date format:', departureDate, error)
    // Fallback for invalid date
    const statusMap = {
      'Certified': { status: 'Certified', className: 'status-certified' },
      'Pending': { status: 'Pending', className: 'status-pending' },
      'Cancelled': { status: 'Cancelled', className: 'status-cancelled' }
    }
    return statusMap[status] || { status: 'Pending', className: 'status-pending' }
  }
  
  // Already cancelled nam return karanna
  if (status === 'Cancelled') {
    return { status: 'Cancelled', className: 'status-cancelled' }
  }
  
  // Past date nam 'Pending' kiyla show karanna (never show expired)
  if (isPast(date) && !isToday(date)) {
    return { status: 'Pending', className: 'status-pending' }
  }
  
  // Today nam 'Certified' with special indicator
  if (isToday(date)) {
    return { status: 'Certified (Today)', className: 'status-certified' }
  }
  
  // Tomorrow nam 'Certified' with special indicator
  if (isTomorrow(date)) {
    return { status: 'Certified (Tomorrow)', className: 'status-certified' }
  }
  
  // Otherwise normal status return karanna
  const statusMap = {
    'Certified': { status: 'Certified', className: 'status-certified' },
    'Pending': { status: 'Pending', className: 'status-pending' },
  }
  
  return statusMap[status] || { status: 'Pending', className: 'status-pending' }
}

// Debounce function - search input optimize karanna
export const debounce = (func, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

// Validation helper - required fields check karanna
export const validateRequired = (value, fieldName) => {
  if (!value || value.toString().trim() === '') {
    return `${fieldName} is required`
  }
  return null
}

// Time validation - HH:MM format check karanna
export const validateTimeFormat = (time) => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(time)) {
    return 'Time format must be HH:MM (24-hour format)'
  }
  return null
}

// Time comparison - departure before arrival kiyla check karanna
export const validateTimeSequence = (departureTime, arrivalTime) => {
  if (!departureTime || !arrivalTime) return null
  
  const [depHours, depMinutes] = departureTime.split(':').map(Number)
  const [arrHours, arrMinutes] = arrivalTime.split(':').map(Number)
  
  const depTotalMinutes = depHours * 60 + depMinutes
  let arrTotalMinutes = arrHours * 60 + arrMinutes
  
  // Next day scenario handle karanna
  if (arrTotalMinutes <= depTotalMinutes) {
    arrTotalMinutes += 24 * 60
  }
  
  if (depTotalMinutes >= arrTotalMinutes) {
    return 'Departure time must be before arrival time'
  }
  
  return null
}

// Date validation - past date prevent karanna
export const validateDateNotPast = (dateString) => {
  if (!dateString) return null
  
  const selectedDate = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (selectedDate < today) {
    return 'Date cannot be in the past'
  }
  
  return null
}

// Bus ID validation - uppercase convert karanna
export const formatBusId = (busId) => {
  return busId ? busId.toString().toUpperCase().trim() : ''
}

// Error message extract karanna API response eken
export const getErrorMessage = (error) => {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  if (error?.response?.data?.errors) {
    return error.response.data.errors.join(', ')
  }
  return error?.message || 'An unexpected error occurred'
}

// Success message generate karanna
export const getSuccessMessage = (action, item = 'Route') => {
  const messages = {
    create: `${item} created successfully`,
    update: `${item} updated successfully`,
    delete: `${item} deleted successfully`,
  }
  return messages[action] || 'Operation completed successfully'
}

// Pagination calculate karanna
export const getPaginationInfo = (currentPage, totalPages, totalItems, itemsPerPage) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)
  
  return {
    startItem,
    endItem,
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage
  }
}

// CSV data prepare karanna PDF report walata
export const prepareReportData = (routes) => {
  return routes.map(route => ({
    'Bus ID': route.busId,
    'Route Name': route.routeName,
    'Bus Type': route.busType,
    'Status': route.status,
    'Departure': `${route.departureLocation} - ${formatTime(route.departureTime)}`,
    'Arrival': `${route.arrivalLocation} - ${formatTime(route.arrivalTime)}`,
    'Date': formatDate(route.departureDate),
    'Duration': route.duration
  }))
}

// Format price with LKR currency symbol and handle MongoDB Decimal128
export const formatPrice = (price) => {
  if (price === null || price === undefined) {
    return 'LKR 0.00'
  }
  
  // Handle MongoDB Decimal128 object
  if (typeof price === 'object' && price !== null) {
    return `LKR ${price.toString()}`
  }
  
  // Handle regular numbers and strings
  const num = parseFloat(price)
  return `LKR ${isNaN(num) ? '0.00' : num.toFixed(2)}`
}

// Safe price conversion for rendering
export const safePriceToString = (price) => {
  if (price === null || price === undefined) {
    return '0.00'
  }
  
  // Handle MongoDB Decimal128 object
  if (typeof price === 'object' && price !== null) {
    return price.toString()
  }
  
  // Handle regular numbers and strings
  const num = parseFloat(price)
  return isNaN(num) ? '0.00' : num.toString()
}
