import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import {
  Zap, Calendar, Repeat, Search, Hash, MessageSquare, Sparkles,
  Clock, ChevronRight, Image, FileText, Lightbulb
} from 'lucide-react'

const TOOLS = [
  { icon: Lightbulb, label: 'Content Ideas', desc: 'Generate 10 video ideas for your niche', path: '/ideas', color: '#8c28ff' },
  { icon: FileText, label: 'Script Writer', desc: 'Full scripts, shorts, intros & tutorials', path: '/scripts', color: '#a855f7' },
  { icon: Image, label: 'Visual Creator', desc: 'Thumbnails, banners, social graphics', path: '/visuals', color: '#c864ff' },
  { icon: Zap, label: 'Viral Hook Generator', desc: 'First 3 seconds that stop the scroll', path: '/hooks', color: '#f59e0b' },
  { icon: Calendar, label: 'Content Calendar', desc: 'Plan 30 days of content at once', path: '/calendar', color: '#10b981' },
  { icon: Repeat, label: 'Content Repurposer', desc: 'YouTube → Twitter → LinkedIn → IG → TikTok', path: '/repurpose', color: '#3b82f6' },
  { icon: Search, label: 'SEO Optimizer', desc: 'Titles & descriptions optimized for search', path: '/seo', color: '#ef4444' },
  { icon: Hash, label: 'Hashtag Generator', desc: 'Platform-specific hashtags', path: '/hashtags', color: '#06b6d4' },
  { icon: MessageSquare, label: 'CTA Generator', desc: 'Calls-to-action that convert', path: '/cta', color: '#8b5cf6' },
  { icon: Sparkles, label: 'A/B Title Tester', desc: 'Generate 5 title variations to test', path: '/title-tester', color: '#ec4899' },
  { icon: Clock, label: 'History', desc: 'All your generated content', path: '/history', color: '#6b7280' },
]

export default function ToolsPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-full">
      <PageHeader title="All Tools" subtitle="Your complete content toolkit" />

      <div className="px-4 space-y-2 pb-4">
        {TOOLS.map((tool, i) => (
          <button
            key={tool.path}
            onClick={() => navigate(tool.path)}
            className="w-full tool-card p-4 flex items-center gap-3 text-left animate-fade-in-up"
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${tool.color}12` }}>
              <tool.icon size={20} style={{ color: tool.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 font-semibold">{tool.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{tool.desc}</p>
            </div>
            <ChevronRight size={14} className="text-gray-300 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}
