/**
 * MISSION — chains several activities into one continuous story.
 *
 * "My Day" is the flagship: wake up → wash your hands → get dressed → pack your
 * bag → pay for lunch → cross the road → follow the teacher's three
 * instructions → ask for help. In one sitting that exercises motor control,
 * attention, inhibition, working memory, sequencing, numeracy, language and
 * functional independence — which is the whole thesis of the platform, and is
 * considerably more valuable than popping AR balls.
 *
 * Implementation note: this engine does not reimplement anything. It builds the
 * real sub-modules from the real engines and hands each a *proxied* api whose
 * only differences are that
 *   - `finish()` advances the chain instead of ending the session, and
 *   - every trial recorded is tagged with the stage it came from,
 * so a mission produces one session whose trials can be split back out per
 * activity. Nothing about a sub-game changes because it is running inside a
 * mission.
 */
import { drawBanner, PALETTE, hexA, roundRect } from '../core/draw'
import { getSettings } from '../core/settings'
import { ENGINES } from './registry'

export function missionEngine(game) {
  const cfg = {
    /**
     * [{ id, title, say, engine, config, domains?, lifeSkill? }]
     * Each entry becomes a real sub-game with its own adaptive state, keyed by
     * `<missionId>:<stageId>` so a child's level in "the handwashing part of My
     * Day" tracks separately from the standalone Handwashing game.
     */
    chain: [],
    ...(game.config || {}),
  }

  let api = null
  let stageIndex = -1
  let current = null // { module, spec, subGame }
  let interstitial = null // { title, say, until }
  let ended = false
  let stageResults = []

  /** Builds the synthetic game entry a sub-module is created from. */
  function subGameFor(spec) {
    return {
      id: `${game.id}:${spec.id}`,
      title: spec.title,
      engine: spec.engine,
      group: game.group,
      domains: spec.domains || game.domains,
      lifeSkill: spec.lifeSkill || game.lifeSkill,
      icon: spec.icon || game.icon,
      how: spec.say || spec.title,
      adaptive: spec.adaptive || game.adaptive,
      config: spec.config || {},
      // A mission stage is short by design — long enough to be a real attempt,
      // short enough that the story keeps moving.
      usesReach: true,
    }
  }

  /** The api a sub-module sees. */
  function proxyApi(spec) {
    const recorder = api.recorder
    return {
      ...api,
      game: current?.subGame,
      recorder: {
        ...recorder,
        trial: (t) => recorder.trial({ ...t, stage: spec.id }),
        event: (type, data) => recorder.event(type, { ...data, stage: spec.id }),
        setPromptStage: (s) => recorder.setPromptStage(s),
        setPipeline: (r) => recorder.setPipeline(r),
        session: recorder.session,
      },
      // A sub-game counts its own turns, but the number the child needs to see
      // is how far through the *day* they are. So the mission owns trial/total
      // and everything else passes through.
      setHud: (patch) => {
        const { trial, total, ...rest } = patch || {}
        void trial
        void total
        api.setHud({ ...rest, trial: stageIndex + 1, total: cfg.chain.length })
      },
      finish: (result) => {
        stageResults.push({ id: spec.id, title: spec.title, ...(result || {}) })
        advance()
      },
    }
  }

  function advance() {
    if (ended) return
    current?.module?.unmount?.()
    current = null
    stageIndex++

    if (stageIndex >= cfg.chain.length) {
      ended = true
      api.finish({ outcome: 'completed', stages: stageResults.length })
      return
    }

    const spec = cfg.chain[stageIndex]
    // A short interstitial: the story beat that makes this a day rather than a
    // playlist.
    interstitial = {
      title: spec.title,
      say: spec.say || spec.title,
      until: api.clock.now() + 2600,
      index: stageIndex,
    }
    api.setPrompt({ main: spec.title, sub: spec.say || '' })
    api.sfx.whoosh()
    void api.say(spec.say || spec.title, { main: spec.title, sub: '' })
    api.setHud({ trial: stageIndex + 1, total: cfg.chain.length })

    api.clock.after(2600, () => {
      if (ended) return
      interstitial = null
      const factory = ENGINES[spec.engine]
      if (!factory) {
        console.error(`[ar] mission stage "${spec.id}" wants unknown engine "${spec.engine}"`)
        advance()
        return
      }
      const subGame = subGameFor(spec)
      current = { spec, subGame, module: null }
      const module = factory(subGame)
      current.module = module
      module.mount?.(proxyApi(spec))
    })
  }

  return {
    // A mission may contain body games, so the heaviest requirement wins and
    // both landmarkers are loaded once up front rather than mid-story.
    requires: cfg.chain.some((s) => BODY_ENGINES.has(s.engine)) ? 'both' : 'hand',

    difficultySnapshot() {
      return { stages: cfg.chain.map((s) => s.id) }
    },

    mount(a) {
      api = a
      stageIndex = -1
      stageResults = []
      ended = false
      api.setHud({ total: cfg.chain.length })
      api.setPrompt({ main: game.title, sub: cfg.opening || "Let's get through the day together" })
      void api.say(cfg.openingSay || cfg.opening || `${game.title}. Let us begin.`, {
        main: game.title,
        sub: cfg.opening || '',
      })
      api.clock.after(2400, advance)
    },

    update(f) {
      if (ended) return
      current?.module?.update?.(f)
    },

    render(f) {
      const { view, now } = f
      const s = getSettings()
      current?.module?.render?.(f)

      if (interstitial && now < interstitial.until) {
        // Dim the world and name the next part of the day.
        const ctx = view.ctx
        ctx.save()
        ctx.fillStyle = 'rgba(4,8,20,0.62)'
        ctx.fillRect(0, 0, view.w, view.h)
        ctx.restore()
        drawBanner(view, `${interstitial.index + 1}. ${interstitial.title}`, {
          size: 0.075,
          y: 0.44,
          color: '#fff',
        })
        if (interstitial.say && interstitial.say !== interstitial.title) {
          drawBanner(view, interstitial.say, { size: 0.038, y: 0.55, color: '#bfe4f5' })
        }
      }

      // Journey strip: where in the day we are. Always visible, because a child
      // who cannot see the end of a long activity often will not start it.
      drawJourney(view, cfg.chain, stageIndex, s)
    },

    onPause() {
      current?.module?.onPause?.()
    },

    onResume() {
      current?.module?.onResume?.()
    },

    unmount() {
      ended = true
      current?.module?.unmount?.()
      current = null
    },
  }
}

