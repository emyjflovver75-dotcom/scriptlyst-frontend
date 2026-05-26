import { useState } from 'react'
import { useNiche } from '../hooks/useNiche'
import { Target, Pencil, Check } from 'lucide-react'

export default function NicheBar() {
  const { niche, setNiche } = useNiche()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(niche)

  const save = () => {
    if (draft.trim()) {
      setNiche(draft.trim())
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <div className="mx-4 content-card px-3 py-2 flex items-center gap-2">
        <Target size={14} className="text-[rgb(140,40,255)] shrink-0" />
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          autoFocus
          placeholder="e.g. Fitness, Tech Reviews, Cooking..."
          className="flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400"
        />
        <button onClick={save} className="p-1.5 rounded-lg active:scale-90" style={{ background: 'rgba(140,40,255,0.1)' }}>
          <Check size={14} className="text-[rgb(140,40,255)]" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => { setDraft(niche); setEditing(true) }}
      className="mx-4 content-card px-3 py-2.5 flex items-center gap-2 w-[calc(100%-2rem)] text-left active:scale-[0.98] transition-transform"
    >
      <Target size={14} className="text-[rgb(140,40,255)] shrink-0" />
      <span className="text-sm text-gray-800 font-medium flex-1 truncate">{niche}</span>
      <Pencil size={12} className="text-gray-400 shrink-0" />
    </button>
  )
}
