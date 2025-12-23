import api from '../lib/api'

export const seoService = {
  // Packages
  async getPackages(params = {}) {
    const response = await api.get('/seo/packages/', { params })
    return response.data
  },

  async getPackagesSummary() {
    const response = await api.get('/seo/packages/summary/')
    return response.data
  },

  async getPackage(id) {
    const response = await api.get(`/seo/packages/${id}/`)
    return response.data
  },

  async createPackage(data) {
    const response = await api.post('/seo/packages/', data)
    return response.data
  },

  async updatePackage(id, data) {
    const response = await api.put(`/seo/packages/${id}/`, data)
    return response.data
  },

  async deletePackage(id) {
    const response = await api.delete(`/seo/packages/${id}/`)
    return response.data
  },

  // Keywords
  async getKeywords(packageId) {
    const response = await api.get('/seo/keywords/', { params: { package: packageId } })
    return response.data
  },

  async createKeyword(data) {
    const response = await api.post('/seo/keywords/', data)
    return response.data
  },

  async updateKeywordPosition(id, position) {
    const response = await api.post(`/seo/keywords/${id}/update_position/`, { position })
    return response.data
  },

  // Tasks
  async getTasks(packageId) {
    const response = await api.get('/seo/tasks/', { params: { package: packageId } })
    return response.data
  },

  async createTask(data) {
    const response = await api.post('/seo/tasks/', data)
    return response.data
  },

  async completeTask(id) {
    const response = await api.post(`/seo/tasks/${id}/complete/`)
    return response.data
  },

  // Reports
  async getReports(packageId) {
    const response = await api.get('/seo/reports/', { params: { package: packageId } })
    return response.data
  },

  async createReport(data) {
    const response = await api.post('/seo/reports/', data)
    return response.data
  }
}
