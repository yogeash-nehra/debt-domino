import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard,
  CreditCard,
  TrendingDown,
  Receipt,
  ArrowRight,
  Zap,
  Target,
  PiggyBank,
  Info,
} from 'lucide-react'

function fmt(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)
}

export function HelpPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <div className="p-8 max-w-3xl">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-slate-900">How Debt Domino works</h1>
        <p className="text-slate-500 mt-1">
          Everything you need to understand your debts, pick a strategy, and get debt-free faster.
        </p>
      </div>

      {/* Getting started */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Getting started in 3 steps</h2>
        <div className="space-y-3">
          {[
            {
              step: '1',
              title: 'Add your debts',
              desc: 'Go to My Debts and add every debt you carry — credit cards, loans, car finance, anything with a balance and an interest rate.',
              to: '/debts',
              cta: 'Go to My Debts',
            },
            {
              step: '2',
              title: 'Pick your strategy and set an extra payment',
              desc: 'Head to Payoff Plan, choose Avalanche or Snowball, then drag the slider to see how any extra monthly amount changes your debt-free date instantly.',
              to: '/plan',
              cta: 'Open Payoff Plan',
            },
            {
              step: '3',
              title: 'Track payments as you go',
              desc: 'Each time you make a payment, log it in the Payments page. Your balance updates automatically and your progress shows on the Dashboard.',
              to: '/payments',
              cta: 'Open Payments',
            },
          ].map(({ step, title, desc, to, cta }) => (
            <div key={step} className="bg-white rounded-xl border border-slate-200 p-5 flex gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">
                {step}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 mb-0.5">{title}</p>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
              <Link
                to={to}
                className="shrink-0 self-center flex items-center gap-1 text-sm text-indigo-600 font-medium hover:underline"
              >
                {cta} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-slate-900 mb-4">What each page does</h2>
        <div className="space-y-4">

          <FeatureCard
            icon={<LayoutDashboard size={20} className="text-indigo-600" />}
            title="Dashboard"
            bullets={[
              'Shows your total debt, monthly minimum commitment, and how many active debts you have.',
              'Displays your projected debt-free date based on your current plan.',
              'Once you start logging payments, the "Paid off %" bar tracks your real progress.',
            ]}
          />

          <FeatureCard
            icon={<CreditCard size={20} className="text-indigo-600" />}
            title="My Debts"
            bullets={[
              'Add every debt you carry: credit cards, personal loans, student loans, car finance, mortgages.',
              'Each debt needs a current balance, annual interest rate (APR), and monthly minimum payment.',
              'You can edit or delete any debt at any time — your plan and dashboard update instantly.',
            ]}
          />

          <FeatureCard
            icon={<TrendingDown size={20} className="text-indigo-600" />}
            title="Payoff Plan"
            bullets={[
              'Choose between Avalanche (highest interest first) or Snowball (lowest balance first) strategy.',
              'Drag the "Extra monthly payment" slider to see your debt-free date shift in real time.',
              'The chart shows each debt falling like dominoes — as one pays off, that freed-up payment rolls into the next.',
            ]}
          />

          <FeatureCard
            icon={<Receipt size={20} className="text-indigo-600" />}
            title="Payments"
            bullets={[
              'Log each payment you make against a specific debt.',
              'Each payment is split into principal (reduces your balance) and interest (the cost of borrowing that month).',
              'Your debt\'s current balance automatically decreases — keeping your plan accurate.',
            ]}
          />

        </div>
      </section>

      {/* Strategy explainer */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Avalanche vs Snowball — which should I pick?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={18} className="text-indigo-600" />
              <span className="font-semibold text-indigo-900">Avalanche</span>
            </div>
            <p className="text-sm text-indigo-800 mb-3">Pay off your <strong>highest interest rate</strong> debt first, regardless of balance.</p>
            <p className="text-xs text-indigo-600 font-medium">Best for: saving the most money in total interest paid.</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Target size={18} className="text-purple-600" />
              <span className="font-semibold text-purple-900">Snowball</span>
            </div>
            <p className="text-sm text-purple-800 mb-3">Pay off your <strong>lowest balance</strong> debt first to get quick wins.</p>
            <p className="text-xs text-purple-600 font-medium">Best for: motivation — clearing debts quickly feels rewarding.</p>
          </div>
        </div>

        {/* Example */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <Info size={14} className="text-slate-400" />
            Example with the sample debts loaded in your account
          </p>
          <div className="space-y-2 text-sm">
            {[
              { name: 'Barclaycard', balance: 4200, rate: 22.9 },
              { name: 'Oakbrook Personal Loan', balance: 1800, rate: 14.9 },
              { name: 'Car Finance', balance: 9500, rate: 8.9 },
            ].map(d => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="w-44 text-slate-700">{d.name}</span>
                <span className="w-20 text-slate-500">{fmt(d.balance)}</span>
                <span className="text-slate-500">{d.rate}% APR</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-indigo-700 mb-1">Avalanche order</p>
              <ol className="space-y-0.5 text-slate-600 list-decimal list-inside">
                <li>Barclaycard (22.9%)</li>
                <li>Oakbrook Loan (14.9%)</li>
                <li>Car Finance (8.9%)</li>
              </ol>
            </div>
            <div>
              <p className="font-medium text-purple-700 mb-1">Snowball order</p>
              <ol className="space-y-0.5 text-slate-600 list-decimal list-inside">
                <li>Oakbrook Loan (£1,800)</li>
                <li>Barclaycard (£4,200)</li>
                <li>Car Finance (£9,500)</li>
              </ol>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Try switching between them on the Plan page to see how the debt-free date and total interest changes.
          </p>
        </div>
      </section>

      {/* Tips */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Tips to get debt-free faster</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              icon: <PiggyBank size={20} className="text-green-600" />,
              title: 'Even £50/month extra helps',
              desc: 'Use the plan slider. A small extra payment often shaves years off your timeline and saves thousands in interest.',
            },
            {
              icon: <TrendingDown size={20} className="text-indigo-600" />,
              title: 'Roll payments forward',
              desc: 'When a debt is cleared, put its full payment amount toward the next debt. That\'s the "domino effect" that accelerates everything.',
            },
            {
              icon: <Target size={20} className="text-purple-600" />,
              title: 'Check in monthly',
              desc: 'Log each payment as you make it. Watching your balance fall and your debt-free date approach keeps motivation high.',
            },
          ].map(t => (
            <div key={t.title} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="mb-2">{t.icon}</div>
              <p className="text-sm font-semibold text-slate-900 mb-1">{t.title}</p>
              <p className="text-xs text-slate-500">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Common questions</h2>
        <div className="space-y-3">
          {[
            {
              q: 'Is my data safe?',
              a: 'Guest mode is great for exploring, but your data only lives in this browser — clear your cache and it\'s gone. Create a free account to store everything securely in the cloud, access it from any device, and never lose your progress.',
            },
            {
              q: 'The sample debts aren\'t mine — how do I replace them?',
              a: 'Go to My Debts, delete the sample debts, and add your own. For the best experience, create a free account first so your real debts are saved permanently and synced across devices.',
            },
            {
              q: 'What\'s the difference between "minimum payment" and "extra payment"?',
              a: 'The minimum payment is what your lender requires each month. The extra payment is anything on top of that — you set it on the Plan page and it\'s applied to your highest-priority debt to speed up payoff.',
            },
            {
              q: 'Why does my debt-free date change when I switch strategy?',
              a: 'Different strategies attack debts in a different order. Avalanche eliminates the costliest interest faster, which usually results in a slightly earlier debt-free date. Snowball clears individual debts sooner, which can feel faster even if the total date is similar.',
            },
            {
              q: 'Can I track real payments and see my actual progress?',
              a: 'Payment tracking and live balance updates require a free account. Sign up to log every payment, watch your balances fall in real time, and keep your plan accurate as you pay down your debts.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm font-semibold text-slate-900 mb-1.5">{q}</p>
              <p className="text-sm text-slate-500">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {isAuthenticated ? (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-xl font-bold mb-2">Ready to see your debt-free date?</h2>
          <p className="text-indigo-200 mb-6 text-sm">Head to the Plan page to explore strategies and see your projected payoff timeline.</p>
          <Link
            to="/plan"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors"
          >
            View your payoff plan <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-xl font-bold mb-2">Save your plan — create a free account</h2>
          <p className="text-indigo-200 mb-6 text-sm">Guest mode is great for exploring. Sign up to lock in your debts, track real payments, and access your plan from any device.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors"
            >
              Create free account <ArrowRight size={16} />
            </Link>
            <Link
              to="/plan"
              className="inline-flex items-center gap-2 text-indigo-200 hover:text-white text-sm transition-colors"
            >
              Continue as guest
            </Link>
          </div>
        </div>
      )}

    </div>
  )
}

function FeatureCard({ icon, title, bullets }: { icon: React.ReactNode; title: string; bullets: string[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="font-semibold text-slate-900">{title}</span>
      </div>
      <ul className="space-y-1.5">
        {bullets.map((b) => (
          <li key={b} className="text-sm text-slate-500 flex gap-2">
            <span className="text-indigo-400 mt-0.5 shrink-0">·</span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  )
}
