import api from './api'

export const getAllBuses = () => api.get('/buses')
export const getBusById = (id) => api.get(`/buses/${id}`)
export const createBus = (data) => api.post('/buses', data)
export const updateBus = (id, data) => api.put(`/buses/${id}`, data)
export const deleteBus = (id) => api.delete(`/buses/${id}`)
