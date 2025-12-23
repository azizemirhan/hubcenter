import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

export const authService = {
    async login(email, password) {
        const response = await api.post('/auth/login/', { email, password })
        const { access, refresh, user } = response.data

        useAuthStore.getState().setAuth(user, access, refresh)
        return response.data
    },

    async getMe() {
        const response = await api.get('/auth/me/')
        return response.data
    },

    async logout() {
        useAuthStore.getState().logout()
        // Opsiyonel: Backend'e logout isteği atılabilir (blacklist için)
    },

    async getMyCompanies() {
        const response = await api.get('/organization/companies/mine/')
        return response.data
    }
}
