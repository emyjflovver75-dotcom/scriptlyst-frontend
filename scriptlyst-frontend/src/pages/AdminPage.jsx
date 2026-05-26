import { useState, useEffect } from 'react'
import { auth } from '../lib/auth'
import { memberships } from '../lib/memberships'
import PageHeader from '../components/PageHeader'
import { Shield, Check, X, Loader2, UserCheck, Settings, RefreshCw, Crown } from 'lucide-react'

export default function AdminPage() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [setupDone, setSetupDone] = useState(false)
  const [processing, setProcessing] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => { checkAdmin() }, [])

  const checkAdmin = async () => {
    try {
      const queue = await memberships.listPending()
      setPending(queue)
      setSetupDone(true)
    } catch {
      // Not admin yet
    } finally {
      setLoading(false)
    }
  }

  const handleSetup = async () => {
    setLoading(true)
    try {
      let user = auth.getCurrentUser()
      if (!user) {
        user = await auth.signIn()
        if (!user) { setLoading(false); return }
      }
      await memberships.configureAdmin()
      await memberships.defineTiers([
        {
          id: 'pro-monthly',
          name: "Emy's Magic Pro",
          price: 17,
          currency: 'USD',
          period: 'month',
          quotas: { generate: 99999, thumbnail: 99999 },
          perks: ['Unlimited generations', 'Unlimited thumbnails', 'All niches & formats', 'Priority support'],
        },
      ])
      setSetupDone(true)
      setMessage('Setup complete! You are now the admin.')
      const queue = await memberships.listPending()
      setPending(queue)
      setTimeout(() => setMessage(null), 4000)
    } catch (e) {
      console.error(e)
      setMessage('Setup failed. Make sure you are signed in.')
      setTimeout(() => setMessage(null), 4000)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const queue = await memberships.listPending()
      setPending(queue)
    } catch (e) { console.error(e) }
    finally { setRefreshing(false) }
  }

  const handleApprove = async (id) => {
    setProcessing(id)
    try {
      await memberships.approvePending(id)
      setPending(prev => prev.filter(p => p.id !== id))
      setMessage('Approved! User now has Pro access.')
      setTimeout(() => setMessage(null), 3000)
    } catch (e) { console.error(e) }
    finally { setProcessing(null) }
  }

  const handleReject = async (id) => {
    setProcessing(id)
    try {
      await memberships.rejectPending(id, 'Payment not verified')
      setPending(prev => prev.filter(p => p.id !== id))
    } catch (e) { console.error(e) }
    finally { setProcessing(null) }
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 size={24} className="text-[rgb(140,40,255)] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-full">
      <PageHeader title="Emy's Magic — Admin" subtitle="Manage Pro subscriptions" />

      <div className="px-4 space-y-4 pb-4">
        {/* Message toast */}
        {message && (
          <div className="p-3 rounded-xl text-sm font-medium text-center animate-fade-in" style={{ background: 'rgba(140,40,255,0.08)', color: 'rgb(100,20,200)', border: '1px solid rgba(140,40,255,0.15)' }}>
            {message}
          </div>
        )}

        {!setupDone && (
          <div className="content-card p-6 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(140,40,255,0.08)' }}>
              <Settings size={22} className="text-[rgb(140,40,255)]" />
            </div>
            <h3 className="text-gray-900 font-display text-base font-bold mb-2">First-Time Setup</h3>
            <p className="text-gray-500 text-sm mb-1">Set yourself as the admin of Emy's Magic.</p>
            <p className="text-gray-400 text-xs mb-5">This creates the Pro tier ($17/mo) and gives you control over payments.</p>
            <button onClick={handleSetup} className="px-8 py-3.5 rounded-xl font-display text-sm font-bold text-white btn-magic transition-all active:scale-[0.97]">
              Run Setup
            </button>
          </div>
        )}

        {setupDone && (
          <>
            {/* Stats */}
            <div className="content-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield size={14} className="text-[rgb(140,40,255)]" />
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Pending Payments</span>
                  </div>
                  <p className="font-display text-3xl font-bold text-gray-900">{pending.length}</p>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-3 rounded-xl active:scale-90 transition-all"
                  style={{ background: 'rgba(140,40,255,0.06)' }}
                >
                  <RefreshCw size={16} className={`text-[rgb(140,40,255)] ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* How it works */}
            <div className="content-card p-4">
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-2">How it works</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white" style={{ background: 'rgb(140,40,255)' }}>1</span>
                  <p className="text-gray-600 text-xs">User taps "Go Pro" and pays via Stripe</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white" style={{ background: 'rgb(140,40,255)' }}>2</span>
                  <p className="text-gray-600 text-xs">Payment appears here as pending</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white" style={{ background: 'rgb(140,40,255)' }}>3</span>
                  <p className="text-gray-600 text-xs">You verify in Stripe → tap Approve → user gets Pro</p>
                </div>
              </div>
            </div>

            {/* Pending list */}
            {pending.length === 0 ? (
              <div className="flex flex-col items-center py-14">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(34,197,94,0.08)' }}>
                  <UserCheck size={20} className="text-green-500" />
                </div>
                <p className="text-gray-600 text-sm font-medium">All caught up</p>
                <p className="text-gray-400 text-xs mt-1">No pending payments to review</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Awaiting approval</p>
                {pending.map(p => (
                  <div key={p.id} className="content-card p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(140,40,255,0.08)' }}>
                          <Crown size={14} className="text-[rgb(140,40,255)]" />
                        </div>
                        <div>
                          <p className="text-gray-900 text-sm font-medium">{p.userId?.slice(0, 12)}...</p>
                          <p className="text-gray-400 text-[10px] mt-0.5">{p.tierId} · {p.method}</p>
                        </div>
                      </div>
                      {p.createdAt && (
                        <span className="text-gray-400 text-[10px]">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {p.note && (
                      <p className="text-gray-600 text-xs mb-3 rounded-lg p-2.5 bg-gray-50">{p.note}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(p.id)}
                        disabled={processing === p.id}
                        className="flex-1 py-2.5 rounded-xl font-display text-[11px] font-bold text-green-700 flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all active:scale-[0.97] bg-green-50 border border-green-200"
                      >
                        {processing === p.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(p.id)}
                        disabled={processing === p.id}
                        className="flex-1 py-2.5 rounded-xl font-display text-[11px] font-bold text-red-600 flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all active:scale-[0.97] bg-red-50 border border-red-200"
                      >
                        <X size={12} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
