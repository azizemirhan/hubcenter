import api from '../lib/api'

export const domainService = {
  async getDomains(params = {}) {
    const response = await api.get('/domains/list/', { params })
    return response.data
  },

  async getDomainsSummary() {
    const response = await api.get('/domains/list/summary/')
    return response.data
  },

  async getExpiringSoon() {
    const response = await api.get('/domains/list/expiring_soon/')
    return response.data
  },

  async getDomain(id) {
    const response = await api.get(`/domains/list/${id}/`)
    return response.data
  },

  async createDomain(data) {
    const response = await api.post('/domains/list/', data)
    return response.data
  },

  async updateDomain(id, data) {
    const response = await api.put(`/domains/list/${id}/`, data)
    return response.data
  },

  async deleteDomain(id) {
    const response = await api.delete(`/domains/list/${id}/`)
    return response.data
  }
}

export const hostingService = {
  async getHostings(params = {}) {
    const response = await api.get('/domains/hosting/', { params })
    return response.data
  },

  async getHostingsSummary() {
    const response = await api.get('/domains/hosting/summary/')
    return response.data
  },

  async getHosting(id) {
    const response = await api.get(`/domains/hosting/${id}/`)
    return response.data
  },

  async createHosting(data) {
    const response = await api.post('/domains/hosting/', data)
    return response.data
  },

  async updateHosting(id, data) {
    const response = await api.put(`/domains/hosting/${id}/`, data)
    return response.data
  },

  async deleteHosting(id) {
    const response = await api.delete(`/domains/hosting/${id}/`)
    return response.data
  }
}
