import { useState, useEffect } from 'react'
import { auth } from '../lib/auth'
import { memberships } from '../lib/memberships'
import { payments } from '../lib/payments'
import { usePro } from '../hooks/usePro'
import { Crown, Check, X, Loader2, Zap, LogIn } from 'lucide-react'

const STRIPE_LINK = 'https://buy.stripe.com/8x2aEXbQkaAPh22gMb1gs04'

const FEATURES = [
  { free: '3 generations/day', pro: 'Unlimited generations' },
  { free: '1 thumbnail/day', pro: 'Unlimited thumbnails' },
  { free: 'Basic output', pro: 'Premium quality' },
  { free: '—', pro: 'All niches & formats' },
  { free: '—', pro: 'Priority support' },
]

export default function Paywall({ onClose }) {
  const { refresh } = usePro()
  const [loadingTier, setLoadingTier] = useState(null)
  const [user, setUser] = useState(auth.getCurrentUser())
  const [signingIn, setSigningIn] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const unsub = auth.onAuthChange((u) => setUser(u))
    return unsub
  }, [])

  const handleSignIn = async () => {
    setSigningIn(true)
    try {
      const u = await auth.signIn()
      if (u) setUser(u)
    } catch (e) {
      console.error(e)
    } finally {
      setSigningIn(false)
    }
  }

  const handleSubscribe = async () => {
    if (!user) {
      handleSignIn()
      return
    }

    setLoadingTier('pro-monthly')
    try {
      const pending = await memberships.startPending({
        tierId: 'pro-monthly',
        method: 'stripe',
      })

      payments.openStripe({ linkUrl: STRIPE_LINK, userId: pending.userId })
      setSubmitted(true)
      setTimeout(() => {
        refresh()
        setLoadingTier(null)
      }, 3000)
    } catch (e) {
      console.error(e)
      setLoadingTier(null)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 flex items-end justify-center"
      style={{ height: 'var(--visual-height, 100dvh)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl overflow-y-auto bg-white"
        style={{ maxHeight: 'calc(var(--visual-height, 100dvh) - 2rem)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-end p-4 pb-0">
          <button onClick={onClose} className="p-2 rounded-full active:scale-90 bg-gray-100">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="text-center px-6 pb-5">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(140,40,255,0.15), rgba(200,100,255,0.1))' }}>
            <Crown size={28} className="text-[rgb(140,40,255)]" />
          </div>
          <h2 className="font-display text-xl font-bold text-gray-900">
            Emy's Magic Pro
          </h2>
          <p className="text-gray-500 text-sm mt-2">
            Unlimited YouTube content generation
          </p>
        </div>

        {/* Feature comparison */}
        <div className="px-6 pb-5">
          <div className="rounded-2xl overflow-hidden border border-gray-100">
            <div className="grid grid-cols-2">
              <div className="px-4 py-2.5 text-center bg-gray-50" style={{ borderBottom: '1px solid #f0f0f0' }}>
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Free</span>
              </div>
              <div className="px-4 py-2.5 text-center" style={{ borderBottom: '2px solid rgb(140,40,255)', borderLeft: '1px solid #f0f0f0', background: 'rgba(140,40,255,0.04)' }}>
                <span className="text-[10px] font-bold text-[rgb(140,40,255)] uppercase tracking-wider">Pro</span>
              </div>
            </div>
            {FEATURES.map((f, i) => (
              <div key={i} className="grid grid-cols-2" style={{ borderBottom: i < FEATURES.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                <div className="px-4 py-2.5">
                  <span className="text-gray-400 text-[11px]">{f.free}</span>
                </div>
                <div className="px-4 py-2.5 flex items-center gap-1.5" style={{ borderLeft: '1px solid #f0f0f0', background: 'rgba(140,40,255,0.02)' }}>
                  <Check size={10} className="text-[rgb(140,40,255)] shrink-0" />
                  <span className="text-gray-800 text-[11px] font-medium">{f.pro}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subscribe or sign in */}
        <div className="px-6 pb-8">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-green-50">
                <Check size={24} className="text-green-500" />
              </div>
              <p className="text-gray-900 font-display text-sm font-bold">Payment submitted!</p>
              <p className="text-gray-500 text-xs mt-2 leading-relaxed">
                Once your payment is confirmed, your Pro access will be activated. This usually takes a few minutes.
              </p>
            </div>
          ) : !user ? (
            <>
              <button
                onClick={handleSignIn}
                disabled={signingIn}
                className="w-full py-4 rounded-2xl font-display text-sm font-bold tracking-wide text-white btn-magic transition-all active:scale-[0.97] disabled:opacity-50"
              >
                {signingIn ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <LogIn size={18} />
                    Sign in to Subscribe
                  </span>
                )}
              </button>
              <p className="text-center text-gray-400 text-[10px] mt-3">
                Create a free account to get started
              </p>
            </>
          ) : (
            <>
              <button
                onClick={handleSubscribe}
                disabled={!!loadingTier}
                className="w-full py-4 rounded-2xl font-display text-sm font-bold tracking-wide text-white btn-magic transition-all active:scale-[0.97] disabled:opacity-50"
              >
                {loadingTier ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Zap size={18} />
                    Go Pro — $17/mo
                  </span>
                )}
              </button>
              <p className="text-center text-gray-400 text-[10px] mt-3">
                Cancel anytime · Secure payment via Stripe
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
