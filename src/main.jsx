import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

document.addEventListener('contextmenu', function(e) {
  e.preventDefault()
})

document.addEventListener('keydown', function(e) {
  const key = (e.key || '').toUpperCase()
  if (key === 'F12') { e.preventDefault(); return }
  if (e.ctrlKey && e.shiftKey && (key === 'I' || key === 'J' || key === 'C')) { e.preventDefault(); return }
  if (e.ctrlKey && !e.shiftKey && (key === 'U' || key === 'S')) { e.preventDefault(); return }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)