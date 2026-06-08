import { useEffect, useState, useCallback } from 'react'
import { planService } from '../services/planService'
import { debtService } from '../services/debtService'
import type { Snapshot, Strategy } from '../types'
import { PayoffChart } from '../components/PayoffChart'
import { TrendingDown, RefreshCw } from 'lucide-react'
import api from '../services/api'

const STRATEGIES: { value: Strategy; label: string; desc: string }[] = [
  { value: 'avalanche', label: 'Avalanche', desc: 'Highest interest first — saves the most money' },
  { value: 'snowball', label: 'Snowball', desc: 'Lowest balance first — fastest psychological wins' },
]

function fmt(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export function PlanPage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [strategy, setStrategy] = useState<Strategy>('avalanche')
  const [extra, setExtra] = useState(0)
  const [sliderValue, setSliderValue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [noDebts, setNoDebts] = useState(false)

  // Client-side preview calculation for instant slider feedback
  const [previewSnapshot, setPreviewSnapshot] = useState<Snapshot | null>(null)

  useEffect(() => {
    async function init() {
      try {
        const summary = await debtService.getAll()
        if (summary.activeDebtCount === 0) { setNoDebts(true); setLoading(false); return }

        const plan = await planService.getActive()
        setStrategy(plan.strategy as Strategy)
        setExtra(plan.extraMonthlyPayment)
        setSliderValue(plan.extraMonthlyPayment)

        const snap = await planService.getSnapshot().catch(() => null)
        if (snap) setSnapshot(snap)
        else await recalculate(plan.strategy as Strategy, plan.extraMonthlyPayment)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  async function recalculate(strat = strategy, extraPayment = extra) {
    setCalculating(true)
    try {
      await planService.save(strat, extraPayment)
      const snap = await planService.calculate()
      setSnapshot(snap)
      setPreviewSnapshot(null)
    } finally {
      setCalculating(false)
    }
  }

  // Live slider preview via /plans/preview endpoint
  const runPreview = useCallback(async (extraPayment: number) => {
    try {
      const summary = await debtService.getAll()
      const debts = summary.debts
        .filter(d => !d.isPaidOff)
        .map(d => ({ balance: d.currentBalance, annualRate: d.annualInterestRate, minimumPayment: d.minimumPayment, sortOrder: d.sortOrder }))

      const { data } = await api.post<Snapshot>('/plans/preview', { strategy, extraMonthlyPayment: extraPayment, debts })
      setPreviewSnapshot(data)
    } catch {
      // preview failing silently is fine — still show last saved snapshot
    }
  }, [strategy])

  async function handleSliderChange(val: number) {
    setSliderValue(val)
    await runPreview(val)
  }

  async function handleApply() {
    setExtra(sliderValue)
    await recalculate(strategy, sliderValue)
  }

  async function handleStrategyChange(s: Strategy) {
    setStrategy(s)
    await recalculate(s, extra)
  }

  const display = previewSnapshot ?? snapshot

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
  }

  if (noDebts) {
    return (
      <div className="p-8 text-center">
        <TrendingDown className="mx-auto text-slate-300 mb-4" size={48} />
        <h2 className="text-lg font-semibold text-slate-900 mb-2">No debts to plan</h2>
        <p className="text-slate-500">Add debts first to see your payoff plan.</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payoff Plan</h1>
          <p className="text-slate-500 mt-1">Drag the slider to see your future change in real time.</p>
        </div>
        <button
          onClick={() => recalculate()}
          disabled={calculating}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={calculating ? 'animate-spin' : ''} />
          Recalculate
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column — controls */}
        <div className="space-y-4">
          {/* Debt-free date */}
          {display?.debtFreeDate && (
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
              <p className="text-indigo-200 text-xs font-medium uppercase tracking-wide mb-1">Debt-free date</p>
              <p className="text-3xl font-bold">{fmtDate(display.debtFreeDate)}</p>
              <p className="text-indigo-200 text-sm mt-1">{display.monthsToFreedom} months away</p>
            </div>
          )}

          {/* Interest saved */}
          {display && display.interestSaved > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">Interest saved vs minimums only</p>
              <p className="text-2xl font-bold text-green-700">{fmt(display.interestSaved)}</p>
            </div>
          )}

          {/* Strategy selector */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-700 mb-3">Strategy</p>
            <div className="space-y-2">
              {STRATEGIES.map(s => (
                <button
                  key={s.value}
                  onClick={() => handleStrategyChange(s.value)}
                  className={`w-full text-left px-3 py-3 rounded-lg border-2 transition-all ${
                    strategy === s.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-transparent bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <p className={`text-sm font-medium ${strategy === s.value ? 'text-indigo-700' : 'text-slate-900'}`}>{s.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Extra payment slider */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium text-slate-700">Extra monthly payment</p>
              <span className="text-lg font-bold text-indigo-600">{fmt(sliderValue)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1000}
              step={10}
              value={sliderValue}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>£0</span>
              <span>£1,000</span>
            </div>
            {sliderValue !== extra && (
              <button
                onClick={handleApply}
                disabled={calculating}
                className="mt-3 w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {calculating ? 'Saving...' : 'Apply & save plan'}
              </button>
            )}
          </div>

          {/* Summary stats */}
          {display && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total remaining debt</span>
                <span className="font-semibold text-slate-900">{fmt(display.totalRemainingDebt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total interest remaining</span>
                <span className="font-semibold text-red-600">{fmt(display.totalInterestRemaining)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right column — chart */}
        <div className="xl:col-span-2">
          {display ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-1">Debt payoff timeline</h2>
              <p className="text-xs text-slate-400 mb-6">Each line is a debt. Watch them fall like dominoes.</p>
              <PayoffChart snapshot={display} />

              {/* Per-debt breakdown */}
              <div className="mt-6 space-y-2">
                {display.debts.map((d, i) => (
                  <div key={d.debtId} className="flex items-center gap-3 text-sm">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="flex-1 text-slate-700">{d.name}</span>
                    <span className="text-slate-500">{fmtDate(d.payoffDate)}</span>
                    <span className="text-red-500 text-xs">{fmt(d.totalInterest)} interest</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <p className="text-slate-500">Click Recalculate to generate your plan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308',
]
