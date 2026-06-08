import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import type { Snapshot } from '../types'
import { CHART_COLORS } from '../pages/PlanPage'

interface Props {
  snapshot: Snapshot
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)
}

function fmtMonth(monthIndex: number) {
  const date = new Date()
  date.setMonth(date.getMonth() + monthIndex)
  return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
}

export function PayoffChart({ snapshot }: Props) {
  // Build unified month series for all debts
  const maxMonth = snapshot.monthsToFreedom
  const months = Array.from({ length: maxMonth + 1 }, (_, i) => i)

  // Build a lookup map for each debt's balance at each month
  const balanceMaps = snapshot.debts.map(debt => {
    const map = new Map(debt.chartPoints.map(p => [p.month, p.balance]))
    return { name: debt.name, map }
  })

  const chartData = months
    .filter(m => m % Math.max(1, Math.floor(maxMonth / 60)) === 0 || m === maxMonth)
    .map(m => {
      const point: Record<string, number | string> = { month: fmtMonth(m) }
      balanceMaps.forEach(({ name, map }) => {
        // Use last known balance if month not in map (debt paid off)
        const keys = [...map.keys()].filter(k => k <= m)
        const lastKey = keys.length ? Math.max(...keys) : 0
        point[name] = map.get(lastKey) ?? 0
      })
      return point
    })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="text-xs font-medium text-slate-500 mb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
            <span className="text-slate-600">{p.name}:</span>
            <span className="font-semibold">{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
        <defs>
          {snapshot.debts.map((debt, i) => (
            <linearGradient key={debt.debtId} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.25} />
              <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis
          tickFormatter={(v) => v >= 1000 ? `£${(v / 1000).toFixed(0)}k` : `£${v}`}
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
        {snapshot.debts.map((debt, i) => (
          <Area
            key={debt.debtId}
            type="monotone"
            dataKey={debt.name}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            fill={`url(#grad-${i})`}
            dot={false}
            activeDot={{ r: 4 }}
            animationDuration={600}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
