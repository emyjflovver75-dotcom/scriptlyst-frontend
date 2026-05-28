// Memberships module - replaces Whacka memberships with our backend
import { membership as apiMembership } from './api'

export const memberships = {
  async getCurrent() {
    const data = await apiMembership.status() // let errors bubble up so usePro can retry
    const isActive = data.tier === 'pro' && data.is_active
    return {
      isActive,
      tier: data.tier,
      planName: data.stripe_plan || (isActive ? 'pro-monthly' : 'free'),
      expiresAt: data.expires_at,
    }
  },

  async startPending({ tierId }) {
    const user = JSON.parse(localStorage.getItem('scriptlyst_user') || '{}')
    return { userId: user.id, tierId }
  },
}
