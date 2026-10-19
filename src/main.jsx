import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n/config.js'
import './index.css'
import App from './App.jsx'
import { notifyStaleBundleBootSuccess } from './shared/lib/staleBundleRecovery.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

notifyStaleBundleBootSuccess()
