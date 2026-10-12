import { create } from 'zustand'
import { storage } from '../utils/storage'

export interface User {
  id: string
  email: string
  name: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}

const initialToken = storage.getToken() || localStorage.getItem('token')
const initialUser = storage.getUser<User>()

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: Boolean(initialToken),

  setAuth: (user: User, token: string) => {
    storage.setToken(token)
    storage.setUser(user)
    set({
      user,
      token,
      isAuthenticated: true,
    })
  },

  logout: () => {
    storage.clearAuth()
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    })
  },
}))
