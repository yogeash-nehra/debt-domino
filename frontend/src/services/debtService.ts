import api from './api'
import type { CreateDebtForm, DebtSummary } from '../types'

export const debtService = {
  async getAll(): Promise<DebtSummary> {
    const { data } = await api.get<DebtSummary>('/debts')
    return data
  },

  async create(form: CreateDebtForm) {
    const { data } = await api.post('/debts', form)
    return data
  },

  async update(id: string, form: CreateDebtForm) {
    const { data } = await api.put(`/debts/${id}`, form)
    return data
  },

  async remove(id: string) {
    await api.delete(`/debts/${id}`)
  },
}
