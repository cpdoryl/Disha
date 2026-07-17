import axios from 'axios'
import Cookies from 'js-cookie'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const ACCESS_TOKEN_COOKIE = 'disha_access_token'
export const REFRESH_TOKEN_COOKIE = 'disha_refresh_token'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = Cookies.get(ACCESS_TOKEN_COOKIE)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = Cookies.get(REFRESH_TOKEN_COOKIE)
  if (!refreshToken) return null

  try {
    const response = await axios.post(`${API_BASE_URL}/api/v2/auth/refresh`, {
      refreshToken,
    })
    const { accessToken, refreshToken: newRefreshToken } = response.data
    Cookies.set(ACCESS_TOKEN_COOKIE, accessToken, { expires: 1 })
    if (newRefreshToken) {
      Cookies.set(REFRESH_TOKEN_COOKIE, newRefreshToken, { expires: 7 })
    }
    return accessToken
  } catch {
    Cookies.remove(ACCESS_TOKEN_COOKIE)
    Cookies.remove(REFRESH_TOKEN_COOKIE)
    return null
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null
        })
      }

      const newToken = await refreshPromise
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      }

      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
