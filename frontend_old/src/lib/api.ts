import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

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
    
    // 401 hatası ve henüz retry edilmemişse
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const { refreshToken, setTokens, logout } = useAuthStore.getState()
        
        if (!refreshToken) {
          logout()
          window.location.href = '/auth/login'
          return Promise.reject(error)
        }

        // Token yenilemeyi dene
        const response = await axios.post(`${API_URL}/auth/refresh/`, {
            refresh: refreshToken
        })

        const { access } = response.data
        
        // Yeni token'ı store'a kaydet (refresh değişmemiş olabilir, access değişti)
        setTokens(access, refreshToken)

        // İsteği yeni token ile tekrarla
        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)

      } catch (refreshError) {
        // Yenileme başarısızsa çıkış yap
        useAuthStore.getState().logout()
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

export default api
