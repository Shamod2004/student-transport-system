import api from './api'

export const getAllInspections = () => api.get('/inspections')
export const getInspectionsByDriver = (driverId) => api.get(`/inspections/driver/${driverId}`)
export const createInspection = (data) => api.post('/inspections', data)
export const getInspectionById = (id) => api.get(`/inspections/${id}`)
export const updateInspection = (id, data) => api.put(`/inspections/${id}`, data)
export const deleteInspection = (id) => api.delete(`/inspections/${id}`)
