// Scriptlyst API client - connects to your Render backend
const API_URL = import.meta.env.VITE_API_URL || 'https://scriptlyst-backend.onrender.com'
const TIMEOUT_MS = 30000

// Pre-warm backend on module load so it's awake before the user signs in
fetch(`${API_URL}/health`).catch(() => {})

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Server is starting up — please try again in a moment.')
    }
    throw new Error('Cannot reach the server. Check your connection and try again.')
  } finally {
    clearTimeout(timer)
  }
}

// Get auth token from localStorage
function getToken() {
  try {
    return localStorage.getItem('scriptlyst_token') || null
  } catch {
    return null
  }
}

// Save auth token to localStorage
export function saveToken(token) {
  try {
    localStorage.setItem('scriptlyst_token', token)
  } catch {}
}

// Clear auth token
export function clearToken() {
  try {
    localStorage.removeItem('scriptlyst_token')
    localStorage.removeItem('scriptlyst_user')
  } catch {}
}

// Get current user
export function getCurrentUser() {
  try {
    const userJson = localStorage.getItem('scriptlyst_user')
    return userJson ? JSON.parse(userJson) : null
  } catch {
    return null
  }
}

// Save current user
export function saveUser(user) {
  try {
    localStorage.setItem('scriptlyst_user', JSON.stringify(user))
  } catch {}
}

// API headers
function getHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

// Auth API
export const auth = {
  async signup(email, password) {
    const res = await fetchWithTimeout(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Signup failed')
    if (data.token) saveToken(data.token)
    if (data.user) saveUser(data.user)
    return data
  },

  async login(email, password) {
    const res = await fetchWithTimeout(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    if (data.token) saveToken(data.token)
    if (data.user) saveUser(data.user)
    return data
  },

  async me() {
    const res = await fetchWithTimeout(`${API_URL}/api/auth/me`, {
      headers: getHeaders()
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Not authenticated')
    return data
  },

  logout() {
    clearToken()
  }
}

// Generation API
export const generate = {
  async script({ niche, topic, style = 'casual', length = 'medium' }) {
    const res = await fetchWithTimeout(`${API_URL}/api/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ niche, topic, style, length })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Generation failed')
    return data
  },

  async video({ script, voiceId, avatarId }) {
    const res = await fetchWithTimeout(`${API_URL}/api/generate-video`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ script, voiceId, avatarId })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Video generation failed')
    return data
  }
}

// History API
export const history = {
  async get(limit = 20, offset = 0) {
    const res = await fetchWithTimeout(`${API_URL}/api/history?limit=${limit}&offset=${offset}`, {
      headers: getHeaders()
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to get history')
    return data
  },

  async delete(id) {
    const res = await fetchWithTimeout(`${API_URL}/api/history/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to delete')
    return data
  }
}

// Membership API
export const membership = {
  async status() {
    const res = await fetchWithTimeout(`${API_URL}/api/membership/status`, {
      headers: getHeaders()
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to get membership')
    return data
  },

  async upgrade(plan = 'pro-monthly') {
    const res = await fetchWithTimeout(`${API_URL}/api/membership/upgrade`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ plan })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to upgrade')
    return data
  }
}
