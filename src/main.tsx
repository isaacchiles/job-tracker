/**
 * JobTracker — a local-first tracker for companies, opportunities, contacts, and meetings.
 * Created by Isaac Chiles <isaac.chiles@gmail.com>
 */
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <HashRouter>
      <App />
      <Toaster position="top-center" richColors closeButton />
    </HashRouter>
  </ErrorBoundary>
)
