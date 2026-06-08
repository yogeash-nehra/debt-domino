import { useState } from 'react'
import type { Debt, CreateDebtForm } from '../types'
import { X } from 'lucide-react'

const DEBT_TYPES = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'student_loan', label: 'Student Loan' },
  { value: 'personal_loan', label: 'Personal Loan' },
  { value: 'car_finance', label: 'Car Finance' },
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'other', label: 'Other' },
]

interface Props {
  initial?: Debt | null
  onSave: (form: CreateDebtForm) => Promise<void>
  onClose: () => void
}

export function DebtFormModal({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState<CreateDebtForm>({
    name: initial?.name ?? '',
    debtType: initial?.debtType ?? 'credit_card',
    currentBalance: initial?.currentBalance ?? 0,
    annualInterestRate: initial?.annualInterestRate ?? 0,
    minimumPayment: initial?.minimumPayment ?? 0,
    paymentDueDay: initial?.paymentDueDay,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function set<K extends keyof CreateDebtForm>(key: K, val: CreateDebtForm[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.currentBalance <= 0) { setError('Balance must be greater than 0'); return }
    if (form.annualInterestRate < 0 || form.annualInterestRate > 100) { setError('Interest rate must be between 0 and 100'); return }
    if (form.minimumPayment <= 0) { setError('Minimum payment must be greater than 0'); return }

    setSaving(true)
    try {
      await onSave(form)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{initial ? 'Edit debt' : 'Add debt'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>Debt name</label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required className={inputClass} placeholder="e.g. Barclaycard" />
            </div>

            <div className="col-span-2">
              <label className={labelClass}>Debt type</label>
              <select value={form.debtType} onChange={e => set('debtType', e.target.value)} className={inputClass}>
                {DEBT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Current balance (£)</label>
              <input type="number" value={form.currentBalance || ''} onChange={e => set('currentBalance', parseFloat(e.target.value) || 0)} required min="0.01" step="0.01" className={inputClass} placeholder="5000" />
            </div>

            <div>
              <label className={labelClass}>Annual interest rate (%)</label>
              <input type="number" value={form.annualInterestRate || ''} onChange={e => set('annualInterestRate', parseFloat(e.target.value) || 0)} required min="0" max="100" step="0.01" className={inputClass} placeholder="19.99" />
            </div>

            <div>
              <label className={labelClass}>Minimum monthly payment (£)</label>
              <input type="number" value={form.minimumPayment || ''} onChange={e => set('minimumPayment', parseFloat(e.target.value) || 0)} required min="0.01" step="0.01" className={inputClass} placeholder="75" />
            </div>

            <div>
              <label className={labelClass}>Payment due day (optional)</label>
              <input type="number" value={form.paymentDueDay ?? ''} onChange={e => set('paymentDueDay', parseInt(e.target.value) || undefined)} min="1" max="31" className={inputClass} placeholder="15" />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
              {saving ? 'Saving...' : initial ? 'Save changes' : 'Add debt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
