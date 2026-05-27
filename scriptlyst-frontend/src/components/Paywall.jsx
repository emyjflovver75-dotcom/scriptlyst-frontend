import { useState, useEffect } from 'react'
import { auth } from '../lib/auth'
import { payments } from '../lib/payments'
import { usePro } from '../hooks/usePro'
import { Crown, Check, X, Loader2, Zap, Video, LogIn, Sparkles } from 'lucide-react'

const TIERS = [
  {
    id: 'creator-monthly',
    label: 'Creator',
    price: '$17',
    period: '/month',
    tagline: 'All text tools, unlimited',
    color: 'rgb(140,40,255)',
    colorAlpha: 'rgba(140,40,255,0.08)',
    colorBorder: 'rgba(140,40,255,0.2)',
    icon: Zap,
    features: [
      'Unlimited script generation',
      'Unlimited hooks & CTAs',
      'Unlimited SEO & hashtags',
      'Unlimited ideas & calendar',
      'All niches & formats',
    ],
    notIncluded: ['AI video generation (HeyGen)'],
  },
  {
    id: 'pro-monthly',
    label: 'Pro',
    price: '$37',
    period: '/month',
    tagline: 'Text + AI video generation',
    color: 'rgb(200,40,255)',
    colorAlpha: 'rgba(200,40,255,0.08)',
    colorBorder: 'rgba(200,40,255,0.35)',
    icon: Crown,
    badge: 'BEST VALUE',
    features: [
      'Everything in Creator',
      'AI video generation (HeyGen)',
      'Full avatar & voice selection',
      'Video download links',
      'Priority support',
    ],
  },
]

export default function Paywall({ onClose }) {
  const { refresh } = usePro()
  const [loadingTier, setLoadingTier] = useState(null)
  const [user, setUser] = useState(auth.getCurrentUser())
  const [signingIn, setSigningIn] = useState(false)
  const [submittedTier, setSubmittedTier] = useState(null)

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

  const handleSubscribe = async (tierId) => {
    if (!user) { handleSignIn(); return }
    setLoadingTier(tierId)
    try {
      const url = await payments.getUpgradeUrl(tierId)
      if (url) {
        payments.openUrl(url)
        setSubmittedTier(tierId)
        setTimeout(() => { refresh(); setLoadingTier(null) }, 3000)
      } else {
        setLoadingTier(null)
      }
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
        {/* Header */}
        <div className="flex justify-end p-4 pb-0">
          <button onClick={onClose} className="p-2 rounded-full active:scale-90 bg-gray-100">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="text-center px-6 pb-4">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(140,40,255,0.15), rgba(200,100,255,0.1))' }}>
            <Sparkles size={24} className="text-[rgb(140,40,255)]" />
          </div>
          <h2 className="font-display text-xl font-bold text-gray-900">Upgrade Scriptlyst</h2>
          <p className="text-gray-500 text-sm mt-1">Choose the plan that fits your workflow</p>
        </div>

        {/* Sign-in gate */}
        {!user ? (
          <div className="px-6 pb-8 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-gray-50">
              <LogIn size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-900 font-display text-base font-bold">Sign in first</p>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed max-w-[260px] mx-auto">
              Please sign in or create a free account, then come back here to upgrade.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full py-4 rounded-2xl font-display text-sm font-bold tracking-wide text-white btn-magic transition-all active:scale-[0.97]"
            >
              Go Sign In
            </button>
          </div>
        ) : submittedTier ? (
          <div className="text-center px-6 pb-10 pt-2">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-green-50">
              <Check size={24} className="text-green-500" />
            </div>
            <p className="text-gray-900 font-display text-base font-bold">Payment submitted!</p>
            <p className="text-gray-500 text-xs mt-2 leading-relaxed max-w-[260px] mx-auto">
              Your {submittedTier === 'creator-monthly' ? 'Creator' : 'Pro'} access will activate within a few minutes once the payment is confirmed.
            </p>
          </div>
        ) : (
          <div className="px-4 pb-8 space-y-3">
            {TIERS.map((tier) => {
              const Icon = tier.icon
              const isLoading = loadingTier === tier.id
              return (
                <div
                  key={tier.id}
                  className="rounded-2xl p-4"
                  style={{ background: tier.colorAlpha, border: `1.5px solid ${tier.colorBorder}` }}
                >
                  {/* Tier header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${tier.color}18` }}>
                        <Icon size={16} style={{ color: tier.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-bold text-gray-900">{tier.label}</span>
                          {tier.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: tier.color }}>
                              {tier.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500">{tier.tagline}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-display text-xl font-bold text-gray-900">{tier.price}</span>
                      <span className="text-[10px] text-gray-400">{tier.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-1.5 mb-4">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check size={11} style={{ color: tier.color }} className="shrink-0" />
                        <span className="text-[11px] text-gray-700">{f}</span>
                      </li>
                    ))}
                    {tier.notIncluded?.map((f) => (
                      <li key={f} className="flex items-center gap-2 opacity-40">
                        <X size={11} className="text-gray-400 shrink-0" />
                        <span className="text-[11px] text-gray-500 line-through">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA button */}
                  <button
                    onClick={() => handleSubscribe(tier.id)}
                    disabled={!!loadingTier}
                    className="w-full py-3 rounded-xl font-display text-sm font-bold tracking-wide text-white transition-all active:scale-[0.97] disabled:opacity-60"
                    style={{ background: `linear-gradient(135deg, ${tier.color}, ${tier.color}cc)` }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin" /> Opening Stripe...
                      </span>
                    ) : (
                      `Get ${tier.label} — ${tier.price}/mo`
                    )}
                  </button>
                </div>
              )
            })}

            <p className="text-center text-gray-400 text-[10px] pt-1">
              Cancel anytime · Secure payment via Stripe
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
