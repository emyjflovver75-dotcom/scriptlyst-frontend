const STORAGE_KEY = 'scriptlyst_anon_id'
const AUTH_TOKEN_KEY = 'scriptlyst_token'
const AUTH_USER_KEY = 'scriptlyst_user'

/**
 * Get the current user ID for data scoping.
 * - If the user is authenticated (via auth.signIn/signUp), returns their real user ID.
 * - Otherwise, returns an anonymous device-level UUID (created on first visit).
 *
 * This function is used by db.js to scope data per user.
 */
export function getAppUserId() {
  // Check if user is authenticated first
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    const userJson = localStorage.getItem(AUTH_USER_KEY)
    if (token && userJson) {
      const user = JSON.parse(userJson)
      if (user?.id) return user.id
    }
  } catch {
    // Fall through to anonymous
  }

  // Fall back to anonymous UUID
  try {
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(STORAGE_KEY, id)
      console.log('[user] New anonymous user created:', id)
    }
    return id
  } catch {
    // localStorage unavailable (private mode, etc.) — generate ephemeral ID
    return crypto.randomUUID()
  }
}

/**
 * Get the anonymous user ID (even when authenticated).
 * Used internally for data migration during sign-up/sign-in.
 */
export function getAnonymousId() {
  try {
    return localStorage.getItem(STORAGE_KEY) || null
  } catch {
    return null
  }
}
