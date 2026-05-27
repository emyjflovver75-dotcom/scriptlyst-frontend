// Payments module - handles Stripe payment links
import { membership as apiMembership } from './api'

export const payments = {
  // plan: 'creator-monthly' | 'pro-monthly'
  async getUpgradeUrl(plan = 'pro-monthly') {
    try {
      const data = await apiMembership.upgrade(plan)
      return data.redirect_url
    } catch (e) {
      console.error('Failed to get upgrade URL:', e)
      return null
    }
  },

  openUrl(url) {
    if (url) window.open(url, '_blank')
  },
}
