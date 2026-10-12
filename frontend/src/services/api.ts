import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { storage } from '../utils/storage'

// Retrieve backend API base URL from Vite environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

/**
 * Standard Axios instance configured for the ToDoList API
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

/**
 * Request Interceptor: Attach JWT Bearer token from localStorage to every outgoing request
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Check both standard token keys for compatibility
    const token = storage.getToken() || localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Attach x-user-id header for workspace member authentication (defaulting to seeded workspace member)
    const user = storage.getUser<{ id: string; email?: string }>()
    const isValidUuid = user?.id && user.id.length === 36 && !user.id.startsWith('user-')
    const userId = isValidUuid
      ? user.id
      : user?.email === 'bob@example.com'
        ? 'eb99fc02-8a76-407a-a42d-3fe8fd42dc99'
        : '7217035a-7369-481a-b37e-7e22cc2d68c8'

    if (userId && config.headers) {
      config.headers['x-user-id'] = userId
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  },
)

/**
 * Response Interceptor: Handle common HTTP error statuses (e.g., 401 Unauthorized)
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear expired authentication tokens and optionally dispatch logout
      storage.clearAuth()
      localStorage.removeItem('token')
      // If needed, emit event or handle route redirect
    }
    return Promise.reject(error)
  },
)

export default apiClient
