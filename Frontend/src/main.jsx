import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { WebSocketProvider } from './services/websocket.jsx'
import Amistosos from './pages/Amistosos.jsx'
import TemporizadorDemo from './pages/TemporizadorDemo.jsx'
import SelectorAmistosoDemo from './pages/SelectorAmistosoDemo.jsx'

const demo = new URLSearchParams(window.location.search).get('demo')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WebSocketProvider>
      {demo === 'amistosos' ? <Amistosos /> : null}
      {demo === 'temporizador' ? <TemporizadorDemo /> : null}
      {demo === 'selector' ? <SelectorAmistosoDemo /> : null}
      {!demo ? <App /> : null}
    </WebSocketProvider>
  </StrictMode>,
)
