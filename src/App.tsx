import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from 'framer-motion'
import Lenis from 'lenis'
import './App.css'
import lightLogo from './assets/LOGO-MANSA-CAPITAL.png'
import { InteractiveGlobe } from './components/InteractiveGlobe'
import { ParticipantForm } from './components/ParticipantForm'
import { QcmZustandApp } from './components/QcmZustandApp'
import { TermsDialog } from './components/TermsDialog'
import { archetypeProfiles } from './data/questions'
import { type ParticipantDetails, type ParticipantResult } from './types/participant'
import { type QcmAnswer } from './types/qcm'
import { type Archetype } from './types/qcm'

const homeSlides: { archetype: Archetype; image: string }[] = [
  { archetype: 'semeur', image: '/semeur.png' },
  { archetype: 'continuateur', image: '/continuateur.png' },
  { archetype: 'passeur', image: '/passeur.png' },
  { archetype: 'createur', image: '/createur.png' },
  { archetype: 'visionnaire', image: '/visionnaire.png' }
]

function App() {
  const [hasStarted, setHasStarted] = useState(false)
  const [globeTexture, setGlobeTexture] = useState<HTMLImageElement | null>(null)
  const [participant, setParticipant] = useState<ParticipantDetails | null>(null)
  const [isTermsOpen, setIsTermsOpen] = useState(false)
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
    const isSmallScreen = window.matchMedia('(max-width: 640px)').matches
    if (
      hasStarted ||
      isSmallScreen ||
      !homeRef.current ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return

    let cancelled = false
    let revertContext: (() => void) | undefined

    void import('gsap').then(({ default: gsap }) => {
      if (cancelled || !homeRef.current) return
      const context = gsap.context(() => {
        const slides = gsap.utils.toArray<HTMLElement>('.home-slide')
        const portraits = gsap.utils.toArray<HTMLElement>('.home-slide-portrait')
        const slideCopies = gsap.utils.toArray<HTMLElement>('.home-slide-copy')
        gsap.set(slides, { autoAlpha: 0, xPercent: 2 })
        gsap.set(portraits, { scale: 1.06, xPercent: 2 })
        gsap.set(slideCopies, { autoAlpha: 0, y: 22, filter: 'blur(8px)' })

        const intro = gsap.timeline({ defaults: { ease: 'power3.out' } })
        intro
          .fromTo(
            '.home-background',
            { scale: 1.025 },
            { duration: 1.4, scale: 1.045, ease: 'power2.out' },
            0
          )
          .fromTo(
            ['.home-brand', '.home-kicker'],
            { autoAlpha: 0, y: 14 },
            { autoAlpha: 1, y: 0, duration: 1, stagger: 0.12, clearProps: 'all' },
            0.2
          )
          .fromTo(
            '.home-cta',
            { autoAlpha: 0, y: 16 },
            { autoAlpha: 1, y: 0, duration: 1, clearProps: 'all' },
            0.6
          )
          .fromTo(
            slides[0],
            { autoAlpha: 0, xPercent: 1.5 },
            { autoAlpha: 1, xPercent: 0, duration: 1.4, ease: 'power2.out' },
            0.35
          )
          .fromTo(
            portraits[0],
            { scale: 1.08, xPercent: 1.5 },
            { scale: 1, xPercent: 0, duration: 2.2, ease: 'power2.out' },
            0.35
          )
          .fromTo(
            slideCopies[0],
            { autoAlpha: 0, y: 22, filter: 'blur(8px)' },
            {
              autoAlpha: 1,
              y: 0,
              filter: 'blur(0px)',
              duration: 1.25,
              ease: 'power3.out',
              clearProps: 'filter'
            },
            0.7
          )

        gsap.to('.home-background', {
          scale: 1.09,
          duration: 34,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: 1.75
        })

        const slideshow = gsap.timeline({ delay: 5.2, repeat: -1 })
        slides.forEach((slide, index) => {
          const nextSlide = slides[(index + 1) % slides.length]
          const portrait = portraits[index]
          const nextPortrait = portraits[(index + 1) % portraits.length]
          const nextCopy = slideCopies[(index + 1) % slideCopies.length]
          slideshow
            .to(slide, {
              autoAlpha: 0,
              duration: 1.5,
              ease: 'power2.inOut',
              xPercent: -1.5
            }, '+=2.1')
            .fromTo(
              nextSlide,
              { autoAlpha: 0, xPercent: 2 },
              {
                autoAlpha: 1,
                duration: 1.65,
                ease: 'power3.out',
                xPercent: 0
              },
              '<0.15'
            )
            .fromTo(
              nextCopy,
              { autoAlpha: 0, y: 22, filter: 'blur(8px)' },
              {
                autoAlpha: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: 1.35,
                ease: 'power3.out',
                clearProps: 'filter'
              },
              '<0.15'
            )
            .to(portrait, {
              duration: 1.65,
              ease: 'power2.inOut',
              scale: 1.07,
              xPercent: -2
            }, '<')
            .fromTo(
              nextPortrait,
              { scale: 1.06, xPercent: 2 },
              { duration: 1.9, ease: 'power3.out', scale: 1, xPercent: 0 },
              '<'
            )
        })
      }, homeRef)
      revertContext = () => context.revert()
    })

    return () => {
      cancelled = true
      revertContext?.()
    }
  }, [hasStarted])

  const startQuiz = useCallback(async (details: ParticipantDetails) => {
    setParticipant(details)
  }, [])

  const saveCompletedQuiz = useCallback(async (
    details: ParticipantDetails,
    archetype: ParticipantResult,
    answers: QcmAnswer[],
    submissionId: string
  ) => {
    let response: Response
    try {
      response = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, participant: details, result: archetype, answers })
      })
    } catch {
      throw new Error('Impossible de joindre le serveur. Vérifiez votre connexion puis réessayez.')
    }

    const responseText = await response.text()
    let responseBody: unknown
    try {
      responseBody = JSON.parse(responseText) as unknown
    } catch {
      throw new Error(
        `Réponse inattendue du serveur (HTTP ${response.status}). Redémarrez l’application puis réessayez.`
      )
    }

    if (response.status !== 201) {
      const errorMessage = typeof responseBody === 'object' && responseBody !== null && 'error' in responseBody
        && typeof responseBody.error === 'string'
        ? responseBody.error
        : undefined
      throw new Error(
        errorMessage ?? `Le serveur n’a pas pu enregistrer le diagnostic (HTTP ${response.status}).`
      )
    }

  }, [])

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
              <div aria-hidden="true" className="home-background" />
              <a className="home-brand" href="#home" aria-label="Mansa Capital, L’Atlas">
                <img src={lightLogo} alt="Mansa Capital" />
              </a>
              <p className="home-kicker"><span /> DIAGNOSTIC PATRIMONIAL · L’ATLAS</p>
              <img
                alt=""
                aria-hidden="true"
                className="globe-texture-preload"
                fetchPriority="low"
                onLoad={(event) => setGlobeTexture(event.currentTarget)}
                src="/Globe.jpeg"
              />
              {globeTexture && (
                <div aria-hidden="true" className="home-globe-layer">
                  <InteractiveGlobe decorative textureImage={globeTexture} />
                </div>
              )}
              <div className="home-artwork">
                {homeSlides.map(({ archetype, image }, index) => {
                  const profile = archetypeProfiles[archetype]
                  return (
                    <section
                      aria-label={profile.name}
                      className="home-slide"
                      key={archetype}
                    >
                      <div className="home-slide-copy">
                        <span className="home-slide-index">
                          0{index + 1} <span>/ 05</span>
                        </span>
                        <h1 className="home-slide-title">{profile.name}</h1>
                        <p>{profile.description}</p>
                      </div>
                      <div className="home-slide-portrait">
                        <img
                          alt={profile.name}
                          className="home-slide-image"
                          fetchPriority={index === 0 ? 'high' : 'auto'}
                          src={image}
                        />
                      </div>
                    </section>
                  )
                })}
              </div>
              <m.button
                className="start-button home-cta"
                onClick={() => setHasStarted(true)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="home-cta-label">Découvrir mon profil financier</span>
                <span aria-hidden="true" className="button-arrow">→</span>
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
                    ? (
                      <QcmZustandApp
                        key="qcm"
                        onComplete={saveCompletedQuiz}
                        participant={participant}
                      />
                    )
                    : <ParticipantForm key="participant-form" onSubmit={startQuiz} />}
                </AnimatePresence>
              </div>
              <footer className="page-footer">
                <span>MANSA CAPITAL <span className="footer-separator">/</span> L’ATLAS</span>
                <a
                  className="footer-terms-link"
                  href="#conditions-utilisation"
                  onClick={(event) => {
                    event.preventDefault()
                    setIsTermsOpen(true)
                  }}
                >
                  Conditions générales d’utilisation
                </a>
                <span>PRENDRE DE LA HAUTEUR POUR MIEUX AVANCER</span>
              </footer>
              {isTermsOpen && <TermsDialog onClose={() => setIsTermsOpen(false)} />}
            </m.main>
          )}
        </AnimatePresence>
      </MotionConfig>
    </LazyMotion>
  )
}

export default App
