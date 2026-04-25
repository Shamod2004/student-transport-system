import axios from 'axios'

// Axios instance eka create karanna base configuration tihina
const api = axios.create({
  baseURL: '/api', // Use relative URL for Vite proxy
  timeout: 10000, // Request timeout - 10 seconds
  headers: {
    'Content-Type': 'application/json', // JSON content type
  },
})

// Request interceptor - every request ekata headers add karanna
api.interceptors.request.use(
  (config) => {
    // Console eka log karanna request details
    if (config?.method && config?.url) {
      console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`)
    }
    return config
  },
  (error) => {
    // Request error handle karanna
    console.error('Request Error:', error?.message || 'Unknown request error')
    return Promise.reject(error)
  }
)

// Response interceptor - response handle karanna
api.interceptors.response.use(
  (response) => {
    // Success response log karanna
    if (response?.status && response?.config?.url) {
      console.log(`API Response: ${response.status} ${response.config.url}`)
    }
    return response
  },
  (error) => {
    // Error response handle karanna
    const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred'
    console.error('Response Error:', errorMessage)
    
    // Custom error object ekak create karanna
    const customError = new Error(errorMessage)
    customError.status = error?.response?.status || 500
    customError.data = error?.response?.data || null
    
    return Promise.reject(customError)
  }
)

// Route API methods
export const routeAPI = {
  // All routes ganna with filters and pagination
  getRoutes: (params = {}) => {
    return api.get('/routes', { params })
  },
  
  // All routes ganna with filters and pagination (alias for getRoutes)
  getAll: (params = {}) => {
    return api.get('/routes', { params })
  },
  
  // Single route eka ganna ID eken
  getById: (id) => {
    return api.get(`/routes/${id}`)
  },
  
  // New route eka create karanna
  create: (data) => {
    return api.post('/routes', data)
  },
  
  // Existing route eka update karanna
  update: (id, data) => {
    return api.put(`/routes/${id}`, data)
  },
  
  // Route eka delete karanna
  delete: (id) => {
    return api.delete(`/routes/${id}`)
  },
  
  // Unique locations ganna filters walata
  getLocations: () => {
    return api.get('/routes/locations')
  },
  
  // Date base karanna schedule ganna (new feature)
  getScheduleByDate: (date) => {
    return api.get('/routes/schedule', { params: { date } })
  },
  
  // Get schedules with routeId and departureDate filtering
  getSchedules: (routeId, departureDate) => {
    return api.get('/routes/schedule', { params: { routeId, departureDate } })
  },
  
  // Route-based bus search (new feature)
  getBusesByRoute: (routeName) => {
    return api.get(`/routes/${encodeURIComponent(routeName)}/buses`)
  },
  
  // Update route status
  updateStatus: (id, status) => {
    return api.put(`/routes/${id}/status`, { status })
  }
}

// Export default api instance for other uses
export default api
