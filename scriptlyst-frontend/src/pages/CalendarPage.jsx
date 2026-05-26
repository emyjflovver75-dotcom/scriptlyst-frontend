import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ai } from '../lib/ai'
import { db } from '../lib/db'
import { useNiche } from '../hooks/useNiche'
import { usePro } from '../hooks/usePro'
import PageHeader, { ProBadge } from '../components/PageHeader'
import NicheBar from '../components/NicheBar'
import Paywall from '../components/Paywall'
import { ArrowLeft, Calendar, Copy, Check, Loader2, Sparkles } from 'lucide-react'

export default function CalendarPage() {
  const navigate = useNavigate()
  const { niche } = useNiche()
  const { checkCanUse, recordUse } = usePro()
  const [days, setDays] = useState('7')
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState([])
  const [copied, setCopied] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)

  const handleGenerate = async () => {
    const { allowed } = checkCanUse('generate')
    if (!allowed) { setShowPaywall(true); return }

    setLoading(true)
    setPlan([])
    try {
      const prompt = `You are a content strategist for the "${niche}" niche.

Create a ${days}-day content calendar. For each day provide:
DAY [number]: [day name]
TYPE: [Long-form / Short-form / Both]
TITLE: [Video/post title]
HOOK: [Opening hook sentence]
PLATFORM: [Best platform for this content]
NOTES: [Brief production note]

Mix content types: tutorials, listicles, stories, behind-the-scenes, challenges, Q&A, trending takes.
Make it strategic — build on previous days, create series potential, vary formats for algorithm diversity.
Number each day 1 through ${days}.`

      const { text } = await ai.run(prompt)
      const parsed = parseCalendar(text)
      setPlan(parsed)
      await recordUse('generate')
      await db.insert('history', { type: 'calendar', input: `${days}-day calendar for ${niche}`, output: text })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const copyAll = async () => {
    const text = plan.map(d => `Day ${d.day}: ${d.title}\nType: ${d.type}\nHook: ${d.hook}\nPlatform: ${d.platform}\nNotes: ${d.notes}`).join('\n\n')
    try { await navigator.clipboard.writeText(text) } catch {
      const ta = document.createElement('textarea')
      ta.value = text; document.body.appendChild(ta)
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-full">
      <PageHeader
        title="Content Calendar"
        subtitle="Plan your content strategy"
        left={<button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl active:scale-90"><ArrowLeft size={18} className="text-gray-500" /></button>}
        right={<ProBadge onUpgrade={() => setShowPaywall(true)} />}
      />

      <div className="space-y-3 pb-4">
        <NicheBar />

        <div className="px-4 space-y-3">
          {/* Duration picker */}
          <div className="flex gap-2">
            {['7', '14', '30'].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-display font-bold transition-all ${d === days ? 'text-white shadow-md' : 'text-gray-500 bg-white border border-gray-100'}`}
                style={d === days ? { background: 'rgb(140,40,255)', boxShadow: '0 2px 10px rgba(140,40,255,0.3)' } : {}}
              >
                {d} Days
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-display text-sm font-bold text-white btn-magic transition-all flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Planning...</> : <><Sparkles size={16} /> Generate Calendar</>}
          </button>

          {loading && (
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="content-card p-4">
                  <div className="h-3 w-16 rounded animate-shimmer mb-2" />
                  <div className="h-4 w-3/4 rounded animate-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
                  <div className="h-3 w-full rounded animate-shimmer mt-2" style={{ animationDelay: `${i * 0.15}s` }} />
                </div>
              ))}
            </div>
          )}

          {!loading && plan.length > 0 && (
            <>
              <div className="flex justify-end">
                <button onClick={copyAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-500 bg-white border border-gray-100 active:scale-95">
                  {copied ? <><Check size={12} className="text-green-500" /> Copied!</> : <><Copy size={12} /> Copy All</>}
                </button>
              </div>
              <div className="space-y-2.5">
                {plan.map((item, i) => (
                  <div key={i} className="content-card p-4 animate-fade-in-up" style={{ animationDelay: `${i * 0.04}s` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'rgb(16,185,129)' }}>
                        {item.day}
                      </span>
                      <div className="flex-1">
                        <span className="text-[10px] text-gray-400 font-medium">{item.dayName}</span>
                      </div>
                      {item.type && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ background: item.type.includes('Short') ? 'rgba(59,130,246,0.1)' : 'rgba(140,40,255,0.1)', color: item.type.includes('Short') ? '#3b82f6' : '#8c28ff' }}>
                          {item.type}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 text-sm font-semibold leading-snug">{item.title}</p>
                    {item.hook && <p className="text-gray-500 text-xs mt-1.5 leading-relaxed italic">"{item.hook}"</p>}
                    <div className="flex items-center gap-3 mt-2">
                      {item.platform && <span className="text-[10px] text-gray-400">📍 {item.platform}</span>}
                      {item.notes && <span className="text-[10px] text-gray-400 flex-1 truncate">💡 {item.notes}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {showPaywall && <Paywall onClose={() => setShowPaywall(false)} />}
    </div>
  )
}

function parseCalendar(text) {
  const items = []
  const blocks = text.split(/(?=DAY\s*\d+)/i)
  for (const block of blocks) {
    const dayMatch = block.match(/DAY\s*(\d+)[:\s]*(.*)/i)
    const typeMatch = block.match(/TYPE:\s*(.+)/i)
    const titleMatch = block.match(/TITLE:\s*(.+)/i)
    const hookMatch = block.match(/HOOK:\s*(.+)/i)
    const platformMatch = block.match(/PLATFORM:\s*(.+)/i)
    const notesMatch = block.match(/NOTES?:\s*(.+)/i)
    if (dayMatch) {
      items.push({
        day: dayMatch[1],
        dayName: dayMatch[2]?.trim() || '',
        type: typeMatch?.[1]?.trim() || '',
        title: titleMatch?.[1]?.trim() || '',
        hook: hookMatch?.[1]?.trim() || '',
        platform: platformMatch?.[1]?.trim() || '',
        notes: notesMatch?.[1]?.trim() || '',
      })
    }
  }
  if (items.length === 0) {
    const lines = text.split('\n').filter(l => l.trim().length > 10)
    lines.slice(0, 7).forEach((l, i) => {
      items.push({ day: String(i + 1), dayName: '', type: '', title: l.replace(/^\d+[\.\)]\s*/, '').trim(), hook: '', platform: '', notes: '' })
    })
  }
  return items
}
