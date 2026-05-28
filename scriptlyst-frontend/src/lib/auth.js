// Auth module - replaces Whacka auth with our own backend
import { auth as apiAuth, getCurrentUser, clearToken } from './api'

let _authChangeCallbacks = []

// Broadcast to all listeners and update localStorage-backed state
function _broadcast(user) {
  _authChangeCallbacks.forEach(cb => cb(user))
}

export const auth = {
  getCurrentUser() {
    return getCurrentUser()
  },

  // Verify token with backend and return fresh user — use when mounting protected views
  async verifySession() {
    try {
      const data = await apiAuth.me()
      const user = data.user || null
      if (user) _broadcast(user)
      return user
    } catch {
      return getCurrentUser() // fall back to cached value
    }
  },

  async signIn(email, password) {
    const data = await apiAuth.login(email, password)
    _broadcast(data.user)
    return data.user
  },

  async signUp(email, password) {
    const data = await apiAuth.signup(email, password)
    _broadcast(data.user)
    return data.user
  },

  signOut() {
    clearToken()
    _broadcast(null)
  },

  onAuthChange(callback) {
    _authChangeCallbacks.push(callback)
    return () => {
      _authChangeCallbacks = _authChangeCallbacks.filter(cb => cb !== callback)
    }
  }
}
