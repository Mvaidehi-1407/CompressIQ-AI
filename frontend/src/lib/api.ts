import axios from 'axios'

const api = axios.create({
  baseURL: '',
  timeout: 120000,
})

// Inject stored token on startup
const stored = localStorage.getItem('compressiq-auth')
if (stored) {
  try {
    const parsed = JSON.parse(stored)
    const token = parsed?.state?.accessToken
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  } catch {}
}

export default api
