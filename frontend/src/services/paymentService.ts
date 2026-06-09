import api from './api'
import type { Payment } from '../types'

export const paymentService = {
  getAll: (debtId: string) =>
    api.get<Payment[]>('/api/payments', { params: { debtId } }).then(r => r.data),

  log: (debtId: string, amount: number, paymentDate: string, notes?: string) =>
    api.post<Payment>('/api/payments', { debtId, amount, paymentDate, notes }).then(r => r.data),

  remove: (id: string) =>
    api.delete(`/api/payments/${id}`),
}
