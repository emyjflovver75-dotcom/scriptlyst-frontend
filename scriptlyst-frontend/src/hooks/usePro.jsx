import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { memberships } from '../lib/memberships'
import { auth } from '../lib/auth'
import { db } from '../lib/db'

const ProContext = createContext({
  isPro: false,
  membership: null,
  usage: null,
  loading: true,
  refresh: () => {},
  checkCanUse: () => ({ allowed: true }),
  recordUse: () => {},
})

// Free tier: daily limits
const FREE_LIMITS = {
  generate: 3,
  thumbnail: 1,
}

export function ProProvider({ children }) {
  const [membership, setMembership] = useState(null)
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async (attempt = 0) => {
    try {
      const m = await memberships.getCurrent()
      setMembership(m)

      const today = new Date().toISOString().split('T')[0]
      const existing = await db.get('daily-usage', today)
      setUsage(existing || { generate: 0, thumbnail: 0 })
    } catch (e) {
      if (attempt < 3) {
        // Backend may be waking up — retry with backoff
        setTimeout(() => refresh(attempt + 1), (attempt + 1) * 4000)
      } else {
        setMembership({ isActive: false, tier: 'free', planName: 'free' })
      }
    } finally {
      if (attempt === 0) setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    // Re-check Pro status when auth changes (sign in / sign out)
    const unsub = auth.onAuthChange(() => {
      refresh()
    })
    return unsub
  }, [refresh])

  const isPro = membership?.isActive === true

  const checkCanUse = useCallback((feature) => {
    if (isPro) return { allowed: true, remaining: Infinity }
    const limit = FREE_LIMITS[feature] || 3
    const used = usage?.[feature] || 0
    return { allowed: used < limit, remaining: Math.max(0, limit - used), limit }
  }, [isPro, usage])

  const recordUse = useCallback(async (feature) => {
    const today = new Date().toISOString().split('T')[0]
    const current = { ...(usage || {}) }
    current[feature] = (current[feature] || 0) + 1
    setUsage(current)
    await db.upsert('daily-usage', current, today)
  }, [usage])

  return (
    <ProContext.Provider value={{ isPro, membership, usage, loading, refresh, checkCanUse, recordUse }}>
      {children}
    </ProContext.Provider>
  )
}

export function usePro() {
  return useContext(ProContext)
}
