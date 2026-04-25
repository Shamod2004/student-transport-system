import api from './api'

export const getAllTickets = () => api.get('/maintenance')
export const createTicket = (data) => api.post('/maintenance', data)
export const updateTicket = (id, data) => api.put(`/maintenance/${id}`, data)
export const deleteTicket = (id) => api.delete(`/maintenance/${id}`)

export const getAllReports = () => api.get('/condition-reports')
export const createReport = (data) => api.post('/condition-reports', data)
export const updateReport = (id, data) => api.put(`/condition-reports/${id}`, data)
export const deleteReport = (id) => api.delete(`/condition-reports/${id}`)
