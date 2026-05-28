import { useState, useRef, useEffect } from 'react'
import { ai } from '../lib/ai'
import { generate, video as videoApi, getCurrentUser } from '../lib/api'
import { db } from '../lib/db'
import { useNiche } from '../hooks/useNiche'
import { usePro } from '../hooks/usePro'
import PageHeader, { ProBadge } from '../components/PageHeader'
import NicheBar from '../components/NicheBar'
import Paywall from '../components/Paywall'
import LoginModal from '../components/LoginModal'
import { auth } from '../lib/auth'
import { Image, Download, Loader2, Sparkles, Palette, Video, CheckCircle, XCircle, ExternalLink, LogIn } from 'lucide-react'

const STYLES = [
  { id: 'youtube', label: 'YouTube Thumbnail', emoji: '🎬' },
  { id: 'shorts', label: 'Shorts / Reels Cover', emoji: '📱' },
  { id: 'banner', label: 'Channel Banner', emoji: '🖼️' },
  { id: 'social', label: 'Social Post', emoji: '📣' },
]

export default function ThumbnailsPage() {
  const { niche } = useNiche()
  const { isPro, checkCanUse, recordUse, refresh: refreshPro } = usePro()
  const [mode, setMode] = useState('images')
  const [showPaywall, setShowPaywall] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [user, setUser] = useState(getCurrentUser())

  useEffect(() => {
    const unsub = auth.onAuthChange(u => setUser(u))
    return unsub
  }, [])

  // ── Images state ──
  const [concept, setConcept] = useState('')
  const [style, setStyle] = useState('youtube')
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)
  const [error, setError] = useState(null)

  // ── Video state ──
  const [videoScript, setVideoScript] = useState('')
  const [videoLoading, setVideoLoading] = useState(false)
  const [videoStatus, setVideoStatus] = useState(null) // 'processing' | 'completed' | 'failed'
  const [videoUrl, setVideoUrl] = useState(null)
  const [videoError, setVideoError] = useState(null)
  const pollRef = useRef(null)

  useEffect(() => () => clearInterval(pollRef.current), [])

  // ── Image generation ──
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

  // ── Video generation ──
  const handleGenerateVideo = async () => {
    if (!videoScript.trim()) return

    clearInterval(pollRef.current)
    setVideoLoading(true)
    setVideoStatus(null)
    setVideoUrl(null)
    setVideoError(null)

    try {
      const data = await generate.video({ script: videoScript })
      const vidId = data.heygen_video_id
      setVideoStatus('processing')

      pollRef.current = setInterval(async () => {
        try {
          const s = await videoApi.status(vidId)
          if (s.status === 'completed') {
            setVideoUrl(s.video_url)
            setVideoStatus('completed')
            setVideoLoading(false)
            clearInterval(pollRef.current)
          } else if (s.status === 'failed') {
            setVideoStatus('failed')
            setVideoError('Video generation failed. Please try again.')
            setVideoLoading(false)
            clearInterval(pollRef.current)
          }
        } catch { /* keep polling */ }
      }, 10000)
    } catch (e) {
      const msg = e.message || ''
      if (msg.toLowerCase().includes('authorization') || msg.toLowerCase().includes('token') || msg.includes('401')) {
        setShowLogin(true)
      } else if (msg.includes('Pro membership') || msg.includes('403')) {
        setShowPaywall(true)
      } else {
        setVideoError(msg || 'Failed to start video generation.')
      }
      setVideoLoading(false)
    }
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

        {/* Mode tabs */}
        <div className="flex mx-4 rounded-xl overflow-hidden border border-gray-100">
          {[
            { id: 'images', label: '🖼️ Images' },
            { id: 'video', label: '🎥 Video' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className="flex-1 py-2.5 text-sm font-display font-bold transition-all"
              style={mode === t.id
                ? { background: 'rgb(140,40,255)', color: 'white' }
                : { background: 'white', color: '#9ca3af' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── IMAGES TAB ── */}
        {mode === 'images' && (
          <div className="px-4 space-y-3">
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

            <button
              onClick={handleGenerate}
              disabled={loading || !concept.trim()}
              className="w-full py-3.5 rounded-xl font-display text-sm font-bold text-white btn-magic transition-all flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Creating...</> : <><Sparkles size={16} /> Generate Visual</>}
            </button>

            {loading && (
              <div className="content-card p-6 flex flex-col items-center gap-3">
                <div className="w-full aspect-video rounded-lg animate-shimmer" />
                <p className="text-gray-400 text-xs animate-pulse">Generating your thumbnail...</p>
              </div>
            )}

            {error && (
              <div className="content-card p-4" style={{ borderColor: 'rgba(255,80,80,0.3)' }}>
                <p className="text-red-500 text-sm text-center">{error}</p>
              </div>
            )}

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
        )}

        {/* ── VIDEO TAB ── */}
        {mode === 'video' && (
          <div className="px-4 space-y-3">
            {!user ? (
              <div className="content-card p-4 flex items-center gap-3">
                <LogIn size={18} className="text-gray-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">Sign in to generate videos</p>
                  <p className="text-xs text-gray-400 mt-0.5">You need to be signed in to use this feature</p>
                </div>
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white btn-magic shrink-0"
                >
                  Sign In
                </button>
              </div>
            ) : (
              <div className="px-1 py-1 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <p className="text-[10px] text-gray-400">Signed in as <span className="font-bold text-gray-600">{user.email?.split('@')[0]}</span></p>
              </div>
            )}

            <div className="content-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Video size={14} className="text-[rgb(140,40,255)]" />
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Your Script</span>
                <span className="ml-auto text-[10px] text-gray-400">{videoScript.length}/1500</span>
              </div>
              <textarea
                value={videoScript}
                onChange={e => setVideoScript(e.target.value.slice(0, 1500))}
                placeholder="Paste or type your script here. The AI avatar will speak it..."
                rows={6}
                className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm resize-none outline-none"
              />
            </div>

            <button
              onClick={handleGenerateVideo}
              disabled={videoLoading || !videoScript.trim()}
              className="w-full py-3.5 rounded-xl font-display text-sm font-bold text-white btn-magic transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {videoLoading
                ? <><Loader2 size={18} className="animate-spin" /> Generating video...</>
                : <><Sparkles size={16} /> Generate Video</>}
            </button>

            {videoLoading && videoStatus === 'processing' && (
              <div className="content-card p-5 text-center space-y-2">
                <Loader2 size={28} className="animate-spin text-[rgb(140,40,255)] mx-auto" />
                <p className="text-gray-700 font-display font-bold text-sm">Creating your video...</p>
                <p className="text-gray-400 text-xs">HeyGen is rendering your avatar. This takes 2–5 minutes. Stay on this page.</p>
              </div>
            )}

            {videoStatus === 'completed' && videoUrl && (
              <div className="content-card p-5 text-center space-y-3 animate-fade-in-up">
                <CheckCircle size={32} className="text-green-500 mx-auto" />
                <p className="text-gray-900 font-display font-bold text-sm">Your video is ready!</p>
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl font-display text-sm font-bold text-white btn-magic flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} /> Watch / Download Video
                </a>
              </div>
            )}

            {videoError && (
              <div className="content-card p-4 text-center" style={{ borderColor: 'rgba(255,80,80,0.3)' }}>
                <XCircle size={20} className="text-red-400 mx-auto mb-2" />
                <p className="text-red-500 text-sm">{videoError}</p>
              </div>
            )}

            <p className="text-center text-gray-400 text-[10px] px-2">
              Videos are generated by HeyGen AI · Default avatar & voice · 720p
            </p>
          </div>
        )}

      </div>

      {showPaywall && <Paywall onClose={() => setShowPaywall(false)} />}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={u => { setUser(u); setShowLogin(false) }}
        />
      )}
    </div>
  )
}
