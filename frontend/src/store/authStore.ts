import { create } from 'zustand'
import type { User } from '../types'
import { authService } from '../services/authService'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, firstName?: string) => Promise<void>
  logout: () => void
  init: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  init() {
    const user = authService.getUser()
    const isAuthenticated = authService.isAuthenticated()
    set({ user, isAuthenticated })
  },

  async login(email, password) {
    const response = await authService.login(email, password)
    authService.saveTokens(response)
    set({ user: response.user, isAuthenticated: true })
  },

  async register(email, password, firstName) {
    const response = await authService.register(email, password, firstName)
    authService.saveTokens(response)
    set({ user: response.user, isAuthenticated: true })
  },

  logout() {
    authService.logout()
    set({ user: null, isAuthenticated: false })
  },
}))
