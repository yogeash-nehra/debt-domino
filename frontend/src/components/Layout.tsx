import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { LayoutDashboard, CreditCard, TrendingDown, Receipt, LogOut, UserPlus, HelpCircle } from 'lucide-react'

export function Layout() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-slate-600 hover:bg-slate-100'
    }`

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <TrendingDown className="text-indigo-600" size={24} />
            <span className="font-bold text-lg text-slate-900">Debt Domino</span>
          </div>
          {isAuthenticated && user?.firstName && (
            <p className="text-xs text-slate-500 mt-1">Hi, {user.firstName}</p>
          )}
          {!isAuthenticated && (
            <p className="text-xs text-slate-500 mt-1">Guest mode</p>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/" end className={navClass}>
            <LayoutDashboard size={16} />
            Dashboard
          </NavLink>
          <NavLink to="/debts" className={navClass}>
            <CreditCard size={16} />
            My Debts
          </NavLink>
          <NavLink to="/payments" className={navClass}>
            <Receipt size={16} />
            Payments
          </NavLink>
          <NavLink to="/plan" className={navClass}>
            <TrendingDown size={16} />
            Payoff Plan
          </NavLink>
          <NavLink to="/help" className={navClass}>
            <HelpCircle size={16} />
            Help
          </NavLink>
        </nav>

        <div className="p-4 border-t border-slate-200">
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 px-1 mb-2">Your data is saved locally. Sign up to keep it forever.</p>
              <Link
                to="/register"
                className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <UserPlus size={16} />
                Create free account
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                Sign in
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-slate-50">
        <Outlet />
      </main>
    </div>
  )
}
