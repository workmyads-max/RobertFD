import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

function isAdmin() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const val = localStorage.getItem(localStorage.key(i)) || ''
      if (val.includes('"role":"admin"')) return true
    }
  } catch (e) {}
  return false
}

document.addEventListener('contextmenu', function(e) {
  if (isAdmin()) return
  e.preventDefault()
})

document.addEventListener('keydown', function(e) {
  if (isAdmin()) return
  const key = (e.key || '').toUpperCase()
  if (key === 'F12') { e.preventDefault(); return }
  if (e.ctrlKey && e.shiftKey && (key === 'I' || key === 'J' || key === 'C')) { e.preventDefault(); return }
  if (e.ctrlKey && !e.shiftKey && (key === 'U' || key === 'S')) { e.preventDefault(); return }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)