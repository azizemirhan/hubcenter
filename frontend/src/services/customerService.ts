import api from '../lib/api'

export const customerService = {
  async getCustomers(params = {}) {
    const response = await api.get('/customers/list/', { params })
    return response.data
  },

  async getCustomer(id) {
    const response = await api.get(`/customers/list/${id}/`)
    return response.data
  },

  async createCustomer(data) {
    const response = await api.post('/customers/list/', data)
    return response.data
  },

  async updateCustomer(id, data) {
    const response = await api.patch(`/customers/list/${id}/`, data)
    return response.data
  },

  async deleteCustomer(id) {
    const response = await api.delete(`/customers/list/${id}/`)
    return response.data
  }
}
