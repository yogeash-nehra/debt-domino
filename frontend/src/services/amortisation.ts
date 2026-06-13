import type { Snapshot, Strategy } from '../types'

interface AmortInput {
  id: string
  name: string
  balance: number
  annualRate: number
  minimumPayment: number
}

function simulate(inputs: AmortInput[], strategy: Strategy, extraMonthlyPayment: number) {
  const MAX_MONTHS = 360

  const debts = inputs.map(d => ({
    id: d.id,
    name: d.name,
    balance: d.balance,
    minimumPayment: d.minimumPayment,
    monthlyRate: d.annualRate / 100 / 12,
    remaining: d.balance,
    totalInterest: 0,
    payoffMonth: 0,
    points: [{ month: 0, balance: d.balance }] as { month: number; balance: number }[],
  }))

  let rolledExtra = extraMonthlyPayment
  let totalInterest = 0
  let month = 0

  while (month < MAX_MONTHS) {
    month++
    const active = debts.filter(d => d.remaining > 0.005)
    if (active.length === 0) break

    // Accrue interest and apply minimum payments
    for (const d of active) {
      const interest = d.remaining * d.monthlyRate
      d.totalInterest += interest
      totalInterest += interest
      d.remaining += interest
      const payment = Math.min(d.minimumPayment, d.remaining)
      d.remaining -= payment
    }

    // Apply extra payment to priority debt
    const stillActive = active.filter(d => d.remaining > 0.005)
    if (stillActive.length > 0 && rolledExtra > 0) {
      const sorted = [...stillActive].sort((a, b) =>
        strategy === 'avalanche'
          ? b.monthlyRate - a.monthlyRate
          : a.remaining - b.remaining
      )
      const priority = sorted[0]
      priority.remaining -= Math.min(rolledExtra, priority.remaining)
    }

    // Check for newly paid-off debts — roll their minimum into extra pool
    for (const d of active) {
      if (d.remaining <= 0.005 && d.payoffMonth === 0) {
        d.remaining = 0
        d.payoffMonth = month
        rolledExtra += d.minimumPayment
      }
    }

    // Record chart points
    for (const d of debts) {
      d.points.push({ month, balance: Math.max(0, d.remaining) })
    }
  }

  for (const d of debts) {
    if (d.payoffMonth === 0) d.payoffMonth = month
  }

  const finalMonth = Math.max(...debts.map(d => d.payoffMonth))
  return { finalMonth, totalInterest, debts }
}

export function calculateGuestSnapshot(
  inputs: AmortInput[],
  strategy: Strategy,
  extraMonthlyPayment: number
): Snapshot {
  const { finalMonth, totalInterest, debts } = simulate(inputs, strategy, extraMonthlyPayment)
  const { totalInterest: minInterest } = simulate(inputs, strategy, 0)

  const now = new Date()
  const debtFreeDate = new Date(now)
  debtFreeDate.setMonth(debtFreeDate.getMonth() + finalMonth)

  return {
    debtFreeDate: debtFreeDate.toISOString(),
    monthsToFreedom: finalMonth,
    totalInterestRemaining: totalInterest,
    interestSaved: Math.max(0, minInterest - totalInterest),
    totalRemainingDebt: inputs.reduce((s, d) => s + d.balance, 0),
    debts: inputs.map(d => {
      const debt = debts.find(x => x.id === d.id)!
      const payoffDate = new Date(now)
      payoffDate.setMonth(payoffDate.getMonth() + debt.payoffMonth)
      return {
        debtId: d.id,
        name: d.name,
        payoffDate: payoffDate.toISOString(),
        monthsToPayoff: debt.payoffMonth,
        totalInterest: debt.totalInterest,
        chartPoints: debt.points,
      }
    }),
  }
}
