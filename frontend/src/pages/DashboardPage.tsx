import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { planService } from '../services/planService'
import { useAuthStore } from '../store/authStore'
import { useGuestStore } from '../store/guestStore'
import api from '../services/api'
import type { Dashboard, Snapshot } from '../types'
import { TrendingDown, CreditCard, Calendar, PiggyBank, Plus } from 'lucide-react'

function fmt(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export function DashboardPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const guestDebts = useGuestStore((s) => s.debts.filter((d) => !d.isPaidOff))
  const guestStrategy = useGuestStore((s) => s.strategy)
  const guestExtra = useGuestStore((s) => s.extraMonthlyPayment)

  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      planService.getDashboard()
        .then(setData)
        .finally(() => setLoading(false))
      return
    }

    // Guest mode: compute stats locally, fetch debt-free date from preview endpoint
    const totalDebt = guestDebts.reduce((s, d) => s + d.currentBalance, 0)
    const totalMinimumPayment = guestDebts.reduce((s, d) => s + d.minimumPayment, 0)
    const base: Dashboard = {
      totalDebt,
      totalMinimumPayment,
      activeDebts: guestDebts.length,
      percentPaidOff: 0,
    }

    if (guestDebts.length === 0) {
      setData(base)
      setLoading(false)
      return
    }

    const debts = guestDebts.map((d) => ({
      balance: d.currentBalance,
      annualRate: d.annualInterestRate,
      minimumPayment: d.minimumPayment,
      sortOrder: d.sortOrder,
    }))

    api.post<Snapshot>('/plans/preview', { strategy: guestStrategy, extraMonthlyPayment: guestExtra, debts })
      .then((r) => setData({ ...base, debtFreeDate: r.data.debtFreeDate, interestSaved: r.data.interestSaved }))
      .catch(() => setData(base))
      .finally(() => setLoading(false))
  }, [isAuthenticated, guestDebts, guestStrategy, guestExtra])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  const hasDebts = (data?.activeDebts ?? 0) > 0

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Your complete debt picture at a glance.</p>
      </div>

      {!hasDebts ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <CreditCard className="mx-auto text-slate-300 mb-4" size={48} />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">No debts added yet</h2>
          <p className="text-slate-500 mb-6">Add your debts to see your debt-free date and payoff plan.</p>
          <Link
            to="/debts"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <Plus size={16} />
            Add your first debt
          </Link>
        </div>
      ) : (
        <>
          {data?.debtFreeDate && (
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 mb-6 text-white">
              <p className="text-indigo-200 text-sm font-medium uppercase tracking-wide mb-2">Your debt-free date</p>
              <p className="text-5xl font-bold mb-3">{fmtDate(data.debtFreeDate)}</p>
              {data.interestSaved != null && data.interestSaved > 0 && (
                <p className="text-indigo-200">
                  Saving <span className="text-white font-semibold">{fmt(data.interestSaved)}</span> in interest vs minimum payments
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={<TrendingDown size={20} />} label="Total debt" value={fmt(data?.totalDebt ?? 0)} color="text-red-600" />
            <StatCard icon={<CreditCard size={20} />} label="Active debts" value={String(data?.activeDebts ?? 0)} color="text-orange-600" />
            <StatCard icon={<Calendar size={20} />} label="Monthly minimum" value={fmt(data?.totalMinimumPayment ?? 0)} color="text-blue-600" />
            <StatCard icon={<PiggyBank size={20} />} label="Paid off" value={`${data?.percentPaidOff ?? 0}%`} color="text-green-600" />
          </div>

          {(data?.percentPaidOff ?? 0) > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-slate-700">Overall progress</span>
                <span className="text-sm font-semibold text-indigo-600">{data?.percentPaidOff}% paid off</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                  style={{ width: `${data?.percentPaidOff}%` }}
                />
              </div>
            </div>
          )}

          <Link
            to="/plan"
            className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-sm transition-all group"
          >
            <div>
              <h3 className="font-semibold text-slate-900">View your payoff plan</h3>
              <p className="text-sm text-slate-500 mt-0.5">Adjust your extra payment and see the domino effect</p>
            </div>
            <TrendingDown className="text-indigo-600 group-hover:translate-x-1 transition-transform" size={24} />
          </Link>
        </>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  )
}
