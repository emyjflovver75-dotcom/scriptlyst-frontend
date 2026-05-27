import { useState } from 'react'
import { ai } from '../lib/ai'
import { db } from '../lib/db'
import { useNiche } from '../hooks/useNiche'
import { usePro } from '../hooks/usePro'
import PageHeader, { ProBadge } from '../components/PageHeader'
import NicheBar from '../components/NicheBar'
import Paywall from '../components/Paywall'
import { Copy, Check, Loader2, Sparkles, ChevronDown, Video, Clock, Users } from 'lucide-react'

const FORMATS = ['Full Script', 'Short-form (60s)', 'Intro + Outline', 'Tutorial']
const TONES = ['Educational', 'Entertaining', 'Motivational', 'Professional', 'Casual', 'Dramatic']

export default function ScriptPage() {
  const { niche } = useNiche()
  const { checkCanUse, recordUse } = usePro()
  const [topic, setTopic] = useState('')
  const [format, setFormat] = useState(FORMATS[0])
  const [tone, setTone] = useState(TONES[0])
  const [showFormat, setShowFormat] = useState(false)
  const [showTone, setShowTone] = useState(false)
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
      const isShort = format === 'Short-form (60s)'
      const prompt = isShort
        ? `You are a viral short-form video scriptwriter for the "${niche}" niche.

Write a complete 60-second script for: ${topic}
Tone: ${tone}

Format your output as:
HOOK:
[3-second attention-grabbing opening]

SCRIPT:
[Full script with timestamps. Keep it punchy, fast-paced, and optimized for TikTok/Shorts/Reels. Include visual cues in brackets.]

CAPTION:
[A social media caption with emojis and 5 hashtags]

CTA:
[Call to action for the end]`
        : `You are a professional YouTube scriptwriter for the "${niche}" niche.

Write a complete ${format.toLowerCase()} for: ${topic}
Tone: ${tone}

Format your output as:
TITLE:
[SEO-optimized clickable title]

HOOK:
[First 5 seconds — attention grabber]

SCRIPT:
[Complete script with natural transitions, engagement cues like "comment below" or "hit subscribe", and a strong close. Use conversational language.]

DESCRIPTION:
[YouTube description with keywords, 2-3 sentences]

TAGS:
[10 relevant tags, comma-separated]

HASHTAGS:
[5 hashtags for YouTube]`

      const { text } = await ai.run(prompt)
      const parsed = parseSections(text)
      setSections(parsed)
      await recordUse('generate')
      await db.insert('history', { type: 'script', input: topic, output: text, settings: { format, tone, niche } })
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
        title="Scriptlyst — Scripts"
        subtitle="Full scripts, hooks & descriptions"
        right={<ProBadge onUpgrade={() => setShowPaywall(true)} />}
      />

      <div className="space-y-3 pb-4">
        <NicheBar />

        <div className="px-4 space-y-3">
          {/* Topic */}
          <div className="content-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Video size={14} className="text-[rgb(140,40,255)]" />
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Video Topic</span>
            </div>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder={`e.g. "5 tips for beginners in ${niche}"...`}
              rows={2}
              className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm resize-none outline-none"
            />
          </div>

          {/* Settings */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <button
                onClick={() => { setShowFormat(!showFormat); setShowTone(false) }}
                className="w-full content-card px-3 py-2.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-[rgb(140,40,255)]" />
                  <span className="text-[11px] text-gray-700 truncate">{format}</span>
                </div>
                <ChevronDown size={10} className="text-gray-400" />
              </button>
              {showFormat && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl overflow-hidden z-20 shadow-lg border border-gray-100">
                  {FORMATS.map(f => (
                    <button key={f} onClick={() => { setFormat(f); setShowFormat(false) }}
                      className={`w-full px-3 py-2.5 text-[11px] text-left ${f === format ? 'text-[rgb(140,40,255)] bg-[rgba(140,40,255,0.05)] font-medium' : 'text-gray-700 active:bg-gray-50'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 relative">
              <button
                onClick={() => { setShowTone(!showTone); setShowFormat(false) }}
                className="w-full content-card px-3 py-2.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-1.5">
                  <Users size={12} className="text-[rgb(140,40,255)]" />
                  <span className="text-[11px] text-gray-700 truncate">{tone}</span>
                </div>
                <ChevronDown size={10} className="text-gray-400" />
              </button>
              {showTone && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl overflow-hidden z-20 shadow-lg border border-gray-100">
                  {TONES.map(t => (
                    <button key={t} onClick={() => { setTone(t); setShowTone(false) }}
                      className={`w-full px-3 py-2.5 text-[11px] text-left ${t === tone ? 'text-[rgb(140,40,255)] bg-[rgba(140,40,255,0.05)] font-medium' : 'text-gray-700 active:bg-gray-50'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="w-full py-3.5 rounded-xl font-display text-sm font-bold text-white btn-magic transition-all flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Writing...</> : <><Sparkles size={16} /> Generate Script</>}
          </button>

          {/* Loading */}
          {loading && (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="content-card p-4">
                  <div className="h-4 w-24 rounded animate-shimmer mb-2" />
                  <div className="h-3 w-full rounded animate-shimmer" style={{ animationDelay: `${i * 0.2}s` }} />
                  <div className="h-3 w-2/3 rounded animate-shimmer mt-1.5" style={{ animationDelay: `${i * 0.3}s` }} />
                </div>
              ))}
            </div>
          )}

          {/* Sections */}
          {!loading && sections.length > 0 && (
            <div className="space-y-2.5">
              {sections.map((s, i) => (
                <div key={i} className="content-card p-4 animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display text-[10px] font-bold text-[rgb(140,40,255)] uppercase tracking-wider">{s.title}</h3>
                    <button onClick={() => copySection(s.content, i)} className="p-2 rounded-lg active:scale-90" style={{ background: 'rgba(140,40,255,0.06)' }}>
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

function parseSections(text) {
  const sections = []
  const keys = ['TITLE', 'HOOK', 'SCRIPT', 'DESCRIPTION', 'CAPTION', 'TAGS', 'HASHTAGS', 'CTA']
  for (let i = 0; i < keys.length; i++) {
    const regex = new RegExp(`${keys[i]}[:\\s]*(?:\\([^)]*\\))?[:\\s]*\\n?`, 'i')
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
    sections.push({ title: 'Script', content: text.trim() })
  }
  return sections
}
