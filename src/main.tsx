import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource/barlow-condensed/500.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'
import './styles/index.css'
import App from './App'
import { VaultProvider } from './context/VaultProvider'
import { ToastProvider } from './components/ui/Toast'

const root = document.getElementById('root')

if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <ToastProvider>
      <VaultProvider>
        <App />
      </VaultProvider>
    </ToastProvider>
  </StrictMode>,
)
