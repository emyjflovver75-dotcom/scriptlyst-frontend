import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ai } from '../lib/ai'
import { db } from '../lib/db'
import { useNiche } from '../hooks/useNiche'
import { usePro } from '../hooks/usePro'
import PageHeader, { ProBadge } from '../components/PageHeader'
import NicheBar from '../components/NicheBar'
import Paywall from '../components/Paywall'
import { ArrowLeft, MessageSquare, Copy, Check, Loader2, Sparkles, RefreshCw } from 'lucide-react'

const CTA_TYPES = ['Subscribe', 'Like & Share', 'Comment', 'Link in Bio', 'Download', 'Buy Now', 'Join Community']

export default function CTAPage() {
  const navigate = useNavigate()
  const { niche } = useNiche()
  const { checkCanUse, recordUse } = usePro()
  const [ctaType, setCtaType] = useState('Subscribe')
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [ctas, setCtas] = useState([])
  const [copiedIdx, setCopiedIdx] = useState(-1)
  const [showPaywall, setShowPaywall] = useState(false)

  const handleGenerate = async () => {
    const { allowed } = checkCanUse('generate')
    if (!allowed) { setShowPaywall(true); return }

    setLoading(true)
    setCtas([])
    try {
      const contextLine = context.trim() ? `Video context: ${context}` : ''
      const prompt = `You are a conversion copywriter for the "${niche}" niche on YouTube.

Generate 8 compelling CTAs (calls-to-action) designed to get viewers to: ${ctaType}
${contextLine}

Requirements:
- Each CTA must be natural and conversational (not salesy/cringe)
- Mix formats: verbal (what to say in the video), text overlay, pinned comment, end screen
- Include the format type in brackets before each CTA
- Vary from soft ask to strong urge

Format each on its own line, numbered 1-8.
Example: [Verbal] "If this helped you even 1%, smash that subscribe button — it's free and it helps me make more content like this."`

      const { text } = await ai.run(prompt)
      const parsed = text.split('\n')
        .map(l => l.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter(l => l.length > 10)
        .slice(0, 8)
      setCtas(parsed)
      await recordUse('generate')
      await db.insert('history', { type: 'cta', input: `${ctaType} CTAs`, output: text })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const copyCta = async (text, idx) => {
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
        title="CTA Generator"
        subtitle="Calls-to-action that convert"
        left={<button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl active:scale-90"><ArrowLeft size={18} className="text-gray-500" /></button>}
        right={<ProBadge onUpgrade={() => setShowPaywall(true)} />}
      />

      <div className="space-y-3 pb-4">
        <NicheBar />

        <div className="px-4 space-y-3">
          {/* CTA Type */}
          <div className="flex flex-wrap gap-2">
            {CTA_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setCtaType(t)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${t === ctaType ? 'text-white shadow-md' : 'text-gray-500 bg-white border border-gray-100'}`}
                style={t === ctaType ? { background: 'rgb(139,92,246)', boxShadow: '0 2px 10px rgba(139,92,246,0.3)' } : {}}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Context */}
          <div className="content-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={14} className="text-violet-500" />
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Video Context (optional)</span>
            </div>
            <input
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder={`e.g. "Tutorial about ${niche} basics"...`}
              className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm outline-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-display text-sm font-bold text-white btn-magic transition-all flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Generating...</> : ctas.length > 0 ? <><RefreshCw size={16} /> More CTAs</> : <><Sparkles size={16} /> Generate CTAs</>}
          </button>

          {loading && (
            <div className="space-y-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="content-card p-4">
                  <div className="h-4 w-full rounded animate-shimmer" style={{ animationDelay: `${i * 0.15}s` }} />
                </div>
              ))}
            </div>
          )}

          {!loading && ctas.length > 0 && (
            <div className="space-y-2">
              {ctas.map((cta, i) => (
                <div key={i} className="content-card p-4 flex items-start gap-3 animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <MessageSquare size={14} className="text-violet-400 shrink-0 mt-0.5" />
                  <p className="text-gray-800 text-sm flex-1 leading-relaxed">{cta}</p>
                  <button onClick={() => copyCta(cta, i)} className="p-2 rounded-lg shrink-0 active:scale-90" style={{ background: 'rgba(139,92,246,0.06)' }}>
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
