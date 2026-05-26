import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { getAuthHeaders } from './lib/_headers'
import { installHostBridge } from './lib/_host-bridge'

// Error capture is now in index.html (regular <script>) so it runs
// BEFORE ESM module linking — catching import/export errors that would
// otherwise kill the module graph before any in-module code executes.

// ── Sync theme-color meta with CSS --color-bg (fallback to --color-primary) ──
;(() => {
  function sync() {
    try {
      const style = getComputedStyle(document.documentElement)
      let raw = style.getPropertyValue('--color-bg').trim()
      if (!raw) raw = style.getPropertyValue('--color-primary').trim()
      if (raw) {
        const rgb = raw.split(/\s+/).map(Number)
        if (rgb.length === 3 && rgb.every(n => !isNaN(n))) {
          const hex = '#' + rgb.map(n => n.toString(16).padStart(2, '0')).join('')
          const meta = document.querySelector('meta[name="theme-color"]')
          if (meta) meta.setAttribute('content', hex)
        }
      }
    } catch { /* ignore */ }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(sync))
  } else {
    requestAnimationFrame(sync)
  }
})()

// ── iOS keyboard fix: track visualViewport so #root stays within visible area ──
;(() => {
  const vv = window.visualViewport
  const root = document.getElementById('root')
  if (!vv || !root) return

  const doc = document.documentElement

  const sync = () => {
    const kbH = Math.max(0, Math.round(window.innerHeight - vv.height))
    doc.style.setProperty('--keyboard-height', kbH + 'px')
    doc.style.setProperty('--visual-height', vv.height + 'px')

    if (vv.offsetTop === 0 && vv.height >= window.innerHeight - 1) {
      root.style.height = ''
    } else {
      root.style.height = vv.height + 'px'
    }
  }

  vv.addEventListener('resize', sync)
  vv.addEventListener('scroll', sync)

  const pin = () => {
    if (window.scrollY !== 0) window.scrollTo(0, 0)
    if (document.documentElement.scrollTop !== 0) document.documentElement.scrollTop = 0
    if (document.body.scrollTop !== 0) document.body.scrollTop = 0
  }
  window.addEventListener('scroll', pin, { passive: false })

  // Prevent iOS scroll-into-view flash on keyboard-triggering inputs.
  // Only intercept text-like types; leave file/checkbox/radio etc. alone.
  document.addEventListener('touchend', (e) => {
    const el = e.target
    const dominated = el.tagName === 'TEXTAREA' ||
      (el.tagName === 'INPUT' && /^(text|search|url|email|password|number|tel)$/.test(el.type))
    if (!dominated || document.activeElement === el) return
    e.preventDefault()
    el.focus({ preventScroll: true })
  }, false)

  sync()
})()

// Clear proxy retry backoff counter (set by the "Preview Loading..." error page)
try { sessionStorage.removeItem('_pr') } catch { /* iframe sandbox */ }

// Suppress the browser's native PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => e.preventDefault())

// Bridge share/clipboard requests to the host page when this app is embedded
// in Whacka Explore. Chromium increasingly blocks these APIs inside sandboxed
// cross-origin iframes even when the app is otherwise fully trusted.
installHostBridge()

// ── Record app session for analytics (skip preview/editor mode) ──
;(() => {
  const projectId = import.meta.env.VITE_PROJECT_ID
  if (!projectId || import.meta.env.VITE_PREVIEW_TOKEN) return
  const base = import.meta.env.VITE_API_BASE || ''

  const ua = navigator.userAgent || ''
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1)
  const isMobile =
    /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    ((navigator.maxTouchPoints || 0) > 1 && window.innerWidth < 1024)
  const isStandalone =
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true

  fetch(`${base}/api/app/${projectId}/session`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ isStandalone, isMobile, isIOS }),
  }).catch(() => {})
})()

// Register Service Worker (skip in iframe / preview mode)
try {
  if ('serviceWorker' in navigator && window.self === window.top) {
    window.addEventListener('load', () => {
      // Capture before registration — false on first visit, true on return visits
      let isFirstInstall = !navigator.serviceWorker.controller
      let refreshing = false

      // When a new SW takes over (skipWaiting + clients.claim in sw.js),
      // auto-reload so the user gets the latest published version.
      // Skip the first controllerchange which is the initial SW install.
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (isFirstInstall) {
          isFirstInstall = false
          return
        }
        if (refreshing) return
        refreshing = true
        window.location.reload()
      })

      navigator.serviceWorker.register('/sw.js').then(reg => {
        // When app returns from background, check for SW updates
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(() => {})
          }
        })
      }).catch(() => {})
    });
  }
} catch { /* cross-origin iframe, skip */ }

