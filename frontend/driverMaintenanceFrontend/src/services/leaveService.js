import api from './api'

export const getAllLeaveRequests = async () => {
  return await api.get('/leaves')
}

export const getLeavesByDriver = async (driverId) => {
  return await api.get(`/leaves/driver/${driverId}`)
}

export const createLeaveRequest = async (leaveData) => {
  return await api.post('/leaves', leaveData)
}

export const updateLeaveStatus = async (id, status) => {
  return await api.put(`/leaves/${id}/status`, { status })
}
