import api from './api'

export const getAllRouteAssignments = () => api.get('/route-assignments')
export const getAssignmentsByDriver = (driverId) => api.get(`/route-assignments/driver/${driverId}`)
export const createRouteAssignment = (data) => api.post('/route-assignments', data)
export const updateRouteAssignment = (id, data) => api.put(`/route-assignments/${id}`, data)
export const deleteRouteAssignment = (id) => api.delete(`/route-assignments/${id}`)
