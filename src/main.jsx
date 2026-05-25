import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PrintPage from './PrintPage.jsx'

// Simple client-side routing: jika URL mengandung ?page=print, tampilkan halaman print
const params = new URLSearchParams(window.location.search);
const page = params.get('page');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {page === 'print' ? <PrintPage /> : <App />}
  </StrictMode>,
)