const BODY_ENGINES = new Set(['pose', 'cue', 'bilateral'])

function drawJourney(view, chain, index, s) {
  if (!chain.length) return
  const ctx = view.ctx
  const r = Math.max(6, view.short * 0.013)
  const gap = Math.min(r * 3.4, (view.w * 0.8) / Math.max(chain.length - 1, 1))
  const total = (chain.length - 1) * gap
  const x0 = view.w / 2 - total / 2
  const y = view.h * 0.965
  ctx.save()
  ctx.fillStyle = 'rgba(4,8,20,0.55)'
  roundRect(ctx, x0 - r * 2, y - r * 1.9, total + r * 4, r * 3.8, r * 1.9)
  ctx.fill()
  for (let i = 0; i < chain.length; i++) {
    const x = x0 + i * gap
    if (i < chain.length - 1) {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + gap - r, y)
      ctx.strokeStyle = i < index ? hexA(PALETTE.green, 0.8) : 'rgba(255,255,255,0.18)'
      ctx.lineWidth = 3
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(x, y, i === index ? r * 1.25 : r, 0, Math.PI * 2)
    ctx.fillStyle = i < index ? PALETTE.green : i === index ? PALETTE.yellow : 'rgba(255,255,255,0.24)'
    ctx.fill()
    if (i === index && !s.reducedMotion) {
      ctx.beginPath()
      ctx.arc(x, y, r * 2, 0, Math.PI * 2)
      ctx.strokeStyle = hexA(PALETTE.yellow, 0.6)
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }
  ctx.restore()
}
