/**
 * The AR game shell.
 *
 * Owns the camera, the tracker, the canvas, the game clock and the HUD, and
 * hosts exactly one game module (see engines/base.js for the contract).
 *
 * Layout rule for the whole AR section: this component is `position: fixed;
 * inset: 0` and everything inside is absolutely positioned over the camera
 * view. Nothing scrolls, on any device, ever — a child reaching at a screen
 * must not be able to shift the play area under their own hand.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaArrowLeft, FaPause, FaPlay, FaRedo, FaCog, FaCamera, FaTimes,
  FaStar, FaRegStar, FaHandPaper, FaChartLine, FaLightbulb, FaForward,
} from 'react-icons/fa'
import { ARTracker } from './tracker'
import { GameClock } from './clock'
import { makeView, clear, Particles, drawBanner, scrim, vignette } from './draw'
import { getSettings, onSettingsChange } from './settings'
import { startSession, starsFor, xpFor } from './telemetry'
import { unlockAudio, sfx, haptic, cueFinish } from './feedback'
import { unlockSpeech, speak, cancelSpeech } from './tts'
import { scaledReachBox, isCalibrated } from './profile'
import { makeRng } from './geometry'
import { nextTargetFor, PROMPT_INFO } from './adaptive'
import SettingsSheet from './SettingsSheet'
import styles from './ARStage.module.css'

const CAMERA_HELP = {
  CAMERA_DENIED: {
    title: 'Camera is blocked',
    body: 'These games need the camera so you can see yourself and reach for things. Allow camera access in your browser, then press Try again.',
  },
  CAMERA_MISSING: {
    title: 'No camera found',
    body: 'We could not find a camera on this device. Plug one in, or open the games on a phone or tablet.',
  },
  CAMERA_UNSUPPORTED: {
    title: 'This browser cannot do camera games',
    body: 'Open the games in Chrome, Edge or Safari over https. On a phone, use the built-in browser.',
  },
  MODEL_FAILED: {
    title: 'Could not start hand tracking',
    body: 'The tracking model failed to load. Check your connection and press Try again.',
  },
}

export default function ARStage({ game, onExit, onNext }) {
  const navigate = useNavigate()
  const wrapRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const [phase, setPhase] = useState('intro') // intro|starting|countdown|playing|paused|results|error
  const [trackerStatus, setTrackerStatus] = useState('idle')
  const [trackerError, setTrackerError] = useState(null)
  const [settings, setSettings] = useState(getSettings())
  const [showSettings, setShowSettings] = useState(false)
  const [prompt, setPrompt] = useState({ main: '', sub: '', chip: null })
  const [hud, setHud] = useState({ trial: 0, total: 0, score: 0, streak: 0, promptStage: 'A', step: null })
  const [result, setResult] = useState(null)
  const [liveMetrics, setLiveMetrics] = useState(null)

  const trackerRef = useRef(null)
  const clockRef = useRef(null)
  const moduleRef = useRef(null)
  const recorderRef = useRef(null)
  const particlesRef = useRef(null)
  const viewRef = useRef(null)
  const bannerRef = useRef(null) // { text, until, color }
  const hudBufferRef = useRef({})
  const hudFlushedAt = useRef(0)
  const promptBufferRef = useRef(null)
  const phaseRef = useRef('intro')
  const finishedRef = useRef(false)
  const lastRealTs = useRef(0)

  // The frame loop runs outside React and needs the current phase, so it reads
  // it from a ref rather than a closed-over value. Synced in an effect, not
  // during render.
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => onSettingsChange(setSettings), [])

  // ── no-scroll lock ─────────────────────────────────────────────────────────
  useEffect(() => {
    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      touch: document.body.style.touchAction,
    }
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev.overflow
      document.body.style.position = prev.position
      document.body.style.touchAction = prev.touch
      document.documentElement.style.overflow = ''
    }
  }, [])

  // ── canvas sizing ──────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2) // 2 is plenty; 3 halves fps
      const w = Math.max(1, Math.round(rect.width))
      const h = Math.max(1, Math.round(rect.height))
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      const ctx = canvas.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      viewRef.current = makeView(ctx, w, h, dpr)
      trackerRef.current?.setStageSize(w, h)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    window.addEventListener('orientationchange', resize)
    return () => {
      ro.disconnect()
      window.removeEventListener('orientationchange', resize)
    }
  }, [])

  // ── round lifecycle ────────────────────────────────────────────────────────
  // Declared before `makeApi` because the api's `finish()` closes over it.
  const endRound = useCallback(
    async (extra = {}) => {
      if (finishedRef.current) return
      finishedRef.current = true
      const clock = clockRef.current
      clock?.pause()
      clock?.cancelAll()
      cancelSpeech()

      const recorder = recorderRef.current
      if (!recorder) return
      recorder.setPipeline(trackerRef.current?.latencyReport() || null)
      // The summary is only built inside end(), so stars are read from what it
      // returns rather than from the in-progress session.
      const session = await recorder.end({ outcome: extra.outcome || 'completed' })
      const finalStars = starsFor(session.summary)
      const xp = xpFor(session.summary, finalStars)
      session.stars = finalStars
      session.xp = xp

      if (!getSettings().reducedMotion) particlesRef.current?.confetti()
      cueFinish()
      setResult({ session, stars: finalStars, xp, extra, next: nextTargetFor(game) })
      setPhase('results')
    },
    [game]
  )

  // ── the api handed to the game module ──────────────────────────────────────
  const makeApi = useCallback(
    (recorder, clock, particles) => ({
      game,
      clock,
      recorder,
      particles,
      rng: makeRng(Math.floor(Date.now() % 100000) + 7),
      settings: () => getSettings(),
      pipelineLatency: () => trackerRef.current?.frame.latencyMs ?? 0,
      tracker: () => trackerRef.current,
      reachBox: (eccentricity = 1) => scaledReachBox(eccentricity),

      /** Sets the on-screen prompt and speaks it, honouring the channel setting. */
      say(text, opts = {}) {
        promptBufferRef.current = {
          main: opts.main ?? text,
          sub: opts.sub ?? '',
          chip: opts.chip ?? null,
        }
        const s = getSettings()
        if (s.instruction !== 'visual' && !opts.silent) return speak(opts.speak ?? text, opts)
        return Promise.resolve(false)
      },
      setPrompt(p) {
        promptBufferRef.current = { main: p.main ?? '', sub: p.sub ?? '', chip: p.chip ?? null }
      },
      setHud(patch) {
        hudBufferRef.current = { ...hudBufferRef.current, ...patch }
      },
      /** Big centred word: "GO!", "FREEZE", "3". */
      banner(text, ms = 700, color) {
        bannerRef.current = { text, until: clock.now() + ms, color, from: clock.now(), ms }
      },
      sfx,
      haptic,
      speak,
      finish(summaryExtra = {}) {
        void endRound(summaryExtra)
      },
    }),
    [game, endRound]
  )

  // ── the single render/update loop ──────────────────────────────────────────
  // Declared before `startGame`, which subscribes the tracker to it.
  const onTrackerFrame = useCallback((frame) => {
    const view = viewRef.current
    if (!view) return

    const realNow = frame.t
    const realDt = lastRealTs.current ? (realNow - lastRealTs.current) / 1000 : 1 / 60
    lastRealTs.current = realNow

    const clock = clockRef.current
    const module = moduleRef.current
    const particles = particlesRef.current
    const phaseNow = phaseRef.current
    const playing = phaseNow === 'playing'

    // Game time only advances while playing — this is what makes pause correct.
    const dt = playing && clock ? clock.advance(realDt) : 0
    const now = clock ? clock.now() : 0

    if (playing && module) {
      const f = { frame, dt, now, view, stageW: view.w, stageH: view.h, playing }
      try {
        module.update?.(f)
      } catch (err) {
        console.error('[ar] game update threw', err)
      }
      particles?.step(dt)
    } else if (phaseNow === 'results') {
      particles?.step(realDt)
    }

    // ── draw ──
    clear(view)
    const s = getSettings()
    if (s.visualClutter !== 'minimal') scrim(view, s.highContrast ? 0.34 : 0.2)
    if (!s.reducedMotion && s.visualClutter !== 'minimal') vignette(view, 0.34)

    if (module) {
      const f = { frame, dt, now, view, stageW: view.w, stageH: view.h, playing }
      try {
        module.render?.(f)
      } catch (err) {
        console.error('[ar] game render threw', err)
      }
    }
    particles?.draw(view)

    const banner = bannerRef.current
    if (banner) {
      const alive = banner.until === Infinity || now <= banner.until
      if (alive) {
        const age = banner.until === Infinity ? 0 : (now - banner.from) / banner.ms
        drawBanner(view, banner.text, {
          alpha: banner.until === Infinity ? 1 : Math.max(0, 1 - age * 0.6),
          color: banner.color,
          size: 0.2,
        })
      } else {
        bannerRef.current = null
      }
    }

    // ── flush buffered HUD/prompt to React at ~8 Hz ──
    // The loop runs at 60 fps; re-rendering the HUD that often would cost more
    // than the games do.
    if (realNow - hudFlushedAt.current > 120) {
      hudFlushedAt.current = realNow
      if (Object.keys(hudBufferRef.current).length) {
        const patch = hudBufferRef.current
        hudBufferRef.current = {}
        setHud((h) => ({ ...h, ...patch }))
      }
      if (promptBufferRef.current) {
        const p = promptBufferRef.current
        promptBufferRef.current = null
        setPrompt(p)
      }
      if (getSettings().showMetrics) {
        setLiveMetrics({
          fps: frame.fps,
          detectMs: Math.round(frame.detectMs * 10) / 10,
          latencyMs: frame.latencyMs,
          hands: frame.hands.length,
          body: frame.bodyPresent,
        })
      }
    }
  }, [])

  const beginPlay = useCallback(() => {
    const clock = clockRef.current
    const module = moduleRef.current
    if (!clock || !module) return
    clock.reset()
    clock.start()
    finishedRef.current = false
    setPhase('playing')
    module.mount?.(module._api)
  }, [])

  const startGame = useCallback(async () => {
    // One user gesture unlocks audio + speech for the whole session.
    unlockAudio()
    unlockSpeech()
    setPhase('starting')

    const clock = new GameClock()
    const particles = new Particles(260)
    clockRef.current = clock
    particlesRef.current = particles

    const module = game.create(game)
    const diff = module.difficultySnapshot?.() || null
    const recorder = startSession({
      gameId: game.id,
      engine: game.engine,
      title: game.title,
      domains: game.domains,
      lifeSkill: game.lifeSkill,
      group: game.group,
      difficulty: diff,
      promptStage: nextTargetFor(game)?.promptStage || 'A',
    })
    recorderRef.current = recorder
    const api = makeApi(recorder, clock, particles)
    module._api = api
    moduleRef.current = module

    const tracker = new ARTracker({
      tracking: module.requires || 'hand',
      mirror: true,
      handSwap: getSettings().handSwap,
      maxHands: module.maxHands ?? 2,
    })
    trackerRef.current = tracker
    const off = tracker.onStatus((status, err) => {
      setTrackerStatus(status)
      setTrackerError(err)
      if (status === 'error') setPhase('error')
    })

    const view = viewRef.current
    if (view) tracker.setStageSize(view.w, view.h)

    tracker.onFrame(onTrackerFrame)
    await tracker.start(videoRef.current)
    if (tracker.status === 'error') return off

    // Short countdown so the child can get their hands into frame.
    setPhase('countdown')
    let n = 3
    setPrompt({ main: 'Get ready!', sub: 'Show me your hand', chip: null })
    const tick = () => {
      bannerRef.current = { text: String(n), until: Infinity, from: 0, ms: 500 }
      sfx.countdown(n)
      haptic('tick')
      n--
      if (n >= 1) {
        window.setTimeout(tick, 750)
      } else {
        window.setTimeout(() => {
          bannerRef.current = null
          beginPlay()
        }, 750)
      }
    }
    tick()
    return off
  }, [game, makeApi, beginPlay]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── pause / resume / restart ───────────────────────────────────────────────
  const doPause = useCallback(() => {
    if (phaseRef.current !== 'playing') return
    clockRef.current?.pause()
    recorderRef.current?.pauseStart()
    moduleRef.current?.onPause?.()
    cancelSpeech()
    haptic('tap')
    setPhase('paused')
  }, [])

  const doResume = useCallback(() => {
    if (phaseRef.current !== 'paused') return
    clockRef.current?.start()
    recorderRef.current?.pauseEnd()
    moduleRef.current?.onResume?.()
    haptic('tap')
    setPhase('playing')
  }, [])

  const doRestart = useCallback(async () => {
    // Close the current round honestly (marked aborted) before opening a new one.
    const clock = clockRef.current
    clock?.pause()
    clock?.cancelAll()
    cancelSpeech()
    moduleRef.current?.unmount?.()
    if (recorderRef.current && !finishedRef.current) {
      finishedRef.current = true
      recorderRef.current.setPipeline(trackerRef.current?.latencyReport() || null)
      await recorderRef.current.end({ outcome: 'restarted' })
    }

    const newClock = new GameClock()
    clockRef.current = newClock
    particlesRef.current?.clear()
    const module = game.create(game)
    const recorder = startSession({
      gameId: game.id,
      engine: game.engine,
      title: game.title,
      domains: game.domains,
      lifeSkill: game.lifeSkill,
      group: game.group,
      difficulty: module.difficultySnapshot?.() || null,
      promptStage: nextTargetFor(game)?.promptStage || 'A',
    })
    recorderRef.current = recorder
    module._api = makeApi(recorder, newClock, particlesRef.current)
    moduleRef.current = module
    setResult(null)
    setHud({ trial: 0, total: 0, score: 0, streak: 0, promptStage: 'A', step: null })
    bannerRef.current = null
    beginPlay()
  }, [game, makeApi, beginPlay])

  const exit = useCallback(() => {
    const clock = clockRef.current
    clock?.pause()
    clock?.cancelAll()
    cancelSpeech()
    moduleRef.current?.unmount?.()
    if (recorderRef.current && !finishedRef.current) {
      finishedRef.current = true
      recorderRef.current.setPipeline(trackerRef.current?.latencyReport() || null)
      void recorderRef.current.end({ outcome: 'abandoned' })
    }
    trackerRef.current?.stop()
    onExit ? onExit() : navigate('/games')
  }, [navigate, onExit])

  // Auto-pause when the tab is hidden: a child who walks away should not be
  // timed out, and the camera should stop.
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) doPause()
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [doPause])

  // Keyboard shortcuts for the adult supervising the session: space pauses,
  // escape backs out, R restarts. Faster than aiming at a button while a child
  // is mid-reach.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        if (phaseRef.current === 'playing') doPause()
        else if (phaseRef.current === 'paused') doResume()
      } else if (e.key === 'Escape') {
        if (phaseRef.current === 'playing') doPause()
        else exit()
      } else if (e.key === 'r' || e.key === 'R') {
        if (phaseRef.current === 'paused' || phaseRef.current === 'results') void doRestart()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [doPause, doResume, doRestart, exit])

  // Full teardown on unmount — the camera light must go out.
  useEffect(
    () => () => {
      clockRef.current?.cancelAll()
      cancelSpeech()
      moduleRef.current?.unmount?.()
      trackerRef.current?.stop()
    },
    []
  )

  const domainLabels = useMemo(() => (game.domains || []).map(prettyDomain), [game.domains])
  const calibrated = isCalibrated()

  return (
    <div className={styles.stage} ref={wrapRef} data-phase={phase}>
      {/* The child sees themselves: mirrored camera, full-bleed, behind everything. */}
      <video
        ref={videoRef}
        className={styles.video}
        playsInline
        muted
        autoPlay
        style={{
          transform: settings.mirrorView ? 'scaleX(-1)' : 'none',
          opacity: phase === 'intro' || phase === 'error' ? 0.25 : 1,
        }}
      />
      <canvas ref={canvasRef} className={styles.canvas} />

      {/* ── top bar ── */}
      {phase !== 'intro' && phase !== 'error' && (
        <div className={styles.topBar}>
          <button className={styles.iconBtn} onClick={exit} aria-label="Back to games">
            <FaArrowLeft />
          </button>

          <div className={styles.topCentre}>
            <span className={styles.gameName}>{game.title}</span>
            {hud.total > 0 && (
              <span className={styles.counter}>
                {Math.min(hud.trial, hud.total)}/{hud.total}
              </span>
            )}
          </div>

          <div className={styles.topRight}>
            {hud.streak > 1 && <span className={styles.streak}>🔥 {hud.streak}</span>}
            <span className={styles.promptChip} title={PROMPT_INFO[hud.promptStage]?.help}>
              {hud.promptStage}
            </span>
            <button
              className={styles.iconBtn}
              onClick={() => setShowSettings(true)}
              aria-label="Settings"
            >
              <FaCog />
            </button>
            <button
              className={styles.iconBtn}
              onClick={phase === 'playing' ? doPause : doResume}
              aria-label={phase === 'playing' ? 'Pause' : 'Play'}
              disabled={phase !== 'playing' && phase !== 'paused'}
            >
              {phase === 'playing' ? <FaPause /> : <FaPlay />}
            </button>
          </div>
        </div>
      )}

      {/* ── instruction banner ── */}
      {(phase === 'playing' || phase === 'countdown') && prompt.main && settings.captions && (
        <div className={styles.promptBar}>
          <span className={styles.promptMain}>{prompt.main}</span>
          {prompt.sub && <span className={styles.promptSub}>{prompt.sub}</span>}
        </div>
      )}

      {hud.step && phase === 'playing' && (
        <div className={styles.stepToast} key={`${hud.step.label}-${hud.step.direction}`}>
          {hud.step.direction === 'up' ? '⬆' : '⬇'} {hud.step.text}
        </div>
      )}

      {liveMetrics && phase === 'playing' && (
        <div className={styles.metrics}>
          <span>{liveMetrics.fps} fps</span>
          <span>{liveMetrics.detectMs} ms det</span>
          <span>~{liveMetrics.latencyMs} ms lag</span>
          <span>{liveMetrics.hands} hand{liveMetrics.hands === 1 ? '' : 's'}</span>
          {liveMetrics.body && <span>body ✓</span>}
        </div>
      )}

      {/* ── intro ── */}
      {phase === 'intro' && (
        <div className={styles.sheet}>
          <div className={styles.introCard}>
            <button className={styles.sheetClose} onClick={exit} aria-label="Back">
              <FaTimes />
            </button>
            <div className={styles.introIcon}>{game.icon}</div>
            <h1 className={styles.introTitle}>{game.title}</h1>
            <p className={styles.introHow}>{game.how}</p>

            <div className={styles.tagRow}>
              {domainLabels.slice(0, 4).map((d) => (
                <span key={d} className={styles.tag}>
                  {d}
                </span>
              ))}
              {game.lifeSkillLabel && (
                <span className={`${styles.tag} ${styles.tagLife}`}>{game.lifeSkillLabel}</span>
              )}
            </div>

            {!calibrated && game.usesReach !== false && (
              <p className={styles.calibNote}>
                <FaHandPaper /> Tip: run <strong>Set Up My Space</strong> once so targets land
                where this child can actually reach.
              </p>
            )}

            <button className={styles.playBtn} onClick={startGame}>
              <FaCamera /> Start — turn on camera
            </button>
            <p className={styles.privacyNote}>
              The camera runs only on this device. No video is recorded, saved or sent
              anywhere.
            </p>
            <button className={styles.linkBtn} onClick={() => setShowSettings(true)}>
              <FaCog /> Sensory &amp; motor settings
            </button>
          </div>
        </div>
      )}

      {/* ── camera / model errors ── */}
      {phase === 'error' && (
        <div className={styles.sheet}>
          <div className={styles.introCard}>
            <div className={styles.introIcon}>📷</div>
            <h1 className={styles.introTitle}>
              {(CAMERA_HELP[trackerError] || CAMERA_HELP.MODEL_FAILED).title}
            </h1>
            <p className={styles.introHow}>
              {(CAMERA_HELP[trackerError] || CAMERA_HELP.MODEL_FAILED).body}
            </p>
            <button
              className={styles.playBtn}
              onClick={() => {
                trackerRef.current?.stop()
                setPhase('intro')
              }}
            >
              <FaRedo /> Try again
            </button>
            <button className={styles.linkBtn} onClick={exit}>
              Back to games
            </button>
          </div>
        </div>
      )}

      {/* ── camera warming up ── */}
      {phase === 'starting' && (
        <div className={styles.sheet}>
          <div className={styles.loadingCard}>
            <div className={styles.spinner} />
            <p>
              {trackerStatus === 'starting'
                ? 'Turning on the camera and loading hand tracking…'
                : 'Getting ready…'}
            </p>
          </div>
        </div>
      )}

      {/* ── paused ── */}
      {phase === 'paused' && (
        <div className={styles.sheet}>
          <div className={styles.pauseCard}>
            <h2>Paused</h2>
            <p className={styles.pauseSub}>Take all the time you need.</p>
            <div className={styles.pauseBtns}>
              <button className={styles.playBtn} onClick={doResume}>
                <FaPlay /> Keep playing
              </button>
              <button className={styles.ghostBtn} onClick={doRestart}>
                <FaRedo /> Start again
              </button>
              <button className={styles.ghostBtn} onClick={() => setShowSettings(true)}>
                <FaCog /> Settings
              </button>
              <button className={styles.ghostBtn} onClick={exit}>
                <FaArrowLeft /> Games
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── results ── */}
      {phase === 'results' && result && (
        <Results
          result={result}
          onAgain={doRestart}
          onExit={exit}
          onNext={onNext}
          onInsights={() => {
            trackerRef.current?.stop()
            navigate('/games/ar/insights')
          }}
        />
      )}

      {showSettings && (
        <SettingsSheet
          onClose={() => setShowSettings(false)}
          /* A getter, not the tracker itself: reading a ref during render is
             exactly the kind of thing that goes stale. */
          getTracker={() => trackerRef.current}
          inGame={phase === 'playing' || phase === 'paused'}
        />
      )}
    </div>
  )
}

