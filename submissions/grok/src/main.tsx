import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'
import { AppStateProvider } from './context/AppStateContext'
import { ErrorBoundary } from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppStateProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
      <Toaster position="top-center" richColors closeButton />
    </AppStateProvider>
  </StrictMode>,
)
