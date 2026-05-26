import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../lib/auth'
import { db } from '../lib/db'
import { useNiche } from '../hooks/useNiche'
import { usePro } from '../hooks/usePro'
import PageHeader, { ProBadge } from '../components/PageHeader'
import NicheBar from '../components/NicheBar'
import Paywall from '../components/Paywall'
import {
  Lightbulb, FileText, Image, Zap, Calendar, Repeat, Search, Hash,
  MessageSquare, Crown, Clock, ChevronRight, Sparkles, LogIn, User, LogOut, Shield
} from 'lucide-react'

const QUICK_ACTIONS = [
  { icon: Lightbulb, label: 'Video Ideas', path: '/ideas', color: '#8c28ff' },
  { icon: FileText, label: 'Write Script', path: '/scripts', color: '#a855f7' },
  { icon: Image, label: 'Thumbnails', path: '/visuals', color: '#c864ff' },
  { icon: Zap, label: 'Viral Hooks', path: '/hooks', color: '#f59e0b' },
  { icon: Calendar, label: 'Calendar', path: '/calendar', color: '#10b981' },
  { icon: Repeat, label: 'Repurpose', path: '/repurpose', color: '#3b82f6' },
  { icon: Search, label: 'SEO Tools', path: '/seo', color: '#ef4444' },
  { icon: Hash, label: 'Hashtags', path: '/hashtags', color: '#06b6d4' },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { niche } = useNiche()
  const { isPro, checkCanUse } = usePro()
  const [showPaywall, setShowPaywall] = useState(false)
  const [user, setUser] = useState(auth.getCurrentUser())
  const [recentCount, setRecentCount] = useState(0)

  useEffect(() => {
    const unsub = auth.onAuthChange(u => setUser(u))
    return unsub
  }, [])

  useEffect(() => {
    db.count('history').then(setRecentCount).catch(() => {})
  }, [])

  const handleSignIn = async () => {
    const u = await auth.signIn()
    if (u) setUser(u)
  }

  const genCheck = checkCanUse('generate')

  return (
    <div className="min-h-full">
      {/* Header area */}
      <div className="pt-[env(safe-area-inset-top)] px-5 pb-4" style={{ background: 'linear-gradient(180deg, rgba(140,40,255,0.1) 0%, transparent 100%)' }}>
        <div className="pt-4 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold text-gray-900 tracking-tight">
              Emy's Magic ✨
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">Your content command center</p>
          </div>
          <div className="flex items-center gap-2">
            {isPro && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: 'rgba(140,40,255,0.1)', color: 'rgb(140,40,255)' }}>
                <Crown size={10} /> PRO
              </span>
            )}
            {user ? (
              <button
                onClick={() => { auth.signOut(); setUser(null) }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] text-gray-500 bg-white border border-gray-100 active:scale-95 transition-all"
              >
                <User size={12} />
                <span className="max-w-[80px] truncate">{user.displayName || user.email?.split('@')[0]}</span>
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] text-gray-500 bg-white border border-gray-100 active:scale-95 transition-all"
              >
                <LogIn size={12} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4 pb-4">
        <NicheBar />

        {/* Stats row */}
        <div className="flex gap-3">
          <div className="flex-1 content-card p-3.5 text-center">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">Credits</p>
            <p className="font-display text-xl font-bold text-gray-900">
              {isPro ? '∞' : `${genCheck.remaining}/${genCheck.limit}`}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">{isPro ? 'Unlimited' : 'daily'}</p>
          </div>
          <div className="flex-1 content-card p-3.5 text-center">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">Created</p>
            <p className="font-display text-xl font-bold text-gray-900">{recentCount}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">total items</p>
          </div>
          <div className="flex-1 content-card p-3.5 text-center">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">Niche</p>
            <p className="font-display text-sm font-bold text-[rgb(140,40,255)] truncate">{niche}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">active</p>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div>
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mb-3">Quick Create</p>
          <div className="grid grid-cols-4 gap-2.5">
            {QUICK_ACTIONS.map((a, i) => (
              <button
                key={a.path}
                onClick={() => navigate(a.path)}
                className="tool-card p-3 flex flex-col items-center gap-2 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${a.color}12` }}>
                  <a.icon size={18} style={{ color: a.color }} />
                </div>
                <span className="text-[10px] text-gray-600 font-medium text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* More tools */}
        <div>
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mb-3">More Tools</p>
          <div className="space-y-2">
            {[
              { icon: MessageSquare, label: 'CTA Generator', desc: 'Calls-to-action that convert', path: '/cta', color: '#8b5cf6' },
              { icon: Sparkles, label: 'A/B Title Tester', desc: 'Test 5 title variations', path: '/title-tester', color: '#ec4899' },
              { icon: Clock, label: 'History', desc: 'All your generated content', path: '/history', color: '#6b7280' },
            ].map((tool, i) => (
              <button
                key={tool.path}
                onClick={() => navigate(tool.path)}
                className="w-full tool-card p-3.5 flex items-center gap-3 text-left animate-fade-in-up"
                style={{ animationDelay: `${(i + 8) * 0.04}s` }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${tool.color}12` }}>
                  <tool.icon size={18} style={{ color: tool.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 font-semibold">{tool.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{tool.desc}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Pro upsell */}
        {!isPro && (
          <button
            onClick={() => setShowPaywall(true)}
            className="w-full rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(140,40,255,0.08), rgba(200,100,255,0.05))',
              border: '1px solid rgba(140,40,255,0.15)',
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(140,40,255,0.12)' }}>
              <Crown size={18} className="text-[rgb(140,40,255)]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-gray-800 text-sm font-display font-bold">Upgrade to Pro</p>
              <p className="text-gray-400 text-[10px] mt-0.5">Unlimited everything for $17/mo</p>
            </div>
            <Sparkles size={16} className="text-[rgb(200,100,255)]" />
          </button>
        )}

        {/* Admin link */}
        {user && (
          <button
            onClick={() => navigate('/admin')}
            className="w-full tool-card p-3.5 flex items-center gap-3 text-left"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gray-50">
              <Shield size={18} className="text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 font-medium">Admin Panel</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Manage subscriptions</p>
            </div>
            <ChevronRight size={14} className="text-gray-300 shrink-0" />
          </button>
        )}
      </div>

      {showPaywall && <Paywall onClose={() => setShowPaywall(false)} />}
    </div>
  )
}
