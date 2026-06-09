export interface User {
  id: string
  email: string
  firstName?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface Debt {
  id: string
  name: string
  debtType: string
  originalBalance: number
  currentBalance: number
  annualInterestRate: number
  minimumPayment: number
  paymentDueDay?: number
  isPaidOff: boolean
  paidOffDate?: string
  sortOrder: number
  createdAt: string
}

export interface DebtSummary {
  debts: Debt[]
  totalBalance: number
  totalMinimumPayment: number
  activeDebtCount: number
}

export type Strategy = 'avalanche' | 'snowball' | 'custom'

export interface ChartPoint {
  month: number
  balance: number
}

export interface DebtProjection {
  debtId: string
  name: string
  payoffDate: string
  monthsToPayoff: number
  totalInterest: number
  chartPoints: ChartPoint[]
}

export interface Snapshot {
  debtFreeDate: string
  monthsToFreedom: number
  totalInterestRemaining: number
  interestSaved: number
  totalRemainingDebt: number
  debts: DebtProjection[]
}

export interface Plan {
  id: string
  strategy: Strategy
  extraMonthlyPayment: number
  snapshot?: Snapshot
}

export interface Dashboard {
  totalDebt: number
  totalMinimumPayment: number
  activeDebts: number
  debtFreeDate?: string
  interestSaved?: number
  percentPaidOff: number
}

export interface CreateDebtForm {
  name: string
  debtType: string
  currentBalance: number
  annualInterestRate: number
  minimumPayment: number
  paymentDueDay?: number
}

export interface Payment {
  id: string
  debtId: string
  amount: number
  paymentDate: string
  principal: number
  interest: number
  balanceAfter: number
  notes?: string
}
