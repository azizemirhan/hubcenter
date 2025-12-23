import api from '../lib/api'

export const filesService = {
  // Folders
  async getFolders(parentId = null) {
    const params = parentId ? { parent: parentId } : {}
    const response = await api.get('/files/folders/', { params })
    return response.data
  },

  async createFolder(data) {
    const response = await api.post('/files/folders/', data)
    return response.data
  },

  // Files
  async getFiles(params = {}) {
    const response = await api.get('/files/list/', { params })
    return response.data
  },

  async getFile(id) {
    const response = await api.get(`/files/list/${id}/`)
    return response.data
  },

  async uploadFile(formData) {
    const response = await api.post('/files/list/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  async deleteFile(id) {
    const response = await api.delete(`/files/list/${id}/`)
    return response.data
  },

  async downloadFile(id) {
    const response = await api.get(`/files/list/${id}/download/`, {
      responseType: 'blob'
    })
    return response.data
  },

  // Google Drive
  async getDriveStatus() {
    const response = await api.get('/files/list/drive_status/')
    return response.data
  },

  async getDriveFiles() {
    const response = await api.get('/files/list/drive_files/')
    return response.data
  },

  async syncToDrive(id) {
    const response = await api.post(`/files/list/${id}/sync_to_drive/`)
    return response.data
  },

  async importFromDrive(fileId) {
    const response = await api.post('/files/list/import_from_drive/', 
      { file_id: fileId },
      { headers: { 'Content-Type': 'application/json' } }
    )
    return response.data
  },

  async copyFile(id) {
    const response = await api.post(`/files/list/${id}/copy/`)
    return response.data
  },

  async moveToFolder(fileId, folderId) {
    const response = await api.post(`/files/list/${fileId}/move_to_folder/`, { folder_id: folderId })
    return response.data
  },

  async getTree() {
    const response = await api.get('/files/folders/tree/')
    return response.data
  },

  // OAuth
  async getOAuthStatus() {
    const response = await api.get('/files/oauth/status/')
    return response.data
  },


  async getConnectUrl() {
    const response = await api.get('/files/oauth/connect/')
    return response.data
  },

  async disconnect() {
    const response = await api.post('/files/oauth/disconnect/')
    return response.data
  }

}
