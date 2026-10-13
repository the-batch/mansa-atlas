
import { lazy, Suspense, useState } from 'react'
import './App.css'
import logo from './assets/LOGO-01-02.svg'
import { QcmZustandApp } from './components/QcmZustandApp'
import { archetypeProfiles } from './data/questions'
import { type Archetype } from './types/qcm'

const AtlasGlobe = lazy(() =>
  import('./components/AtlasGlobe').then(({ AtlasGlobe: Component }) => ({ default: Component }))
)

function App() {
  const [hasStarted, setHasStarted] = useState(false)
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype>('createur')

  return (
    <main className="app-shell">
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
        {hasStarted ? (
          <QcmZustandApp />
        ) : (
          <section className="welcome-panel" aria-labelledby="welcome-title">
            <div className="welcome-copy">
              <p className="eyebrow"><span className="eyebrow-line" /> L’ATLAS · MANSA CAPITAL</p>
              <h1 id="welcome-title">
                Votre patrimoine a une histoire.<br />
                <span>Découvrons sa trajectoire.</span>
              </h1>
              <p className="welcome-description">
                En quelques minutes, faites le point sur votre situation, vos projets et
                votre manière de construire l’avenir. Il n’y a pas de bonne ou de mauvaise réponse.
              </p>
              <div className="welcome-details">
                <span><i className="detail-dot detail-dot-orange" /> 8 étapes rapides</span>
                <span><i className="detail-dot detail-dot-blue" /> Un profil qui vous ressemble</span>
              </div>
              <button className="start-button" onClick={() => setHasStarted(true)}>
                <span>Commencer mon diagnostic</span>
                <span className="button-arrow" aria-hidden="true">↗</span>
              </button>
              <p className="welcome-note">PRENEZ LE TEMPS DE RÉPONDRE À VOTRE RYTHME</p>
            </div>
            <div className="welcome-art">
              <Suspense fallback={<div className="atlas-globe-loading" aria-label="Chargement du globe 3D" />}>
                <AtlasGlobe
                  selectedArchetype={selectedArchetype}
                  onSelectArchetype={setSelectedArchetype}
                />
              </Suspense>
              <div className="atlas-preview" aria-live="polite">
                <p className="atlas-preview-title">
                  {archetypeProfiles[selectedArchetype].name}
                </p>
                <p className="atlas-preview-copy">
                  {archetypeProfiles[selectedArchetype].description}
                </p>
              </div>
              <span className="art-caption">5 ARCHÉTYPES · UNE TRAJECTOIRE PATRIMONIALE</span>
            </div>
          </section>
        )}
      </div>
      <footer className="page-footer">
        <span>VOTRE PATRIMOINE, VOTRE TRAJECTOIRE.</span>
        <span>UN PARCOURS, UNE QUESTION À LA FOIS.</span>
      </footer>
    </main>
  )
}

export default App
