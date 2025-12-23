import api from '../lib/api'

export const taskService = {
  async getTasks(params = {}) {
    const response = await api.get('/tasks/list/', { params })
    return response.data
  },

  async getTasksKanban(projectId = null) {
    const params = projectId ? { project: projectId } : {}
    const response = await api.get('/tasks/list/kanban/', { params })
    return response.data
  },

  async getMyTasks() {
    const response = await api.get('/tasks/list/my_tasks/')
    return response.data
  },

  async getTask(id) {
    const response = await api.get(`/tasks/list/${id}/`)
    return response.data
  },

  async getSubtasks(id) {
    const response = await api.get(`/tasks/list/${id}/subtasks/`)
    return response.data
  },

  async createTask(data) {
    const response = await api.post('/tasks/list/', data)
    return response.data
  },

  async updateTask(id, data) {
    const response = await api.put(`/tasks/list/${id}/`, data)
    return response.data
  },

  async updateTaskStatus(id, status) {
    const response = await api.post(`/tasks/list/${id}/update_status/`, { status })
    return response.data
  },

  async deleteTask(id) {
    const response = await api.delete(`/tasks/list/${id}/`)
    return response.data
  }
}
