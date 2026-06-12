import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { DebtsPage } from './pages/DebtsPage'
import { PlanPage } from './pages/PlanPage'
import { PaymentsPage } from './pages/PaymentsPage'

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>
}

export default function App() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => { init() }, [init])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
        <Route path="/register" element={<AuthRedirect><RegisterPage /></AuthRedirect>} />
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="debts" element={<DebtsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="plan" element={<PlanPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
