import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const { refreshToken, setTokens } = useAuthStore.getState()
        
        if (!refreshToken) {
          // No refresh token - redirect to lock screen
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/lock-screen'
          }
          return Promise.reject(error)
        }

        const response = await axios.post(`${API_URL}/auth/refresh/`, {
            refresh: refreshToken
        })

        const { access } = response.data
        // Token'ları güncelle ve isAuthenticated'ı true yap
        useAuthStore.setState({ 
          accessToken: access, 
          refreshToken: refreshToken,
          isAuthenticated: true 
        })

        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)

      } catch (refreshError) {
        // Refresh failed - redirect to lock screen
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/lock-screen'
        }
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

export default api

