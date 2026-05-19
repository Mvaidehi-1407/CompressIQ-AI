import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'

interface User {
  id: string
  username: string
  email: string
  created_at: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (identifier: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  setTokens: (access: string, refresh: string) => void
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setTokens: (access, refresh) => {
        set({ accessToken: access, refreshToken: refresh })
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`
      },

      login: async (identifier, password) => {
        set({ isLoading: true })
        const res = await api.post('/api/auth/login', { identifier, password })
        const { user, access_token, refresh_token } = res.data
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
        set({ user, accessToken: access_token, refreshToken: refresh_token, isAuthenticated: true, isLoading: false })
      },

      register: async (username, email, password) => {
        set({ isLoading: true })
        const res = await api.post('/api/auth/register', { username, email, password })
        const { user, access_token, refresh_token } = res.data
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
        set({ user, accessToken: access_token, refreshToken: refresh_token, isAuthenticated: true, isLoading: false })
      },

      logout: () => {
        delete api.defaults.headers.common['Authorization']
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      fetchMe: async () => {
        try {
          const { accessToken } = get()
          if (accessToken) {
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
          }
          const res = await api.get('/api/auth/me')
          set({ user: res.data.user, isAuthenticated: true })
        } catch {
          get().logout()
        }
      },
    }),
    {
      name: 'compressiq-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
