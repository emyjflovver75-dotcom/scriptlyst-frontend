import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ai } from '../lib/ai'
import { db } from '../lib/db'
import { useNiche } from '../hooks/useNiche'
import { usePro } from '../hooks/usePro'
import PageHeader, { ProBadge } from '../components/PageHeader'
import NicheBar from '../components/NicheBar'
import Paywall from '../components/Paywall'
import { ArrowLeft, Sparkles, Copy, Check, Loader2, Star, BarChart3 } from 'lucide-react'

export default function TitleTesterPage() {
  const navigate = useNavigate()
  const { niche } = useNiche()
  const { checkCanUse, recordUse } = usePro()
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [titles, setTitles] = useState([])
  const [copiedIdx, setCopiedIdx] = useState(-1)
  const [showPaywall, setShowPaywall] = useState(false)

  const handleGenerate = async () => {
    if (!topic.trim()) return
    const { allowed } = checkCanUse('generate')
    if (!allowed) { setShowPaywall(true); return }

    setLoading(true)
    setTitles([])
    try {
      const prompt = `You are a YouTube title optimization expert for the "${niche}" niche.

For the video topic: "${topic}"

Generate 5 different title variations, each using a different copywriting technique:

For each title provide:
TITLE: [The title, under 60 characters]
TECHNIQUE: [Which technique: Curiosity Gap / Numbers / How-To / Controversy / Emotional]
CTR SCORE: [Rate 1-10 for predicted click-through rate]
WHY: [One sentence explaining why this title works]

Number them 1-5 and rank from most likely to get clicks to least.`

      const { text } = await ai.run(prompt)
      const parsed = parseTitles(text)
      setTitles(parsed)
      await recordUse('generate')
      await db.insert('history', { type: 'title-test', input: topic, output: text })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const copyTitle = async (text, idx) => {
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
        title="A/B Title Tester"
        subtitle="Find the title with highest CTR"
        left={<button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl active:scale-90"><ArrowLeft size={18} className="text-gray-500" /></button>}
        right={<ProBadge onUpgrade={() => setShowPaywall(true)} />}
      />

      <div className="space-y-3 pb-4">
        <NicheBar />

        <div className="px-4 space-y-3">
          <div className="content-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={14} className="text-pink-500" />
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Video Topic / Idea</span>
            </div>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder={`e.g. "Tips for growing a ${niche} channel fast"...`}
              rows={2}
              className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm resize-none outline-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="w-full py-3.5 rounded-xl font-display text-sm font-bold text-white btn-magic transition-all flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Testing...</> : <><Sparkles size={16} /> Test 5 Titles</>}
          </button>

          {loading && (
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="content-card p-4">
                  <div className="h-4 w-3/4 rounded animate-shimmer mb-2" />
                  <div className="h-3 w-full rounded animate-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
                </div>
              ))}
            </div>
          )}

          {!loading && titles.length > 0 && (
            <div className="space-y-2.5">
              {titles.map((t, i) => (
                <div key={i} className="content-card p-4 animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="flex items-start gap-3">
                    <span
                      className="font-display text-[10px] font-bold mt-0.5 shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-white"
                      style={{ background: i === 0 ? '#ec4899' : i === 1 ? '#a855f7' : '#6b7280' }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm font-semibold leading-snug">{t.title}</p>
                      {t.technique && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-medium" style={{ background: 'rgba(236,72,153,0.08)', color: '#ec4899' }}>
                          {t.technique}
                        </span>
                      )}
                      {t.score && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-[10px] text-gray-400">CTR Score:</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 10 }).map((_, si) => (
                              <Star key={si} size={8} className={si < parseInt(t.score) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-gray-700">{t.score}/10</span>
                        </div>
                      )}
                      {t.why && <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">{t.why}</p>}
                    </div>
                    <button onClick={() => copyTitle(t.title, i)} className="p-2 rounded-lg shrink-0 active:scale-90" style={{ background: 'rgba(236,72,153,0.06)' }}>
                      {copiedIdx === i ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
                    </button>
                  </div>
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

function parseTitles(text) {
  const titles = []
  const blocks = text.split(/(?=\d+[\.\)]\s)/)
  for (const block of blocks) {
    const titleMatch = block.match(/TITLE:\s*(.+)/i)
    const techMatch = block.match(/TECHNIQUE:\s*(.+)/i)
    const scoreMatch = block.match(/CTR SCORE:\s*(\d+)/i)
    const whyMatch = block.match(/WHY:\s*(.+)/i)
    if (titleMatch) {
      titles.push({
        title: titleMatch[1].trim(),
        technique: techMatch?.[1]?.trim() || '',
        score: scoreMatch?.[1]?.trim() || '',
        why: whyMatch?.[1]?.trim() || '',
      })
    }
  }
  if (titles.length === 0) {
    const lines = text.split('\n').filter(l => l.trim().length > 10)
    lines.slice(0, 5).forEach(l => {
      titles.push({ title: l.replace(/^\d+[\.\)]\s*/, '').trim(), technique: '', score: '', why: '' })
    })
  }
  return titles
}
