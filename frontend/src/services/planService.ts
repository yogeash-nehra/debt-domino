import api from './api'
import type { Plan, Snapshot, Strategy, Dashboard } from '../types'

export const planService = {
  async getActive(): Promise<Plan> {
    const { data } = await api.get<Plan>('/plans/active')
    return data
  },

  async save(strategy: Strategy, extraMonthlyPayment: number): Promise<Plan> {
    const { data } = await api.post<Plan>('/plans', { strategy, extraMonthlyPayment })
    return data
  },

  async calculate(): Promise<Snapshot> {
    const { data } = await api.post<Snapshot>('/plans/calculate')
    return data
  },

  async getSnapshot(): Promise<Snapshot> {
    const { data } = await api.get<Snapshot>('/plans/snapshot')
    return data
  },

  async getDashboard(): Promise<Dashboard> {
    const { data } = await api.get<Dashboard>('/dashboard')
    return data
  },
}
