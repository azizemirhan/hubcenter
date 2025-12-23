import api from '../lib/api'

export const vaultService = {
  // Credentials
  async getCredentials(params = {}) {
    const response = await api.get('/vault/credentials/', { params })
    return response.data
  },

  async getCredential(id) {
    const response = await api.get(`/vault/credentials/${id}/`)
    return response.data
  },

  async createCredential(data) {
    const response = await api.post('/vault/credentials/', data)
    return response.data
  },

  async updateCredential(id, data) {
    const response = await api.patch(`/vault/credentials/${id}/`, data)
    return response.data
  },

  async deleteCredential(id) {
    const response = await api.delete(`/vault/credentials/${id}/`)
    return response.data
  },

  async revealPassword(id) {
    const response = await api.get(`/vault/credentials/${id}/reveal_password/`)
    return response.data
  },

  async getCredentialTypes() {
    const response = await api.get('/vault/credentials/types/')
    return response.data
  },

  // Mail Accounts
  async getMailAccounts(params = {}) {
    const response = await api.get('/vault/mail-accounts/', { params })
    return response.data
  },

  async getMailAccount(id) {
    const response = await api.get(`/vault/mail-accounts/${id}/`)
    return response.data
  },

  async createMailAccount(data) {
    const response = await api.post('/vault/mail-accounts/', data)
    return response.data
  },

  async updateMailAccount(id, data) {
    const response = await api.patch(`/vault/mail-accounts/${id}/`, data)
    return response.data
  },

  async deleteMailAccount(id) {
    const response = await api.delete(`/vault/mail-accounts/${id}/`)
    return response.data
  },

  async revealMailPassword(id) {
    const response = await api.get(`/vault/mail-accounts/${id}/reveal_password/`)
    return response.data
  }
}
