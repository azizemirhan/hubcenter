import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  avatar?: string
}

interface Company {
  id: number
  name: string
  slug: string
  logo?: string
  company_type?: string
}

interface AuthState {
  user: User | null
  activeCompany: Company | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  setActiveCompany: (company: Company | null) => void
  setHasHydrated: (state: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      activeCompany: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => 
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      setTokens: (accessToken, refreshToken) => 
        set({ accessToken, refreshToken }),

      setActiveCompany: (company) => 
        set({ activeCompany: company }),

      logout: () => 
        set({ 
          user: null, 
          activeCompany: null, 
          accessToken: null, 
          refreshToken: null, 
          isAuthenticated: false 
        }),
        
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state })
    }),
    { 
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      }
    }
  )
)
