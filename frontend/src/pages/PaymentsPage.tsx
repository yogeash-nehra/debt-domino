import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { debtService } from '../services/debtService'
import { paymentService } from '../services/paymentService'
import { useAuthStore } from '../store/authStore'
import type { Debt, Payment } from '../types'
import { Receipt, Trash2, PlusCircle } from 'lucide-react'

function fmt(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export function PaymentsPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [debts, setDebts] = useState<Debt[]>([])
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentsLoading, setPaymentsLoading] = useState(false)

  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(todayISO())
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    debtService.getAll().then((summary) => {
      const active = summary.debts
      setDebts(active)
      if (active.length > 0) setSelectedDebtId(active[0].id)
    }).finally(() => setLoading(false))
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || !selectedDebtId) return
    setPaymentsLoading(true)
    paymentService.getAll(selectedDebtId)
      .then(setPayments)
      .finally(() => setPaymentsLoading(false))
  }, [selectedDebtId, isAuthenticated])

  // Guest gate — shown after all hooks are declared
  if (!isAuthenticated) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <Receipt className="mx-auto text-slate-300 mb-4" size={48} />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Payment tracking requires an account</h2>
          <p className="text-slate-500 mb-6">
            Logging payments calculates the principal/interest split and tracks your real balance over time. Create a free account to unlock this.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            Create free account
          </Link>
          <p className="text-sm text-slate-400 mt-3">
            Already have one?{' '}
            <Link to="/login" className="text-indigo-600 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    )
  }

  const selectedDebt = debts.find((d) => d.id === selectedDebtId)

  async function handleLog(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDebtId || !amount) return
    setError('')
    setSubmitting(true)
    try {
      await paymentService.log(selectedDebtId, parseFloat(amount), paymentDate, notes || undefined)
      setAmount('')
      setNotes('')
      setPaymentDate(todayISO())
      const [updatedPayments, updatedDebts] = await Promise.all([
        paymentService.getAll(selectedDebtId),
        debtService.getAll(),
      ])
      setPayments(updatedPayments)
      setDebts(updatedDebts.debts)
    } catch {
      setError('Failed to log payment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this payment? The balance will be restored.')) return
    await paymentService.remove(id)
    const [updatedPayments, updatedDebts] = await Promise.all([
      paymentService.getAll(selectedDebtId!),
      debtService.getAll(),
    ])
    setPayments(updatedPayments)
    setDebts(updatedDebts.debts)
  }

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
  }

  if (debts.length === 0) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Receipt className="mx-auto text-slate-300 mb-4" size={48} />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">No debts to log payments for</h2>
          <p className="text-slate-500">Add debts first from the My Debts page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        <p className="text-slate-500 mt-1">Log payments against your debts and track your progress.</p>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {debts.map((debt) => (
          <button
            key={debt.id}
            onClick={() => setSelectedDebtId(debt.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedDebtId === debt.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {debt.name}
            {debt.isPaidOff && <span className="ml-1.5 text-xs opacity-75">✓ Paid</span>}
          </button>
        ))}
      </div>

      {selectedDebt && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <PlusCircle size={18} className="text-indigo-600" />
              Log a payment
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Current balance: <span className="font-semibold text-slate-900">{fmt(selectedDebt.currentBalance)}</span>
            </p>

            {selectedDebt.isPaidOff ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700 font-medium text-center">
                This debt is fully paid off!
              </div>
            ) : (
              <form onSubmit={handleLog} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (£)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Min: ${fmt(selectedDebt.minimumPayment)}`}
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes <span className="text-slate-400">(optional)</span></label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Monthly payment"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Logging…' : 'Log payment'}
                </button>
              </form>
            )}
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">
              Payment history
              <span className="ml-2 text-sm text-slate-400 font-normal">({payments.length} {payments.length === 1 ? 'payment' : 'payments'})</span>
            </h2>

            {paymentsLoading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" /></div>
            ) : payments.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Receipt className="mx-auto mb-3" size={32} />
                <p className="text-sm">No payments logged yet for this debt.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-slate-500 text-xs uppercase tracking-wide">
                      <th className="pb-3 pr-4">Date</th>
                      <th className="pb-3 pr-4 text-right">Amount</th>
                      <th className="pb-3 pr-4 text-right">Principal</th>
                      <th className="pb-3 pr-4 text-right">Interest</th>
                      <th className="pb-3 pr-4 text-right">Balance after</th>
                      <th className="pb-3 text-right">Notes</th>
                      <th className="pb-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 pr-4 text-slate-700">{fmtDate(p.paymentDate)}</td>
                        <td className="py-3 pr-4 text-right font-semibold text-slate-900">{fmt(p.amount)}</td>
                        <td className="py-3 pr-4 text-right text-green-700">{fmt(p.principal)}</td>
                        <td className="py-3 pr-4 text-right text-red-500">{fmt(p.interest)}</td>
                        <td className="py-3 pr-4 text-right text-slate-600">{fmt(p.balanceAfter)}</td>
                        <td className="py-3 pr-4 text-right text-slate-400 max-w-[120px] truncate">{p.notes ?? '—'}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-6 text-sm">
                  <span className="text-slate-500">Total paid: <span className="font-semibold text-slate-900">{fmt(payments.reduce((s, p) => s + p.amount, 0))}</span></span>
                  <span className="text-slate-500">Total interest: <span className="font-semibold text-red-500">{fmt(payments.reduce((s, p) => s + p.interest, 0))}</span></span>
                  <span className="text-slate-500">Total principal: <span className="font-semibold text-green-700">{fmt(payments.reduce((s, p) => s + p.principal, 0))}</span></span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
