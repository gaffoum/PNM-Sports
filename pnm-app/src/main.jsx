import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { supabaseConfigured } from './lib/supabaseClient'
import { BRAND } from './config/brand'

document.title = `${BRAND.name} — Espace agents`
document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BRAND.themeColor)

function ConfigError() {
  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24,
      background: '#04101f', color: '#e6f2fb', fontFamily: 'system-ui, sans-serif', textAlign: 'center',
    }}>
      <div style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: 22, marginBottom: 12, color: '#7ce3ff' }}>Configuration Supabase manquante</h1>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: '#9fc3d8' }}>
          Les variables <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code> ne sont pas
          définies pour cet environnement de déploiement (probablement <b>Preview</b> sur Vercel).
          Ajoute-les dans <b>Vercel → Settings → Environment Variables</b> (cocher Production <b>et</b> Preview),
          puis redéploie.
        </p>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {supabaseConfigured ? <App /> : <ConfigError />}
  </StrictMode>,
)
