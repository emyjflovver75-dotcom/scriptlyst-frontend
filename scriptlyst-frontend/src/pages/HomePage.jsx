import { useState, useEffect } from 'react'
import { auth } from '../lib/auth'
import { useNiche } from '../hooks/useNiche'
import { usePro } from '../hooks/usePro'
import { Target, Sparkles, Wand2, Crown, LogIn, User } from 'lucide-react'
import Paywall from '../components/Paywall'

const POPULAR_NICHES = [
  'Tech Reviews', 'Fitness & Gym', 'Personal Finance', 'Cooking',
  'Gaming', 'Travel Vlog', 'Self Improvement', 'Beauty & Skincare',
  'Business Tips', 'Music', 'Education', 'Comedy',
  'Real Estate', 'Fashion', 'Parenting', 'Photography',
]

export default function HomePage() {
  const { setNiche } = useNiche()
  const { isPro } = usePro()
  const [input, setInput] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)
  const [user, setUser] = useState(auth.getCurrentUser())

  useEffect(() => {
    const unsub = auth.onAuthChange((u) => setUser(u))
    return unsub
  }, [])

  const handleStart = (value) => {
    const v = value || input
    if (v.trim()) setNiche(v.trim())
  }

  const handleSignIn = async () => {
    const u = await auth.signIn()
    if (u) setUser(u)
  }

  return (
    <div className="min-h-full flex flex-col">
      <div className="pt-[env(safe-area-inset-top)]" />

      {/* Top bar */}
      <div className="flex items-center justify-end px-5 pt-4">
        {user ? (
          <div className="flex items-center gap-2">
            {isPro && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: 'rgba(200,100,255,0.15)', color: 'rgb(220,130,255)' }}>
                <Crown size={10} /> PRO
              </span>
            )}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] text-gray-400"
              style={{ background: 'rgba(155,60,255,0.08)', border: '1px solid rgba(155,60,255,0.12)' }}
            >
              <User size={12} />
              <span className="max-w-[100px] truncate">{user.displayName || user.email?.split('@')[0] || 'Account'}</span>
            </div>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] text-gray-400 transition-all active:scale-95"
            style={{ background: 'rgba(155,60,255,0.08)', border: '1px solid rgba(155,60,255,0.12)' }}
          >
            <LogIn size={12} />
            Sign In
          </button>
        )}
      </div>

      {/* Hero */}
      <div className="px-5 pt-8 pb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center glow-purple" style={{ background: 'rgba(155,60,255,0.18)' }}>
            <Wand2 size={26} className="text-[rgb(155,60,255)]" />
          </div>
        </div>
        <h1 className="font-display text-3xl font-bold text-white leading-tight">
          Emy's Magic<br />
          <span className="text-[rgb(220,130,255)] glow-text">Content Studio</span>
        </h1>
        <p className="text-gray-400 text-sm mt-4 leading-relaxed max-w-[280px] mx-auto">
          AI-powered scripts, hooks, thumbnails, SEO, calendars & more — for every content platform
        </p>
      </div>

      {/* Input */}
      <div className="px-5 mb-6">
        <div className="glass-card rounded-2xl p-1 flex items-center gap-1">
          <div className="flex items-center gap-2 px-3 flex-1">
            <Target size={16} className="text-[rgb(155,60,255)] shrink-0" />
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              placeholder="Enter your content niche..."
              className="flex-1 bg-transparent text-white text-sm py-3.5 outline-none placeholder-gray-600"
            />
          </div>
          <button
            onClick={() => handleStart()}
            disabled={!input.trim()}
            className="btn-magic rounded-xl px-5 py-3.5 text-white font-display text-xs font-bold flex items-center gap-1.5 shrink-0 disabled:opacity-30"
          >
            <Sparkles size={14} />
            Go
          </button>
        </div>
      </div>

      {/* Popular niches */}
      <div className="px-5 flex-1">
        <p className="text-gray-600 text-[10px] font-medium uppercase tracking-widest mb-3">Popular Niches</p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_NICHES.map(n => (
            <button
              key={n}
              onClick={() => handleStart(n)}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-400 transition-all active:scale-95"
              style={{
                background: 'rgba(155,60,255,0.06)',
                border: '1px solid rgba(155,60,255,0.12)',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Pro upsell */}
      {!isPro && (
        <div className="px-5 pb-6 pt-4">
          <button
            onClick={() => setShowPaywall(true)}
            className="w-full rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(155,60,255,0.12), rgba(220,130,255,0.08))',
              border: '1px solid rgba(155,60,255,0.2)',
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(155,60,255,0.2)' }}>
              <Crown size={18} className="text-[rgb(220,130,255)]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white text-sm font-display font-bold">Unlock Pro</p>
              <p className="text-gray-500 text-[10px] mt-0.5">Unlimited generations for $17/mo</p>
            </div>
            <Sparkles size={16} className="text-[rgb(200,100,255)]" />
          </button>
        </div>
      )}

      {showPaywall && <Paywall onClose={() => setShowPaywall(false)} />}
    </div>
  )
}
