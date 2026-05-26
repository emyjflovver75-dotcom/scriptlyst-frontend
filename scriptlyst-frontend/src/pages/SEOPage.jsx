import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ai } from '../lib/ai'
import { db } from '../lib/db'
import { useNiche } from '../hooks/useNiche'
import { usePro } from '../hooks/usePro'
import PageHeader, { ProBadge } from '../components/PageHeader'
import NicheBar from '../components/NicheBar'
import Paywall from '../components/Paywall'
import { ArrowLeft, Search, Copy, Check, Loader2, Sparkles } from 'lucide-react'

export default function SEOPage() {
  const navigate = useNavigate()
  const { niche } = useNiche()
  const { checkCanUse, recordUse } = usePro()
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [sections, setSections] = useState([])
  const [copiedIdx, setCopiedIdx] = useState(-1)
  const [showPaywall, setShowPaywall] = useState(false)

  const handleGenerate = async () => {
    if (!topic.trim()) return
    const { allowed } = checkCanUse('generate')
    if (!allowed) { setShowPaywall(true); return }

    setLoading(true)
    setSections([])
    try {
      const prompt = `You are a YouTube SEO expert for the "${niche}" niche.

For the video topic: "${topic}"

Provide a complete SEO optimization package:

OPTIMIZED TITLE:
[A click-worthy, keyword-rich title under 60 characters]

DESCRIPTION:
[A full YouTube description (300+ words) with:
- Hook paragraph (2 sentences)
- Detailed summary with natural keyword placement
- Timestamps placeholder
- Social links section
- 3 related video suggestions]

TAGS:
[20 relevant tags, comma-separated, mix of broad and specific keywords]

KEYWORDS:
[5 primary keywords this video should rank for, with estimated search volume (low/medium/high)]

SEARCH INTENT:
[What viewers searching for this topic actually want to learn/see]

THUMBNAIL TEXT:
[2-3 word text overlay suggestion for the thumbnail]`

      const { text } = await ai.run(prompt)
      const parsed = parseSEO(text)
      setSections(parsed)
      await recordUse('generate')
      await db.insert('history', { type: 'seo', input: topic, output: text })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const copySection = async (text, idx) => {
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
        title="SEO Optimizer"
        subtitle="Rank higher on YouTube search"
        left={<button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl active:scale-90"><ArrowLeft size={18} className="text-gray-500" /></button>}
        right={<ProBadge onUpgrade={() => setShowPaywall(true)} />}
      />

      <div className="space-y-3 pb-4">
        <NicheBar />

        <div className="px-4 space-y-3">
          <div className="content-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Search size={14} className="text-red-500" />
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Video Topic</span>
            </div>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder={`e.g. "Best ${niche} tips for beginners 2025"...`}
              rows={2}
              className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm resize-none outline-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="w-full py-3.5 rounded-xl font-display text-sm font-bold text-white btn-magic transition-all flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Optimizing...</> : <><Sparkles size={16} /> Optimize for SEO</>}
          </button>

          {loading && (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="content-card p-4">
                  <div className="h-4 w-32 rounded animate-shimmer mb-2" />
                  <div className="h-3 w-full rounded animate-shimmer" style={{ animationDelay: `${i * 0.2}s` }} />
                  <div className="h-3 w-2/3 rounded animate-shimmer mt-1.5" />
                </div>
              ))}
            </div>
          )}

          {!loading && sections.length > 0 && (
            <div className="space-y-2.5">
              {sections.map((s, i) => (
                <div key={i} className="content-card p-4 animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display text-[10px] font-bold text-red-500 uppercase tracking-wider">{s.title}</h3>
                    <button onClick={() => copySection(s.content, i)} className="p-2 rounded-lg active:scale-90" style={{ background: 'rgba(239,68,68,0.06)' }}>
                      {copiedIdx === i ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
                    </button>
                  </div>
                  <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{s.content}</p>
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

function parseSEO(text) {
  const sections = []
  const keys = ['OPTIMIZED TITLE', 'DESCRIPTION', 'TAGS', 'KEYWORDS', 'SEARCH INTENT', 'THUMBNAIL TEXT']
  for (let i = 0; i < keys.length; i++) {
    const regex = new RegExp(`${keys[i]}[:\\s]*\\n?`, 'i')
    const match = text.match(regex)
    if (match) {
      const start = match.index + match[0].length
      let end = text.length
      for (let j = i + 1; j < keys.length; j++) {
        const next = new RegExp(`\\n${keys[j]}[:\\s]`, 'i')
        const nm = text.substring(start).match(next)
        if (nm) { end = start + nm.index; break }
      }
      const content = text.substring(start, end).trim()
      if (content) sections.push({ title: keys[i], content })
    }
  }
  if (sections.length === 0 && text.trim()) {
    sections.push({ title: 'SEO Analysis', content: text.trim() })
  }
  return sections
}
