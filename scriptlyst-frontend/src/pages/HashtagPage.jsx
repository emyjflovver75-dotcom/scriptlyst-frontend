import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ai } from '../lib/ai'
import { db } from '../lib/db'
import { useNiche } from '../hooks/useNiche'
import { usePro } from '../hooks/usePro'
import PageHeader, { ProBadge } from '../components/PageHeader'
import NicheBar from '../components/NicheBar'
import Paywall from '../components/Paywall'
import { ArrowLeft, Hash, Copy, Check, Loader2, Sparkles } from 'lucide-react'

const PLATFORMS_LIST = [
  { id: 'youtube', label: 'YouTube', emoji: '📺' },
  { id: 'instagram', label: 'Instagram', emoji: '📸' },
  { id: 'tiktok', label: 'TikTok', emoji: '🎵' },
  { id: 'twitter', label: '𝕏 / Twitter', emoji: '🐦' },
  { id: 'linkedin', label: 'LinkedIn', emoji: '💼' },
]

export default function HashtagPage() {
  const navigate = useNavigate()
  const { niche } = useNiche()
  const { checkCanUse, recordUse } = usePro()
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState('youtube')
  const [loading, setLoading] = useState(false)
  const [hashtags, setHashtags] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)

  const handleGenerate = async () => {
    const { allowed } = checkCanUse('generate')
    if (!allowed) { setShowPaywall(true); return }

    setLoading(true)
    setHashtags(null)
    try {
      const platLabel = PLATFORMS_LIST.find(p => p.id === platform)?.label || platform
      const topicLine = topic.trim() ? `about "${topic}"` : `in the ${niche} niche`
      const prompt = `You are a social media hashtag strategist.

Generate a hashtag strategy for ${platLabel} content ${topicLine} in the "${niche}" niche.

Provide exactly this format:

HIGH VOLUME (5 hashtags):
[5 popular, broad hashtags with large reach]

MEDIUM VOLUME (10 hashtags):
[10 moderately popular hashtags for good discoverability]

NICHE SPECIFIC (5 hashtags):
[5 niche-targeted hashtags with lower competition]

TRENDING (3 hashtags):
[3 currently trending or seasonal hashtags that fit]

COPY-PASTE SET:
[All hashtags in one block, ready to copy and paste]

Each hashtag should start with # and be relevant to ${platLabel}'s algorithm and culture.`

      const { text } = await ai.run(prompt)
      setHashtags(text)
      await recordUse('generate')
      await db.insert('history', { type: 'hashtags', input: `${platLabel} hashtags for ${topic || niche}`, output: text })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const copyAll = async () => {
    if (!hashtags) return
    const copyPaste = hashtags.match(/COPY-PASTE SET:?\s*\n([\s\S]*?)$/i)?.[1]?.trim() || hashtags
    try { await navigator.clipboard.writeText(copyPaste) } catch {
      const ta = document.createElement('textarea')
      ta.value = copyPaste; document.body.appendChild(ta)
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-full">
      <PageHeader
        title="Hashtag Generator"
        subtitle="Platform-optimized hashtags"
        left={<button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl active:scale-90"><ArrowLeft size={18} className="text-gray-500" /></button>}
        right={<ProBadge onUpgrade={() => setShowPaywall(true)} />}
      />

      <div className="space-y-3 pb-4">
        <NicheBar />

        <div className="px-4 space-y-3">
          {/* Platform selector */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {PLATFORMS_LIST.map(p => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={`px-3 py-2 rounded-xl text-[11px] font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${p.id === platform ? 'text-white shadow-md' : 'text-gray-500 bg-white border border-gray-100'}`}
                style={p.id === platform ? { background: 'rgb(6,182,212)', boxShadow: '0 2px 10px rgba(6,182,212,0.3)' } : {}}
              >
                <span>{p.emoji}</span> {p.label}
              </button>
            ))}
          </div>

          {/* Topic */}
          <div className="content-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Hash size={14} className="text-cyan-500" />
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Topic (optional)</span>
            </div>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder={`e.g. "Morning workout routine"...`}
              className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm outline-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-display text-sm font-bold text-white btn-magic transition-all flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Generating...</> : <><Sparkles size={16} /> Generate Hashtags</>}
          </button>

          {loading && (
            <div className="content-card p-4 space-y-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-4 rounded animate-shimmer" style={{ width: `${90 - i * 10}%`, animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          )}

          {!loading && hashtags && (
            <div className="content-card p-4 animate-fade-in-up">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-xs font-bold text-cyan-500 uppercase tracking-wider">Your Hashtags</h3>
                <button onClick={copyAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium active:scale-95" style={{ background: 'rgba(6,182,212,0.08)', color: '#06b6d4' }}>
                  {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy All</>}
                </button>
              </div>
              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{hashtags}</p>
            </div>
          )}
        </div>
      </div>

      {showPaywall && <Paywall onClose={() => setShowPaywall(false)} />}
    </div>
  )
}
