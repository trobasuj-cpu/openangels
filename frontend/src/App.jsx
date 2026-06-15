import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Dashboard from './components/Dashboard'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Refund from './pages/Refund'
import GDPR from './pages/GDPR'
import Contact from './pages/Contact'
import IndustryInvestors from './pages/IndustryInvestors'

function App() {
  return (
    <HelmetProvider>
      <Router>
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 flex flex-col">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/investors/:industry" element={<IndustryInvestors />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund" element={<Refund />} />
            <Route path="/gdpr" element={<GDPR />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </div>
      </Router>
    </HelmetProvider>
  )
}

export default App
