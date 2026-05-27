import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

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
    </ErrorBoundary>
  </React.StrictMode>,
)
