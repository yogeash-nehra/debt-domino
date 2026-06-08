import { useEffect, useState } from 'react'
import { debtService } from '../services/debtService'
import type { Debt, CreateDebtForm } from '../types'
import { Plus, Pencil, Trash2, CreditCard } from 'lucide-react'
import { DebtFormModal } from '../components/DebtFormModal'

function fmt(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n)
}

const DEBT_TYPE_LABELS: Record<string, string> = {
  credit_card: 'Credit Card',
  student_loan: 'Student Loan',
  personal_loan: 'Personal Loan',
  car_finance: 'Car Finance',
  mortgage: 'Mortgage',
  other: 'Other',
}

const DEBT_TYPE_COLORS: Record<string, string> = {
  credit_card: 'bg-red-100 text-red-700',
  student_loan: 'bg-blue-100 text-blue-700',
  personal_loan: 'bg-orange-100 text-orange-700',
  car_finance: 'bg-purple-100 text-purple-700',
  mortgage: 'bg-slate-100 text-slate-700',
  other: 'bg-gray-100 text-gray-700',
}

export function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [totalMin, setTotalMin] = useState(0)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Debt | null>(null)

  async function loadDebts() {
    const summary = await debtService.getAll()
    setDebts(summary.debts.filter(d => !d.isPaidOff))
    setTotalBalance(summary.totalBalance)
    setTotalMin(summary.totalMinimumPayment)
  }

  useEffect(() => {
    loadDebts().finally(() => setLoading(false))
  }, [])

  async function handleSave(form: CreateDebtForm) {
    if (editing) {
      await debtService.update(editing.id, form)
    } else {
      await debtService.create(form)
    }
    await loadDebts()
    setModalOpen(false)
    setEditing(null)
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this debt? This cannot be undone.')) {
      await debtService.remove(id)
      await loadDebts()
    }
  }

  function openEdit(debt: Debt) {
    setEditing(debt)
    setModalOpen(true)
  }

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Debts</h1>
          <p className="text-slate-500 mt-1">
            {debts.length} active {debts.length === 1 ? 'debt' : 'debts'} · {fmt(totalBalance)} total · {fmt(totalMin)}/month minimum
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Add debt
        </button>
      </div>

      {debts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <CreditCard className="mx-auto text-slate-300 mb-4" size={48} />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">No debts yet</h2>
          <p className="text-slate-500 mb-6">Add each debt you're carrying to build your payoff plan.</p>
          <button
            onClick={() => { setEditing(null); setModalOpen(true) }}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <Plus size={16} />
            Add your first debt
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {debts.map((debt) => (
            <div key={debt.id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-900">{debt.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DEBT_TYPE_COLORS[debt.debtType] ?? 'bg-gray-100 text-gray-700'}`}>
                    {DEBT_TYPE_LABELS[debt.debtType] ?? debt.debtType}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-slate-500">
                  <span>Balance: <span className="font-medium text-slate-900">{fmt(debt.currentBalance)}</span></span>
                  <span>Rate: <span className="font-medium text-slate-900">{debt.annualInterestRate}%</span></span>
                  <span>Min: <span className="font-medium text-slate-900">{fmt(debt.minimumPayment)}/mo</span></span>
                </div>
              </div>

              {/* Progress bar (paid off vs original) */}
              <div className="w-32 hidden md:block">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${Math.max(0, Math.round((1 - debt.currentBalance / debt.originalBalance) * 100))}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1 text-center">
                  {Math.round((1 - debt.currentBalance / debt.originalBalance) * 100)}% paid
                </p>
              </div>

              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(debt)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(debt.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <DebtFormModal
          initial={editing}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
