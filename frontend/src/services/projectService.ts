import api from '../lib/api'

export const projectService = {
  async getProjects(params = {}) {
    const response = await api.get('/projects/list/', { params })
    return response.data
  },

  async getProjectsSummary() {
    const response = await api.get('/projects/list/summary/')
    return response.data
  },

  async getProject(id) {
    const response = await api.get(`/projects/list/${id}/`)
    return response.data
  },

  async createProject(data) {
    const response = await api.post('/projects/list/', data)
    return response.data
  },

  async updateProject(id, data) {
    const response = await api.put(`/projects/list/${id}/`, data)
    return response.data
  },

  async updateProjectStatus(id, status) {
    const response = await api.post(`/projects/list/${id}/update_status/`, { status })
    return response.data
  },

  async deleteProject(id) {
    const response = await api.delete(`/projects/list/${id}/`)
    return response.data
  }
}
