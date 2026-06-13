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

// Sample debts to show on first visit — realistic UK amounts that demonstrate
// both avalanche and snowball strategies interestingly.
const SAMPLE_DEBTS: Debt[] = [
  {
    id: 'sample-credit-card',
    name: 'Barclaycard',
    debtType: 'credit_card',
    originalBalance: 4200,
    currentBalance: 4200,
    annualInterestRate: 22.9,
    minimumPayment: 105,
    isPaidOff: false,
    sortOrder: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'sample-personal-loan',
    name: 'Oakbrook Personal Loan',
    debtType: 'personal_loan',
    originalBalance: 1800,
    currentBalance: 1800,
    annualInterestRate: 14.9,
    minimumPayment: 65,
    isPaidOff: false,
    sortOrder: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'sample-car-finance',
    name: 'Car Finance',
    debtType: 'car_finance',
    originalBalance: 9500,
    currentBalance: 9500,
    annualInterestRate: 8.9,
    minimumPayment: 220,
    isPaidOff: false,
    sortOrder: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

export const useGuestStore = create<GuestState>()(
  persist(
    (set) => ({
      debts: SAMPLE_DEBTS,
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
    {
      name: 'guest-data',
      version: 1, // bumping this clears any empty state from previous visits
    }
  )
)
