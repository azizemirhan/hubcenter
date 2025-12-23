import api from '../lib/api'

export const financeService = {
  // Invoices
  async getInvoices(params = {}) {
    const response = await api.get('/finance/invoices/', { params })
    return response.data
  },

  async getInvoicesSummary() {
    const response = await api.get('/finance/invoices/summary/')
    return response.data
  },

  async getInvoice(id) {
    const response = await api.get(`/finance/invoices/${id}/`)
    return response.data
  },

  async createInvoice(data) {
    const response = await api.post('/finance/invoices/', data)
    return response.data
  },

  async markInvoicePaid(id) {
    const response = await api.post(`/finance/invoices/${id}/mark_paid/`)
    return response.data
  },

  // Income
  async getIncomes(params = {}) {
    const response = await api.get('/finance/incomes/', { params })
    return response.data
  },

  async getIncomesSummary() {
    const response = await api.get('/finance/incomes/summary/')
    return response.data
  },

  async createIncome(data) {
    const response = await api.post('/finance/incomes/', data)
    return response.data
  },

  // Expenses
  async getExpenses(params = {}) {
    const response = await api.get('/finance/expenses/', { params })
    return response.data
  },

  async getExpensesSummary() {
    const response = await api.get('/finance/expenses/summary/')
    return response.data
  },

  async createExpense(data) {
    const response = await api.post('/finance/expenses/', data)
    return response.data
  },

  // Bank Accounts
  async getBankAccounts() {
    const response = await api.get('/finance/bank-accounts/')
    return response.data
  }
}
