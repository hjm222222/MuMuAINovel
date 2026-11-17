import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'antd/dist/reset.css'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './theme/ThemeProvider'
import { BrandingProvider } from './config/BrandingProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrandingProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrandingProvider>
  </StrictMode>,
)
