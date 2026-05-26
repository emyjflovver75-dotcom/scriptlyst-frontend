// Payments module - handles Stripe payment links
import { membership as apiMembership } from './api'

export const payments = {
  async openStripe({ linkUrl, userId }) {
    // Append client_reference_id so webhook knows which user to upgrade
    const url = `${linkUrl}?client_reference_id=${userId}`
    window.open(url, '_blank')
  },

  async getUpgradeUrl() {
    try {
      const data = await apiMembership.upgrade()
      return data.redirect_url
    } catch (e) {
      console.error('Failed to get upgrade URL:', e)
      return null
    }
  }
}
