import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Debt, CreateDebtForm, Strategy } from '../types'

interface GuestState {
  debts: Debt[]
  strategy: Strategy
  extraMonthlyPayment: number
  addDebt: (form: CreateDebtForm) => void
  updateDebt: (id: string, form: CreateDebtForm) => void
  removeDebt: (id: string) => void
  setPlan: (strategy: Strategy, extra: number) => void
}

export const useGuestStore = create<GuestState>()(
  persist(
    (set) => ({
      debts: [],
      strategy: 'avalanche',
      extraMonthlyPayment: 0,

      addDebt: (form) => set((s) => ({
        debts: [...s.debts, {
          id: crypto.randomUUID(),
          name: form.name,
          debtType: form.debtType,
          originalBalance: form.currentBalance,
          currentBalance: form.currentBalance,
          annualInterestRate: form.annualInterestRate,
          minimumPayment: form.minimumPayment,
          paymentDueDay: form.paymentDueDay,
          isPaidOff: false,
          sortOrder: s.debts.length,
          createdAt: new Date().toISOString(),
        }],
      })),

      updateDebt: (id, form) => set((s) => ({
        debts: s.debts.map((d) =>
          d.id === id
            ? { ...d, name: form.name, debtType: form.debtType, currentBalance: form.currentBalance, annualInterestRate: form.annualInterestRate, minimumPayment: form.minimumPayment, paymentDueDay: form.paymentDueDay }
            : d
        ),
      })),

      removeDebt: (id) => set((s) => ({
        debts: s.debts.filter((d) => d.id !== id),
      })),

      setPlan: (strategy, extraMonthlyPayment) => set({ strategy, extraMonthlyPayment }),
    }),
    { name: 'guest-data' }
  )
)