/**
 * The results screen shows the child three stars and the adult the numbers that
 * actually mean something. Never a single mixed "score" as the headline.
 */
function Results({ result, onAgain, onExit, onNext, onInsights }) {
  const s = result.session.summary || {}
  const rows = [
    { label: 'Got the idea', value: fmtPct(s.comprehensionPct), hint: 'correct + right answer reached imprecisely' },
    { label: 'On their own', value: fmtPct(s.independentPct), hint: 'correct with no prompt' },
    { label: 'Thinking time', value: fmtMs(s.medianLatencyMs), hint: 'prompt → started moving' },
    { label: 'Moving time', value: fmtMs(s.medianMovementMs), hint: 'started moving → touched' },
  ]
  if (s.pathEfficiency != null) {
    rows.push({ label: 'Reach directness', value: `${Math.round(s.pathEfficiency * 100)}%`, hint: '100% = straight to the target' })
  }
  if (s.inhibitionPct != null) {
    rows.push({ label: 'Stopped when told', value: fmtPct(s.inhibitionPct), hint: 'no-go trials withheld' })
  }
  if (s.timingVariabilityMs != null) {
    rows.push({ label: 'Timing steadiness', value: `±${Math.round(s.timingVariabilityMs)} ms`, hint: 'lower = more consistent' })
  }

  return (
    <div className={styles.sheet}>
      <div className={styles.resultCard}>
        <div className={styles.starRow}>
          {[1, 2, 3].map((i) =>
            i <= result.stars ? (
              <FaStar key={i} className={styles.starOn} style={{ animationDelay: `${i * 0.12}s` }} />
            ) : (
              <FaRegStar key={i} className={styles.starOff} />
            )
          )}
        </div>
        <h2 className={styles.resultTitle}>
          {result.stars === 3 ? 'Brilliant!' : result.stars === 2 ? 'Great work!' : 'Good try!'}
        </h2>
        <p className={styles.resultSub}>
          {s.trials} turn{s.trials === 1 ? '' : 's'} · +{result.xp} XP
        </p>

        <div className={styles.metricGrid}>
          {rows.slice(0, 6).map((r) => (
            <div key={r.label} className={styles.metricCell} title={r.hint}>
              <span className={styles.metricValue}>{r.value}</span>
              <span className={styles.metricLabel}>{r.label}</span>
            </div>
          ))}
        </div>

        {result.next && (
          <p className={styles.nextUp}>
            <FaLightbulb /> Next: <strong>{result.next.promptName}</strong>
            {result.next.focus ? ` · working on ${result.next.focus.toLowerCase()}` : ''}
          </p>
        )}

        <div className={styles.resultBtns}>
          <button className={styles.playBtn} onClick={onAgain}>
            <FaRedo /> Play again
          </button>
          {onNext && (
            <button className={styles.ghostBtn} onClick={onNext}>
              <FaForward /> Next game
            </button>
          )}
          <button className={styles.ghostBtn} onClick={onExit}>
            <FaArrowLeft /> Games
          </button>
          <button className={styles.ghostBtn} onClick={onInsights}>
            <FaChartLine /> Progress
          </button>
        </div>
      </div>
    </div>
  )
}

const fmtPct = (v) => (v == null ? '—' : `${Math.round(v)}%`)
const fmtMs = (v) => (v == null ? '—' : v >= 1000 ? `${(v / 1000).toFixed(1)} s` : `${Math.round(v)} ms`)

const DOMAIN_LABELS = {
  visualDiscrimination: 'Visual attention',
  auditoryComprehension: 'Listening',
  readingSymbol: 'Reading',
  reactionSpeed: 'Reaction',
  reachAccuracy: 'Reaching',
  sustainedAttention: 'Attention',
  workingMemory: 'Working memory',
  sequencing: 'Sequencing',
  inhibition: 'Stop &amp; wait',
  cognitiveFlexibility: 'Flexibility',
  bilateralCoordination: 'Two hands',
  motorPlanning: 'Motor planning',
  spatialConcepts: 'Space words',
  socialReasoning: 'Social thinking',
  independence: 'Independence',
}

function prettyDomain(d) {
  return (DOMAIN_LABELS[d] || d).replace('&amp;', '&')
}
