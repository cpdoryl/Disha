import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'
import apiClient, { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/api/client'

export interface User {
  id: string
  email: string
  name: string
  role: string
  schoolId: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await apiClient.post('/api/v2/auth/login', {
            email,
            password,
          })
          const { accessToken, refreshToken, user } = response.data

          Cookies.set(ACCESS_TOKEN_COOKIE, accessToken, { expires: 1 })
          Cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, { expires: 7 })

          set({
            user: {
              id: user.id,
              email: user.email,
              name: `${user.firstName} ${user.lastName || ''}`.trim(),
              role: user.role,
              schoolId: user.schoolId || '',
            },
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      logout: () => {
        Cookies.remove(ACCESS_TOKEN_COOKIE)
        Cookies.remove(REFRESH_TOKEN_COOKIE)
        set({ user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'disha-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
