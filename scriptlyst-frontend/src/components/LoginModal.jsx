import { useState } from 'react'
import { auth } from '../lib/auth'
import { X, Loader2, Wand2 } from 'lucide-react'

export default function LoginModal({ onClose, onSuccess }) {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!email.trim() || !password) { setError('Please enter your email and password'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')
    try {
      const u = tab === 'login'
        ? await auth.signIn(email.trim(), password)
        : await auth.signUp(email.trim(), password)
      if (u) { onSuccess?.(u); onClose() }
    } catch (e) {
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
      style={{ height: 'var(--visual-height, 100dvh)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white overflow-y-auto"
        style={{ maxHeight: 'calc(var(--visual-height, 100dvh) - 2rem)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-end p-4 pb-0">
          <button onClick={onClose} className="p-2 rounded-full bg-gray-100 active:scale-90">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="text-center px-6 pb-4">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(155,60,255,0.12)' }}>
            <Wand2 size={24} className="text-[rgb(155,60,255)]" />
          </div>
          <h2 className="font-display text-xl font-bold text-gray-900">Welcome to Scriptlyst</h2>
          <p className="text-gray-500 text-sm mt-1">Sign in or create a free account</p>
        </div>

        {/* Tabs */}
        <div className="flex mx-6 mb-4 rounded-xl overflow-hidden border border-gray-100">
          {['login', 'signup'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              className="flex-1 py-2.5 text-sm font-display font-bold transition-all"
              style={tab === t
                ? { background: 'rgb(155,60,255)', color: 'white' }
                : { background: 'white', color: '#9ca3af' }}
            >
              {t === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <div className="px-6 pb-8 space-y-3">
          {error && (
            <p className="text-red-500 text-xs text-center bg-red-50 rounded-xl py-2 px-3">{error}</p>
          )}

          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && document.getElementById('sl-password').focus()}
            placeholder="Email address"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400"
          />
          <input
            id="sl-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Password (min 6 characters)"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400"
          />

          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-display text-sm font-bold tracking-wide text-white btn-magic transition-all active:scale-[0.97] disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                {tab === 'login' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              tab === 'login' ? 'Log In' : 'Create Free Account'
            )}
          </button>

          {tab === 'signup' && (
            <p className="text-center text-gray-400 text-[10px]">Free account — no credit card needed</p>
          )}
        </div>
      </div>
    </div>
  )
}
