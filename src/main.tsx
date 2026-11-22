import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './app/App'
import { ThemeProvider } from './components/ThemeProvider'
import { AuthProvider } from './auth/AuthProvider'
import './styles/tokens.css'
import './styles/global.css'
import './styles/sections.css'
import './styles/responsive.css'
import './styles/theme-overrides.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider><BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter></ThemeProvider>
  </React.StrictMode>,
)

import './styles/workspace.css'
