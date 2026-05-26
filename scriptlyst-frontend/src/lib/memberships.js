// Memberships module - replaces Whacka memberships with our backend
import { membership as apiMembership } from './api'

export const memberships = {
  async getCurrent() {
    try {
      const data = await apiMembership.status()
      return {
        isActive: data.tier === 'pro' && data.is_active,
        tier: data.tier,
        expiresAt: data.expires_at
      }
    } catch {
      return { isActive: false, tier: 'free' }
    }
  },

  async startPending({ tierId, method }) {
    const user = JSON.parse(localStorage.getItem('scriptlyst_user') || '{}')
    return { userId: user.id, tierId, method }
  }
}
