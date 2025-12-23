import api from '../lib/api'

export const leadService = {
  async getLeads(params = {}) {
    const response = await api.get('/leads/list/', { params })
    return response.data
  },

  async getLeadsKanban() {
    const response = await api.get('/leads/list/kanban/')
    return response.data
  },

  async getLead(id) {
    const response = await api.get(`/leads/list/${id}/`)
    return response.data
  },

  async createLead(data) {
    const response = await api.post('/leads/list/', data)
    return response.data
  },

  async updateLead(id, data) {
    const response = await api.put(`/leads/list/${id}/`, data)
    return response.data
  },

  async updateLeadStatus(id, status) {
    const response = await api.post(`/leads/list/${id}/update_status/`, { status })
    return response.data
  },

  async deleteLead(id) {
    const response = await api.delete(`/leads/list/${id}/`)
    return response.data
  }
}
