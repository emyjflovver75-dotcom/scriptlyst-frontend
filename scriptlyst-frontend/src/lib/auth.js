// Auth module - replaces Whacka auth with our own backend
import { auth as apiAuth, getCurrentUser, clearToken } from './api'

let _authChangeCallbacks = []

export const auth = {
  getCurrentUser() {
    return getCurrentUser()
  },

  async signIn(email, password) {
    const data = await apiAuth.login(email, password)
    _authChangeCallbacks.forEach(cb => cb(data.user))
    return data.user
  },

  async signUp(email, password) {
    const data = await apiAuth.signup(email, password)
    _authChangeCallbacks.forEach(cb => cb(data.user))
    return data.user
  },

  signOut() {
    clearToken()
    _authChangeCallbacks.forEach(cb => cb(null))
  },

  onAuthChange(callback) {
    _authChangeCallbacks.push(callback)
    return () => {
      _authChangeCallbacks = _authChangeCallbacks.filter(cb => cb !== callback)
    }
  }
}
