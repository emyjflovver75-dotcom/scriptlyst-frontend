import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ai } from '../lib/ai'
import { db } from '../lib/db'
import { useNiche } from '../hooks/useNiche'
import { usePro } from '../hooks/usePro'
import PageHeader, { ProBadge } from '../components/PageHeader'
import NicheBar from '../components/NicheBar'
import Paywall from '../components/Paywall'
import { ArrowLeft, Zap, Copy, Check, Loader2, Sparkles, RefreshCw } from 'lucide-react'

const HOOK_TYPES = ['Question', 'Shocking Stat', 'Bold Claim', 'Story', 'Controversy', 'Challenge']

export default function HooksPage() {
  const navigate = useNavigate()
  const { niche } = useNiche()
  const { checkCanUse, recordUse } = usePro()
  const [topic, setTopic] = useState('')
  const [hookType, setHookType] = useState('Question')
  const [loading, setLoading] = useState(false)
  const [hooks, setHooks] = useState([])
  const [copiedIdx, setCopiedIdx] = useState(-1)
  const [showPaywall, setShowPaywall] = useState(false)

  const handleGenerate = async () => {
    const { allowed } = checkCanUse('generate')
    if (!allowed) { setShowPaywall(true); return }

    setLoading(true)
    setHooks([])
    try {
      const topicLine = topic.trim() ? `about "${topic}"` : ''
      const prompt = `You are a viral content strategist for the "${niche}" niche.

Generate 8 killer video hooks (the first 3 seconds of a video) ${topicLine}.
Hook style: ${hookType}

Each hook must be:
- Under 15 words
- Instantly attention-grabbing
- Make viewers NEED to keep watching
- Optimized for YouTube Shorts / TikTok / Reels

Format each on its own line, numbered 1-8. No explanations, just the hooks.`

      const { text } = await ai.run(prompt)
      const parsed = text.split('\n')
        .map(l => l.replace(/^\d+[\.\)]\s*/, '').replace(/^[""]|[""]$/g, '').trim())
        .filter(l => l.length > 5)
        .slice(0, 8)
      setHooks(parsed)
      await recordUse('generate')
      await db.insert('history', { type: 'hooks', input: `${hookType} hooks for ${topic || niche}`, output: text })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const copyHook = async (text, idx) => {
    try { await navigator.clipboard.writeText(text) } catch {
      const ta = document.createElement('textarea')
      ta.value = text; document.body.appendChild(ta)
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
    }
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(-1), 2000)
  }

  return (
    <div className="min-h-full">
      <PageHeader
        title="Viral Hooks"
        subtitle="First 3 seconds that stop the scroll"
        left={<button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl active:scale-90"><ArrowLeft size={18} className="text-gray-500" /></button>}
        right={<ProBadge onUpgrade={() => setShowPaywall(true)} />}
      />

      <div className="space-y-3 pb-4">
        <NicheBar />

        <div className="px-4 space-y-3">
          {/* Hook type selector */}
          <div className="flex flex-wrap gap-2">
            {HOOK_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setHookType(t)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${t === hookType ? 'text-white shadow-md' : 'text-gray-500 bg-white border border-gray-100'}`}
                style={t === hookType ? { background: 'rgb(140,40,255)', boxShadow: '0 2px 10px rgba(140,40,255,0.3)' } : {}}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Optional topic */}
          <div className="content-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-amber-500" />
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Topic (optional)</span>
            </div>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder={`e.g. "Why most ${niche} tips fail"...`}
              className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm outline-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-display text-sm font-bold text-white btn-magic transition-all flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Generating...</> : hooks.length > 0 ? <><RefreshCw size={16} /> More Hooks</> : <><Sparkles size={16} /> Generate Hooks</>}
          </button>

          {loading && (
            <div className="space-y-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="content-card p-4">
                  <div className="h-4 w-3/4 rounded animate-shimmer" style={{ animationDelay: `${i * 0.15}s` }} />
                </div>
              ))}
            </div>
          )}

          {!loading && hooks.length > 0 && (
            <div className="space-y-2">
              {hooks.map((hook, i) => (
                <div key={i} className="content-card p-4 flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <Zap size={14} className="text-amber-500 shrink-0" />
                  <p className="text-gray-800 text-sm font-medium flex-1 leading-snug">{hook}</p>
                  <button onClick={() => copyHook(hook, i)} className="p-2 rounded-lg shrink-0 active:scale-90" style={{ background: 'rgba(140,40,255,0.06)' }}>
                    {copiedIdx === i ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showPaywall && <Paywall onClose={() => setShowPaywall(false)} />}
    </div>
  )
}
