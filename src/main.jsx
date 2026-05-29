import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyBootSeoFromLocation } from './utils/seoBoot.js'
import './index.css'
import App from './App.jsx'

applyBootSeoFromLocation()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
