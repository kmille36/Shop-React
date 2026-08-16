import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initDb } from './utils/db'
import './index.css'

// Load the in-RAM server database into localStorage before first render,
// then start the change watcher. Falls back to localStorage-only if the
// server is not running (max wait ~2.5s so the app always renders).
initDb().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})

// PWA: register service worker (production only).
// Re-check for an updated SW a few seconds after load so users always get
// the latest bundle (prevents stale-cache bugs like missing UI fixes).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      setTimeout(() => reg.update().catch(() => {}), 4000)
    }).catch(() => {})
  })
}
