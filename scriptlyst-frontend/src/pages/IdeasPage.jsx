import { useState } from 'react'
import { ai } from '../lib/ai'
import { db } from '../lib/db'
import { useNiche } from '../hooks/useNiche'
import { usePro } from '../hooks/usePro'
import PageHeader, { ProBadge } from '../components/PageHeader'
import NicheBar from '../components/NicheBar'
import Paywall from '../components/Paywall'
import { Lightbulb, Copy, Check, Loader2, Sparkles, RefreshCw } from 'lucide-react'

export default function IdeasPage() {
  const { niche } = useNiche()
  const { checkCanUse, recordUse } = usePro()
  const [loading, setLoading] = useState(false)
  const [ideas, setIdeas] = useState([])
  const [copiedIdx, setCopiedIdx] = useState(-1)
  const [showPaywall, setShowPaywall] = useState(false)

  const handleGenerate = async () => {
    const { allowed } = checkCanUse('generate')
    if (!allowed) { setShowPaywall(true); return }

    setLoading(true)
    setIdeas([])
    try {
      const prompt = `You are a YouTube content strategist specializing in the "${niche}" niche.

Generate 10 unique, high-potential video ideas. For each idea provide:
- A click-worthy title (optimized for CTR)
- A one-line hook (the first sentence of the video)
- 5 relevant hashtags

Format each as:
TITLE: [title]
HOOK: [hook]
TAGS: [#tag1 #tag2 #tag3 #tag4 #tag5]

Number them 1-10. Make titles varied — mix "How to", listicles, challenges, stories, and trending formats. Each should target a different sub-topic within ${niche}.`

      const { text } = await ai.run(prompt)
      const parsed = parseIdeas(text)
      setIdeas(parsed)
      await recordUse('generate')
      await db.insert('history', { type: 'ideas', input: niche, output: text })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const copyIdea = async (idea, idx) => {
    const text = `${idea.title}\n\nHook: ${idea.hook}\n\n${idea.tags}`
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
        title="Emy's Magic — Ideas"
        subtitle={`Fresh content ideas for ${niche}`}
        right={<ProBadge onUpgrade={() => setShowPaywall(true)} />}
      />

      <div className="space-y-3 pb-4">
        <NicheBar />

        <div className="px-4">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-display text-sm font-bold text-white btn-magic transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Generating...</>
            ) : ideas.length > 0 ? (
              <><RefreshCw size={16} /> More Ideas</>
            ) : (
              <><Sparkles size={16} /> Generate Ideas</>
            )}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="px-4 space-y-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="content-card p-4">
                <div className="h-4 w-3/4 rounded animate-shimmer mb-2" style={{ animationDelay: `${i * 0.15}s` }} />
                <div className="h-3 w-full rounded animate-shimmer" style={{ animationDelay: `${i * 0.25}s` }} />
              </div>
            ))}
          </div>
        )}

        {/* Ideas list */}
        {!loading && ideas.length > 0 && (
          <div className="px-4 space-y-2.5">
            {ideas.map((idea, i) => (
              <div
                key={i}
                className="content-card p-4 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="font-display text-[10px] font-bold mt-1 shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-white"
                    style={{ background: 'rgb(140,40,255)' }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-sm font-semibold leading-snug">{idea.title}</p>
                    <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">{idea.hook}</p>
                    {idea.tags && (
                      <p className="text-[rgb(140,40,255)] text-[10px] mt-2 font-medium">{idea.tags}</p>
                    )}
                  </div>
                  <button
                    onClick={() => copyIdea(idea, i)}
                    className="p-2 rounded-lg shrink-0 transition-all active:scale-90"
                    style={{ background: 'rgba(140,40,255,0.06)' }}
                  >
                    {copiedIdx === i ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPaywall && <Paywall onClose={() => setShowPaywall(false)} />}
    </div>
  )
}

function parseIdeas(text) {
  const ideas = []
  const blocks = text.split(/(?=\d+[\.\)]\s)/)
  for (const block of blocks) {
    const titleMatch = block.match(/TITLE:\s*(.+)/i)
    const hookMatch = block.match(/HOOK:\s*(.+)/i)
    const tagsMatch = block.match(/TAGS:\s*(.+)/i)
    if (titleMatch) {
      ideas.push({
        title: titleMatch[1].trim(),
        hook: hookMatch ? hookMatch[1].trim() : '',
        tags: tagsMatch ? tagsMatch[1].trim() : '',
      })
    }
  }
  if (ideas.length === 0) {
    const lines = text.split('\n').filter(l => l.trim().length > 10)
    for (const line of lines.slice(0, 10)) {
      ideas.push({ title: line.replace(/^\d+[\.\)]\s*/, '').trim(), hook: '', tags: '' })
    }
  }
  return ideas
}
