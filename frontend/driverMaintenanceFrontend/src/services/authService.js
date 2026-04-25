import api from './api'

export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials)
  if (response.data.token) {
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data))
  }
  return response.data
}

export const maintenanceLogin = async (credentials) => {
  // driver-maintenance users authenticate via the standard /auth/login endpoint
  const response = await api.post('/auth/login', credentials)
  if (response.data.token) {
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data))
  }
  return response.data
}

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData)
  if (response.data.token) {
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data))
  }
  return response.data
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const getCurrentUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}
