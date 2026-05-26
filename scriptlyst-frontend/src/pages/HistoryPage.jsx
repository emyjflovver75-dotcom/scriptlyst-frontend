import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../lib/db'
import PageHeader from '../components/PageHeader'
import { Lightbulb, FileText, Image, Trash2, ChevronRight, Inbox, Zap, Calendar, Repeat, Search, Hash, MessageSquare, Sparkles, ArrowLeft } from 'lucide-react'

const TYPE_META = {
  ideas: { icon: Lightbulb, label: 'Ideas', color: '#8c28ff' },
  script: { icon: FileText, label: 'Script', color: '#a855f7' },
  thumbnail: { icon: Image, label: 'Thumbnail', color: '#c864ff' },
  hooks: { icon: Zap, label: 'Hooks', color: '#f59e0b' },
  calendar: { icon: Calendar, label: 'Calendar', color: '#10b981' },
  repurpose: { icon: Repeat, label: 'Repurpose', color: '#3b82f6' },
  seo: { icon: Search, label: 'SEO', color: '#ef4444' },
  hashtags: { icon: Hash, label: 'Hashtags', color: '#06b6d4' },
  cta: { icon: MessageSquare, label: 'CTA', color: '#8b5cf6' },
  'title-test': { icon: Sparkles, label: 'Titles', color: '#ec4899' },
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    db.select('history', {}, { limit: 50, order: '-createdAt' })
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    await db.delete('history', id)
    setItems(prev => prev.filter(i => i.id !== id))
    if (expanded === id) setExpanded(null)
  }

  const filterOptions = ['all', ...Object.keys(TYPE_META)]
  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter)

  return (
    <div className="min-h-full">
      <PageHeader
        title="History"
        subtitle="Your generated content"
        left={<button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl active:scale-90"><ArrowLeft size={18} className="text-gray-500" /></button>}
      />

      <div className="px-4 space-y-3 pb-4">
        {/* Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {filterOptions.map(f => {
            const meta = TYPE_META[f]
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all whitespace-nowrap ${f === filter ? 'text-white shadow-md' : 'text-gray-500 bg-white border border-gray-100'}`}
                style={f === filter ? { background: meta?.color || 'rgb(140,40,255)', boxShadow: `0 2px 10px ${meta?.color || 'rgba(140,40,255,0.3)'}30` } : {}}
              >
                {f === 'all' ? 'All' : meta?.label || f}
              </button>
            )
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="content-card p-4">
                <div className="h-3 w-20 rounded animate-shimmer mb-2" />
                <div className="h-3 w-full rounded animate-shimmer" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(140,40,255,0.06)' }}>
              <Inbox size={24} className="text-[rgb(140,40,255)]" style={{ opacity: 0.4 }} />
            </div>
            <p className="text-gray-600 text-sm font-medium">Nothing here yet</p>
            <p className="text-gray-400 text-xs mt-1">Generate content to see it here</p>
          </div>
        )}

        {/* List */}
        {!loading && filtered.map((item) => {
          const meta = TYPE_META[item.type] || TYPE_META.script
          const IconComp = meta.icon
          const isExpanded = expanded === item.id
          const isImage = item.type === 'thumbnail'

          return (
            <div key={item.id} className="content-card overflow-hidden animate-fade-in">
              <button
                onClick={() => setExpanded(isExpanded ? null : item.id)}
                className="w-full p-3.5 flex items-center gap-3 text-left"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${meta.color}12` }}>
                  <IconComp size={14} style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-sm font-medium truncate">{item.input}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-medium" style={{ color: meta.color }}>{meta.label}</span>
                    {item.createdAt && (
                      <span className="text-[10px] text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={14} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>

              {isExpanded && (
                <div className="px-3.5 pb-3.5" style={{ borderTop: '1px solid rgba(140,40,255,0.06)' }}>
                  {isImage && item.output ? (
                    <div className="mt-3 rounded-lg overflow-hidden">
                      <img src={item.output} alt="Generated" className="w-full" onError={e => { e.target.style.display = 'none' }} />
                    </div>
                  ) : (
                    <p className="text-gray-600 text-xs leading-relaxed mt-3 whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {item.output}
                    </p>
                  )}
                  <div className="flex justify-end mt-3">
                    <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg active:scale-90" style={{ background: 'rgba(255,60,60,0.06)' }}>
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
