import { useState } from 'react'
import './App.css'
import logo from './assets/LOGO-01-02.svg'
import { InteractiveGlobe } from './components/InteractiveGlobe'
import { ParticipantForm } from './components/ParticipantForm'
import { QcmZustandApp } from './components/QcmZustandApp'
import { type ParticipantDetails } from './types/participant'

function App() {
  const [hasStarted, setHasStarted] = useState(false)
  const [globeTexture, setGlobeTexture] = useState<HTMLImageElement | null>(null)
  const [participant, setParticipant] = useState<ParticipantDetails | null>(null)

  if (!hasStarted) {
    return (
      <main className="home-hero">
        <div className="home-artwork">
          <img
            className="home-hero-image"
            src="/Environnement.jpg"
            alt="Paysage de l’Atlas de Mansa Capital au coucher du soleil"
            fetchPriority="high"
          />
          <img
            alt=""
            aria-hidden="true"
            className="globe-texture-preload"
            fetchPriority="low"
            onLoad={(event) => setGlobeTexture(event.currentTarget)}
            src="/Globe.jpeg"
          />
          {globeTexture && <InteractiveGlobe textureImage={globeTexture} />}
        </div>
        <button className="start-button home-cta" onClick={() => setHasStarted(true)}>
          <span>Explorer mon Atlas</span>
          <span className="button-arrow" aria-hidden="true">→</span>
        </button>
      </main>
    )
  }

  return (
    <main className="app-shell has-quiz">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="L’Atlas, accueil">
          <img className="wordmark-logo" src={logo} alt="Mansa Capital" />
        </a>
        <div className="topbar-meta">
          <span className="status-dot" />
          <span>DIAGNOSTIC PATRIMONIAL</span>
          <span className="topbar-index">MANSA CAPITAL</span>
        </div>
      </header>
      <div id="top" className="page-content">
        {participant
          ? <QcmZustandApp participant={participant} />
          : <ParticipantForm onSubmit={setParticipant} />}
      </div>
      <footer className="page-footer">
        <span>MANSA CAPITAL <span className="footer-separator">/</span> L’ATLAS</span>
        <span>PRENDRE DE LA HAUTEUR POUR MIEUX AVANCER</span>
      </footer>
    </main>
  )
}

export default App
