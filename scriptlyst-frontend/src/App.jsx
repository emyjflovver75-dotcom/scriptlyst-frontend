import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Home, Lightbulb, FileText, Image, Wrench } from 'lucide-react'
import { ProProvider } from './hooks/usePro'
import { NicheProvider, useNiche } from './hooks/useNiche'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import IdeasPage from './pages/IdeasPage'
import ScriptPage from './pages/ScriptPage'
import ThumbnailsPage from './pages/ThumbnailsPage'
import ToolsPage from './pages/ToolsPage'
import HistoryPage from './pages/HistoryPage'
import AdminPage from './pages/AdminPage'
import HooksPage from './pages/HooksPage'
import CalendarPage from './pages/CalendarPage'
import RepurposePage from './pages/RepurposePage'
import SEOPage from './pages/SEOPage'
import CTAPage from './pages/CTAPage'
import HashtagPage from './pages/HashtagPage'
import TitleTesterPage from './pages/TitleTesterPage'

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/ideas', icon: Lightbulb, label: 'Ideas' },
  { to: '/scripts', icon: FileText, label: 'Scripts' },
  { to: '/visuals', icon: Image, label: 'Visuals' },
  { to: '/tools', icon: Wrench, label: 'Tools' },
]

function TabBar() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]" style={{ background: '#ffffff', borderTop: '1px solid rgba(140,40,255,0.1)', boxShadow: '0 -2px 16px rgba(140,40,255,0.04)' }}>
      <div className="flex items-center justify-around py-2">
        {tabs.map(({ to, icon: Icon, label }) => {
          const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 min-w-[48px] transition-all ${active ? 'tab-active' : 'text-gray-400'}`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

function AppContent() {
  const { hasNiche } = useNiche()

  if (!hasNiche) {
    return (
      <HashRouter>
        <div className="h-full bg-grid-dark">
          <HomePage />
        </div>
      </HashRouter>
    )
  }

  return (
    <HashRouter>
      <div className="h-full bg-inner flex flex-col">
        <div className="flex-1 overflow-y-auto pb-[calc(68px+env(safe-area-inset-bottom,0px))]">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/ideas" element={<IdeasPage />} />
            <Route path="/scripts" element={<ScriptPage />} />
            <Route path="/visuals" element={<ThumbnailsPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/hooks" element={<HooksPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/repurpose" element={<RepurposePage />} />
            <Route path="/seo" element={<SEOPage />} />
            <Route path="/cta" element={<CTAPage />} />
            <Route path="/hashtags" element={<HashtagPage />} />
            <Route path="/title-tester" element={<TitleTesterPage />} />
          </Routes>
          <Footer />
        </div>
        <TabBar />
      </div>
    </HashRouter>
  )
}

export default function App() {
  return (
    <ProProvider>
      <NicheProvider>
        <AppContent />
      </NicheProvider>
    </ProProvider>
  )
}
