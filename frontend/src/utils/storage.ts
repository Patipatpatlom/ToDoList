const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export const storage = {
  getToken: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  setToken: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch (e) {
      console.error('Failed to save token to localStorage', e)
    }
  },
  removeToken: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch (e) {
      console.error('Failed to remove token from localStorage', e)
    }
  },
  getUser: <T>(): T | null => {
    try {
      const data = localStorage.getItem(USER_KEY)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  },
  setUser: <T>(user: T): void => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch (e) {
      console.error('Failed to save user to localStorage', e)
    }
  },
  clearAuth: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    } catch (e) {
      console.error('Failed to clear auth storage', e)
    }
  },
}