// ── "Made with Whacka" badge ──
const _WK_BADGE_FONT = `@font-face{font-family:'_wkb';src:url(data:font/woff2;base64,d09GMgABAAAAAAXUAA4AAAAAC8QAAAV+AAMAQQAAAAAAAAAAAAAAAAAAAAAAAAAAGhYbggocgSoGYABUEQgKizyJcgE2AiQDKAsWAAQgBYMyByAb6wlRVHCqCb44sI2tBTeAChUqSYgDChgEGv/C7XvnWgaPZ/28JFXKlbOie81KWbF7gJhrvwCi73d7D7mhRIKRSEkKSlcksQk//1UBCvC6AUGcqv/fmKt3U4lrZiVtaXUhL+918T9R4DC1Bgl/ndDJIhaahmqSiISYedm2YlZgFGbe30OBAFQAAKAQhAKdHGCFyUKNOUV6aM5mYz8cMXBv9E/rTlCHMNwPDSoCECljUOS/llWH4oUBhEhAkcD/bwh1JWiElFyEaDLX0DBdR2EwWEwJ+YFACj0JGv7/TchBTCi0JBIy16GxHEBYAxDoCqQ6CwB2LYhllBqmM6bGU6kB0lWzrbnXCEfk/G/CA2cAIAigw5C1dEy8Kg5Dmq9geaCx33jNBoXAQYdC8MQUSSVTHWR5SjfqqioAhXpVsiAi1gAgETInTtS/jzPiOng9g91/iYDkzYOyEvJ1ecB1H6KG4bdGQLCYkQaqzf4Mg9esVaeeJqQ+ge2w3WYbB7ApCNKkBQAsUBcDOvPLueUADA5Rk/biS86srzIw4UU2kXVRBoWykezfB3I4SswRRXahyaDXIjP4XdeUiy6AvQivvQLz2/y2DHSAYu2AGP+0eNRsltu/Bv0d5UfFZjLjKLvwOp6fscFhn7CXyRdhg01eZa7LKge/66L9oaeuImu+5cafFkU4oHxNmH+dXXhQZ2yyWxegtfmXRXDGm5sIf99U4OVQo2RGAhFFLhkdLXbiZ7zdWLmo344hzyBcKv8rUdTnzSAztlIhU0bipWsQ2AhEv/kwTDUR4UmKbrjCjZ8NnGyHA8BtF8Ff8avETmTNZn6KvhvAfxaKDrM+vxLS0/mPBnTzkAO0w7i3JrZ0cNnMuxD9XiP/kcoXxzN1jp9j+GZafft2UxV/UbI58cjaA2Oamr97uMrhWHOOn6vCU2bl8nj53OAVvp4tK5s593tTdnq7PXTS2Tvt3DWgmRWQ5R82ujys507y+NLSsF59dFRaQW3ZUNgCv2yflu98BvIDDFZOrgnoZfKr88vyl040ZNt+kJ1pF+5poymxHQ7WfqiyKjNd0ao/t/HznlmbHejea4qsLI1vG1nodW55TpJ/a5zbElssZnr7a8tTJwjpcbFJaZEB+a5WzTpZOF2iVj9R2Y23yw4wCv4NMQ129vH9cmZKMjreo34EYlNmSmRCnLM696m9TqkOzQjt+8aytNA1II6jULoxpXjiR4aQuJJUYfSN2cs9Yzl9WXdJsHt6uq+NYGlw9nOxboJDJHQFtvsdVbUn55UdyuFeqDG1i79+tzY9tbiez/cdPFnjZvmh0imtOHaiNu3odTe3x4r6WthT6ORJgzERSZkRsbG1mZ4J013ctn3OTJbP7GJyluyinnb262zt1h9W9mf7fODpAW+t65iijLbgYotWy7bp2QtlG9d+KyxkuvXjvwr0mHf26g29FAf4sHiceIEc2dzNyt5Mnw883V94+KlrlaW28+WZzrDc6YbGjuAdII3eDncD8mqq8hZmufqceec/oE6Hb+c20n/YAPqXVZv0q1xLfwHAgy1HpgPAm9N9A/499l+sdLLkLkCGAgAEnmr/Xwr9PAeI0HnYKADmMSEmnhkEl99ElxqxeZiOV0u/EluKL0IArN2k9pLQHY9GA2Rq0EivAHAQ0lSEzkEVReOiihbjvorB+U8l4RjX80txiUOmAYMmGNalQycjToQw4eK0X5+DBSj7Rrp2adel1QD3D2PSTXCxcfN0o4w6DRg2guNHSYwG3a4JQoXq0FWyalSLEDLoyyUDBtBX9xK0G9DPaERox5P75xymgqDDqF7NhkUKETb8p07UTzCOUSKbJLj24OVMcVkGwrSga4DjuM5G1kGCFrL2/5kiAAAAAA==) format('woff2');font-display:swap}`

function WhackaBadge() {
  const [visible, setVisible] = React.useState(() => {
    try { return localStorage.getItem('_whacka_badge_hidden') !== '1' } catch { return true }
  })

  React.useEffect(() => {
    if (!visible) return
    if (document.getElementById('_wkb_style')) return
    const s = document.createElement('style')
    s.id = '_wkb_style'
    s.textContent = _WK_BADGE_FONT
    document.head.appendChild(s)
  }, [visible])

  if (!visible) return null

  return (
    <a
      href="https://whacka.app"
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => { e.stopPropagation() }}
      style={{
        position: 'fixed', bottom: 16, right: 16, zIndex: 99998,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 14px 6px 12px',
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        color: '#fff', fontSize: 12, fontFamily: 'system-ui, -apple-system, sans-serif',
        borderRadius: 20, textDecoration: 'none',
        boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
      }}
    >
      <span style={{ opacity: 0.7 }}>Made with</span>
      <span style={{ fontFamily: "'_wkb', cursive", fontSize: 14, letterSpacing: 0.5 }}>Whacka</span>
      <span
        onClick={(e) => {
          e.stopPropagation(); e.preventDefault()
          setVisible(false)
          try { localStorage.setItem('_whacka_badge_hidden', '1') } catch {}
        }}
        style={{
          marginLeft: 2, width: 16, height: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
          fontSize: 10, cursor: 'pointer', lineHeight: 1,
        }}
      >✕</span>
    </a>
  )
}

class ErrorBoundary extends React.Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error) {
    if (window.__previewReport) {
      window.__previewReport(error.message, 'react-error-boundary')
    }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui', color: '#ef4444', background: '#fef2f2', minHeight: '100dvh' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#991b1b', background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #fecaca' }}>
            {this.state.error.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 16, padding: '8px 16px', fontSize: 14, borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer' }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <WhackaBadge />
    </ErrorBoundary>
  </React.StrictMode>,
)
