import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import { PatientProvider } from './context/PatientContext'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <PatientProvider>
        <App />
      </PatientProvider>
    </HelmetProvider>
  </StrictMode>
)