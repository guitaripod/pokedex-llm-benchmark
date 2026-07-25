import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/index.css'
import { App } from './App'
import { applyTheme, useApp } from './lib/store'

applyTheme(useApp.getState().theme)
useApp.subscribe((state, previous) => {
  if (state.theme !== previous.theme) applyTheme(state.theme)
})
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (useApp.getState().theme === 'system') applyTheme('system')
})

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
