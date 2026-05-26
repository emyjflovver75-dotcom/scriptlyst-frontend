import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ai } from '../lib/ai'
import { db } from '../lib/db'
import { useNiche } from '../hooks/useNiche'
import { usePro } from '../hooks/usePro'
import PageHeader, { ProBadge } from '../components/PageHeader'
import Paywall from '../components/Paywall'
import { ArrowLeft, Repeat, Copy, Check, Loader2, Sparkles } from 'lucide-react'

const PLATFORMS = [
  { id: 'twitter', label: '𝕏 / Twitter Thread', emoji: '🐦' },
  { id: 'linkedin', label: 'LinkedIn Post', emoji: '💼' },
  { id: 'instagram', label: 'Instagram Caption', emoji: '📸' },
  { id: 'tiktok', label: 'TikTok Script', emoji: '🎵' },
  { id: 'newsletter', label: 'Email Newsletter', emoji: '📧' },
]

export default function RepurposePage() {
  const navigate = useNavigate()
  const { niche } = useNiche()
  const { checkCanUse, recordUse } = usePro()
  const [content, setContent] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState(['twitter', 'instagram', 'tiktok'])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [copiedIdx, setCopiedIdx] = useState(-1)
  const [showPaywall, setShowPaywall] = useState(false)

  const togglePlatform = (id) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleGenerate = async () => {
    if (!content.trim() || selectedPlatforms.length === 0) return
    const { allowed } = checkCanUse('generate')
    if (!allowed) { setShowPaywall(true); return }

    setLoading(true)
    setResults([])
    try {
      const platLabels = selectedPlatforms.map(id => PLATFORMS.find(p => p.id === id)?.label).join(', ')
      const prompt = `You are a multi-platform content strategist for the "${niche}" niche.

Take this original content and repurpose it for each platform listed below. Adapt the tone, length, format, and style for each platform's best practices.

ORIGINAL CONTENT:
${content}

REPURPOSE FOR:
${platLabels}

For each platform, format your output as:
PLATFORM: [Platform name]
---
[Repurposed content ready to post, including emojis, hashtags, line breaks as appropriate for that platform]
===

Make each version feel NATIVE to that platform — not just a copy-paste. Twitter threads should use numbered tweets, LinkedIn should be professional with paragraph breaks, Instagram should have engaging caption style, TikTok should be a spoken script, newsletters should have a subject line + body.`

      const { text } = await ai.run(prompt)
      const parsed = parseRepurposed(text)
      setResults(parsed)
      await recordUse('generate')
      await db.insert('history', { type: 'repurpose', input: content.slice(0, 100), output: text })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const copyResult = async (text, idx) => {
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
        title="Content Repurposer"
        subtitle="One content → every platform"
        left={<button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl active:scale-90"><ArrowLeft size={18} className="text-gray-500" /></button>}
        right={<ProBadge onUpgrade={() => setShowPaywall(true)} />}
      />

      <div className="px-4 space-y-3 pb-4">
        {/* Source content */}
        <div className="content-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Repeat size={14} className="text-blue-500" />
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Original Content</span>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Paste your YouTube script, blog post, or any content you want to repurpose..."
            rows={5}
            className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm resize-none outline-none"
          />
        </div>

        {/* Platform selector */}
        <div>
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mb-2">Repurpose to</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => {
              const active = selectedPlatforms.includes(p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={`px-3 py-2 rounded-xl text-[11px] font-medium transition-all flex items-center gap-1.5 ${active ? 'text-white shadow-md' : 'text-gray-500 bg-white border border-gray-100'}`}
                  style={active ? { background: 'rgb(59,130,246)', boxShadow: '0 2px 10px rgba(59,130,246,0.3)' } : {}}
                >
                  <span>{p.emoji}</span> {p.label}
                </button>
              )
            })}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !content.trim() || selectedPlatforms.length === 0}
          className="w-full py-3.5 rounded-xl font-display text-sm font-bold text-white btn-magic transition-all flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 size={18} className="animate-spin" /> Repurposing...</> : <><Sparkles size={16} /> Repurpose Content</>}
        </button>

        {loading && (
          <div className="space-y-2">
            {selectedPlatforms.map((_, i) => (
              <div key={i} className="content-card p-4">
                <div className="h-3 w-24 rounded animate-shimmer mb-3" />
                <div className="h-3 w-full rounded animate-shimmer" style={{ animationDelay: `${i * 0.2}s` }} />
                <div className="h-3 w-3/4 rounded animate-shimmer mt-2" />
              </div>
            ))}
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-3">
            {results.map((r, i) => (
              <div key={i} className="content-card p-4 animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-xs font-bold text-[rgb(59,130,246)] uppercase tracking-wider">{r.platform}</h3>
                  <button onClick={() => copyResult(r.content, i)} className="p-2 rounded-lg active:scale-90" style={{ background: 'rgba(59,130,246,0.06)' }}>
                    {copiedIdx === i ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
                  </button>
                </div>
                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{r.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPaywall && <Paywall onClose={() => setShowPaywall(false)} />}
    </div>
  )
}

function parseRepurposed(text) {
  const results = []
  const blocks = text.split(/={3,}/)
  for (const block of blocks) {
    const platMatch = block.match(/PLATFORM:\s*(.+)/i)
    if (platMatch) {
      const platform = platMatch[1].trim()
      const contentStart = block.indexOf('---')
      const content = contentStart !== -1
        ? block.substring(contentStart + 3).trim()
        : block.substring(block.indexOf(platMatch[0]) + platMatch[0].length).trim()
      if (content) results.push({ platform, content })
    }
  }
  if (results.length === 0 && text.trim()) {
    results.push({ platform: 'Repurposed', content: text.trim() })
  }
  return results
}
