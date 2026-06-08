import api from './api'
import type { AuthResponse } from '../types'

export const authService = {
  async register(email: string, password: string, firstName?: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', { email, password, firstName })
    return data
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
    return data
  },

  logout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  },

  saveTokens(response: AuthResponse) {
    localStorage.setItem('accessToken', response.accessToken)
    localStorage.setItem('refreshToken', response.refreshToken)
    localStorage.setItem('user', JSON.stringify(response.user))
  },

  getUser() {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  },

  isAuthenticated() {
    return !!localStorage.getItem('accessToken')
  },
}
