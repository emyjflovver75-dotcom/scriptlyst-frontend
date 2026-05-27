// Memberships module - replaces Whacka memberships with our backend
import { membership as apiMembership } from './api'

export const memberships = {
  async getCurrent() {
    try {
      const data = await apiMembership.status()
      const isActive = data.tier === 'pro' && data.is_active
      return {
        isActive,
        tier: data.tier,
        // stripe_plan distinguishes 'creator-monthly' ($17) from 'pro-monthly' ($37)
        planName: data.stripe_plan || (isActive ? 'pro-monthly' : 'free'),
        expiresAt: data.expires_at,
      }
    } catch {
      return { isActive: false, tier: 'free', planName: 'free' }
    }
  },

  async startPending({ tierId }) {
    const user = JSON.parse(localStorage.getItem('scriptlyst_user') || '{}')
    return { userId: user.id, tierId }
  },
}
