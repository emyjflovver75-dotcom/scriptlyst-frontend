import { useState } from 'react'
import { ai } from '../lib/ai'
import { db } from '../lib/db'
import { useNiche } from '../hooks/useNiche'
import { usePro } from '../hooks/usePro'
import PageHeader, { ProBadge } from '../components/PageHeader'
import NicheBar from '../components/NicheBar'
import Paywall from '../components/Paywall'
import { Image, Download, Loader2, Sparkles, Palette } from 'lucide-react'

const STYLES = [
  { id: 'youtube', label: 'YouTube Thumbnail', emoji: '🎬' },
  { id: 'shorts', label: 'Shorts / Reels Cover', emoji: '📱' },
  { id: 'banner', label: 'Channel Banner', emoji: '🖼️' },
  { id: 'social', label: 'Social Post', emoji: '📣' },
]

export default function ThumbnailsPage() {
  const { niche } = useNiche()
  const { checkCanUse, recordUse } = usePro()
  const [concept, setConcept] = useState('')
  const [style, setStyle] = useState('youtube')
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)
  const [error, setError] = useState(null)
  const [showPaywall, setShowPaywall] = useState(false)

  const handleGenerate = async () => {
    if (!concept.trim()) return
    const { allowed } = checkCanUse('thumbnail')
    if (!allowed) { setShowPaywall(true); return }

    setLoading(true)
    setImageUrl(null)
    setError(null)
    try {
      const styleGuide = {
        youtube: `Bold YouTube thumbnail for a ${niche} channel: dramatic lighting, vivid colors, high contrast, large expressive text overlay showing key concept, professional composition, designed to maximize click-through rate. 16:9 format.`,
        shorts: `Vertical cover image for YouTube Shorts / Instagram Reels in the ${niche} niche: eye-catching, trendy design, bold typography, mobile-optimized portrait layout, engaging and thumb-stopping. 9:16 format.`,
        banner: `Professional YouTube channel banner for a ${niche} creator: wide panoramic design, clean branding, modern aesthetic with subtle textures, text space on the right for channel name. 16:9 wide format.`,
        social: `Social media post graphic for ${niche} content: clean, modern, Instagram-ready aesthetic, harmonious colors, minimal bold text, shareable design. Square format.`,
      }
      const aspectMap = { youtube: '16:9', shorts: '9:16', banner: '16:9', social: '1:1' }

      const result = await ai.run(
        `Create: ${concept}. ${styleGuide[style]}`,
        { image: true, aspectRatio: aspectMap[style] || '16:9' }
      )

      if (result.images?.[0]) {
        setImageUrl(result.images[0])
        await recordUse('thumbnail')
        await db.insert('history', { type: 'thumbnail', input: concept, output: result.images[0], settings: { style, niche } })
      }
    } catch (e) {
      console.error(e)
      setError('Failed to generate. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!imageUrl) return
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `thumbnail-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch { window.open(imageUrl, '_blank') }
  }

  return (
    <div className="min-h-full">
      <PageHeader
        title="Scriptlyst — Visuals"
        subtitle="AI-generated visuals for your channel"
        right={<ProBadge onUpgrade={() => setShowPaywall(true)} />}
      />

      <div className="space-y-3 pb-4">
        <NicheBar />

        <div className="px-4 space-y-3">
          {/* Style picker */}
          <div className="grid grid-cols-2 gap-2">
            {STYLES.map(s => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={`p-3 rounded-xl text-left transition-all active:scale-[0.97] ${s.id === style ? 'glow-purple' : ''}`}
                style={{
                  background: s.id === style ? 'rgba(140,40,255,0.08)' : '#ffffff',
                  border: s.id === style ? '2px solid rgba(140,40,255,0.4)' : '1px solid rgba(0,0,0,0.06)',
                  boxShadow: s.id !== style ? '0 1px 3px rgba(0,0,0,0.04)' : undefined,
                }}
              >
                <span className="text-base">{s.emoji}</span>
                <p className={`text-[11px] mt-1 font-medium ${s.id === style ? 'text-[rgb(140,40,255)]' : 'text-gray-600'}`}>{s.label}</p>
              </button>
            ))}
          </div>

          {/* Concept */}
          <div className="content-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Palette size={14} className="text-[rgb(140,40,255)]" />
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Concept</span>
            </div>
            <textarea
              value={concept}
              onChange={e => setConcept(e.target.value)}
              placeholder={`Describe your thumbnail for ${niche}...`}
              rows={3}
              className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm resize-none outline-none"
            />
          </div>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={loading || !concept.trim()}
            className="w-full py-3.5 rounded-xl font-display text-sm font-bold text-white btn-magic transition-all flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Creating...</> : <><Sparkles size={16} /> Generate Visual</>}
          </button>

          {/* Loading */}
          {loading && (
            <div className="content-card p-6 flex flex-col items-center gap-3">
              <div className="w-full aspect-video rounded-lg animate-shimmer" />
              <p className="text-gray-400 text-xs animate-pulse">Generating your thumbnail...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="content-card p-4" style={{ borderColor: 'rgba(255,80,80,0.3)' }}>
              <p className="text-red-500 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Result */}
          {!loading && imageUrl && (
            <div className="content-card p-4 animate-fade-in-up">
              <div className="rounded-lg overflow-hidden mb-3">
                <img
                  src={imageUrl}
                  alt="Generated thumbnail"
                  className="w-full"
                  onError={e => { e.target.style.display = 'none'; setError('Image failed to load') }}
                />
              </div>
              <button
                onClick={handleDownload}
                className="w-full py-3 rounded-xl font-display text-xs font-bold text-white flex items-center justify-center gap-2 btn-magic transition-all active:scale-[0.97]"
              >
                <Download size={14} />
                Save Image
              </button>
            </div>
          )}
        </div>
      </div>

      {showPaywall && <Paywall onClose={() => setShowPaywall(false)} />}
    </div>
  )
}
