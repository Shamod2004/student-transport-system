import api from './api'

export const getAllWorkOrders = () => api.get('/work-orders')
export const createWorkOrder = (data) => api.post('/work-orders', data)
export const updateWorkOrder = (id, data) => api.put(`/work-orders/${id}`, data)
export const deleteWorkOrder = (id) => api.delete(`/work-orders/${id}`)
