import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from 'framer-motion'
import Lenis from 'lenis'
import './App.css'
import lightLogo from './assets/LOGO-MANSA-CAPITAL.png'
import { InteractiveGlobe } from './components/InteractiveGlobe'
import { ParticipantForm } from './components/ParticipantForm'
import { QcmZustandApp } from './components/QcmZustandApp'
import { TermsDialog } from './components/TermsDialog'
import { termsVersion, type ParticipantDetails } from './types/participant'

function App() {
  const [hasStarted, setHasStarted] = useState(false)
  const [globeTexture, setGlobeTexture] = useState<HTMLImageElement | null>(null)
  const [participant, setParticipant] = useState<ParticipantDetails | null>(null)
  const [pendingParticipant, setPendingParticipant] = useState<ParticipantDetails | null>(null)
  const homeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let lenis: Lenis | undefined

    const syncScroll = () => {
      lenis?.destroy()
      lenis = reducedMotion.matches
        ? undefined
        : new Lenis({ autoRaf: true, lerp: 0.08, smoothWheel: true })
    }

    syncScroll()
    reducedMotion.addEventListener('change', syncScroll)
    return () => {
      reducedMotion.removeEventListener('change', syncScroll)
      lenis?.destroy()
    }
  }, [])

  useLayoutEffect(() => {
    if (
      hasStarted ||
      !homeRef.current ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return

    let cancelled = false
    let revertContext: (() => void) | undefined

    void import('gsap').then(({ default: gsap }) => {
      if (cancelled || !homeRef.current) return
      const context = gsap.context(() => {
        gsap.fromTo(
          ['.home-brand', '.home-kicker', '.home-artwork', '.home-caption', '.home-cta'],
          { autoAlpha: 0, y: 18 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.12,
            ease: 'power3.out',
            clearProps: 'all'
          }
        )
      }, homeRef)
      revertContext = () => context.revert()
    })

    return () => {
      cancelled = true
      revertContext?.()
    }
  }, [hasStarted])

  const saveParticipantAndStartQuiz = async () => {
    if (!pendingParticipant) return
    let response: Response
    try {
      response = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant: pendingParticipant,
          termsAccepted: true,
          termsVersion
        })
      })
    } catch {
      throw new Error('Impossible de joindre le serveur. Vérifiez votre connexion puis réessayez.')
    }

    const responseText = await response.text()
    let result: unknown
    try {
      result = JSON.parse(responseText) as unknown
    } catch {
      throw new Error(
        `Réponse inattendue du serveur (HTTP ${response.status}). Redémarrez l’application puis réessayez.`
      )
    }

    if (response.status !== 201) {
      const errorMessage = typeof result === 'object' && result !== null && 'error' in result
        && typeof result.error === 'string'
        ? result.error
        : undefined
      throw new Error(
        errorMessage ?? `Le serveur n’a pas pu enregistrer le formulaire (HTTP ${response.status}).`
      )
    }

    setParticipant(pendingParticipant)
    setPendingParticipant(null)
  }

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <AnimatePresence mode="wait" initial={false}>
          {!hasStarted ? (
            <m.main
              animate={{ opacity: 1 }}
              className="home-hero"
              exit={{ opacity: 0, scale: 0.985 }}
              initial={{ opacity: 0 }}
              key="home"
              ref={homeRef}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
            >
              <a className="home-brand" href="#home" aria-label="Mansa Capital, L’Atlas">
                <img src={lightLogo} alt="Mansa Capital" />
              </a>
              <p className="home-kicker"><span /> DIAGNOSTIC PATRIMONIAL · L’ATLAS</p>
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
              <div className="home-caption">
                <span className="home-caption-rule" />
                <span>PRENDRE DE LA HAUTEUR POUR MIEUX AVANCER</span>
              </div>
              <m.button
                className="start-button home-cta"
                onClick={() => setHasStarted(true)}
                whileHover={{ y: -3, scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Explorer mon Atlas</span>
                <span className="button-arrow" aria-hidden="true">→</span>
              </m.button>
            </m.main>
          ) : (
            <m.main
              animate={{ opacity: 1, y: 0 }}
              className="app-shell has-quiz"
              exit={{ opacity: 0, y: -10 }}
              initial={{ opacity: 0, y: 12 }}
              key="questionnaire"
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <header className="topbar">
                <a className="wordmark" href="#top" aria-label="L’Atlas, accueil">
                  <img className="wordmark-logo" src={lightLogo} alt="Mansa Capital" />
                </a>
                <div className="topbar-meta">
                  <span className="status-dot" />
                  <span>DIAGNOSTIC PATRIMONIAL</span>
                  <span className="topbar-index">MANSA CAPITAL</span>
                </div>
              </header>
              <div id="top" className="page-content">
                <AnimatePresence mode="wait" initial={false}>
                  {participant
                    ? <QcmZustandApp key="qcm" participant={participant} />
                    : <ParticipantForm key="participant-form" onSubmit={setPendingParticipant} />}
                </AnimatePresence>
              </div>
              <footer className="page-footer">
                <span>MANSA CAPITAL <span className="footer-separator">/</span> L’ATLAS</span>
                <span>PRENDRE DE LA HAUTEUR POUR MIEUX AVANCER</span>
              </footer>
              {pendingParticipant && (
                <TermsDialog
                  onAccept={saveParticipantAndStartQuiz}
                  onDecline={() => setPendingParticipant(null)}
                />
              )}
            </m.main>
          )}
        </AnimatePresence>
      </MotionConfig>
    </LazyMotion>
  )
}

export default App
