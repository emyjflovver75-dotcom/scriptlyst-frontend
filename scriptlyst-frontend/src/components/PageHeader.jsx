import { usePro } from '../hooks/usePro'
import { Crown, Zap } from 'lucide-react'

export default function PageHeader({ title, subtitle, left, right }) {
  return (
    <div className="pt-[env(safe-area-inset-top)] px-5 pb-3" style={{ background: 'linear-gradient(180deg, rgba(140,40,255,0.08) 0%, transparent 100%)' }}>
      <div className="pt-4 flex items-start justify-between gap-2">
        {left && <div className="shrink-0">{left}</div>}
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-lg font-bold text-gray-900 tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </div>
  )
}

export function ProBadge({ onUpgrade }) {
  const { isPro, checkCanUse, loading } = usePro()
  if (loading) return null

  const { remaining, limit } = checkCanUse('generate')

  if (isPro) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0" style={{ background: 'rgba(140,40,255,0.1)', border: '1px solid rgba(140,40,255,0.25)' }}>
        <Crown size={11} className="text-[rgb(140,40,255)]" />
        <span className="text-[10px] font-bold text-[rgb(140,40,255)] font-display">PRO</span>
      </div>
    )
  }

  return (
    <button
      onClick={onUpgrade}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0 transition-all active:scale-95"
      style={{ background: 'rgba(140,40,255,0.08)', border: '1px solid rgba(140,40,255,0.2)' }}
    >
      <Zap size={11} className="text-[rgb(140,40,255)]" />
      <span className="text-[10px] font-medium text-gray-600">
        {remaining}/{limit} free
      </span>
    </button>
  )
}
