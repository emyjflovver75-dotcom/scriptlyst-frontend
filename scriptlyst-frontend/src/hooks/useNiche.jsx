import { createContext, useContext, useState, useEffect } from 'react'
import { db } from '../lib/db'

const NicheContext = createContext({ niche: '', setNiche: () => {}, hasNiche: false })

export function NicheProvider({ children }) {
  const [niche, setNicheState] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    db.get('prefs', 'niche').then(r => {
      if (r?.value) setNicheState(r.value)
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  const setNiche = async (v) => {
    setNicheState(v)
    await db.upsert('prefs', { value: v }, 'niche')
  }

  if (!loaded) return null

  return (
    <NicheContext.Provider value={{ niche, setNiche, hasNiche: !!niche.trim() }}>
      {children}
    </NicheContext.Provider>
  )
}

export function useNiche() {
  return useContext(NicheContext)
}
