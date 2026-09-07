/**
 * SET UP MY SPACE — reach-envelope calibration.
 *
 * This is the single highest-leverage thing in the platform, and it is a game
 * rather than a settings screen for a reason: a child will happily chase five
 * stars, and will not sit through a setup wizard.
 *
 * The child reaches to five points — centre, up, down, left, right — as far as
 * is comfortable. We record where their fingertip actually got to and store the
 * bounding box as their personal interaction bubble. Every other game then
 * places targets inside *that* box.
 *
 * Why it matters: a child with restricted shoulder movement and a child with
 * full range can play the identical game at the identical difficulty, because
 * "peripheral target" means peripheral *for them*. Without this, arbitrary
 * screen coordinates silently turn a cognitive task into a physical one.
 */
import { HoldTimer } from '../core/interactions'
import { clamp } from '../core/geometry'
import { getSettings } from '../core/settings'
import {
  drawTarget, drawHandCursor, drawSkeleton, drawReachBox, drawBanner, PALETTE, hexA,
} from '../core/draw'
import { HAND_BONES, POSE_BONES } from '../core/vision'
import { pointersFor, pulse, Trail } from './base'
import { saveReachCalibration, loadProfile } from '../core/profile'

/** The five reach points, in the order they are asked for. */
const STATIONS = [
  { id: 'centre', label: 'straight ahead', x: 0.5, y: 0.5, emoji: '🎯' },
  { id: 'left', label: 'out to your LEFT', x: 0.08, y: 0.5, emoji: '⬅️' },
  { id: 'right', label: 'out to your RIGHT', x: 0.92, y: 0.5, emoji: '➡️' },
  { id: 'up', label: 'up HIGH', x: 0.5, y: 0.06, emoji: '⬆️' },
  { id: 'down', label: 'down LOW', x: 0.5, y: 0.94, emoji: '⬇️' },
]

export function calibrationEngine() {
  let api = null
  let index = 0
  let hold = null
  let station = null
  let extremes = []
  let done = false
  let bothHands = { left: [], right: [] }
  const trail = new Trail(20)

  function nextStation() {
    if (index >= STATIONS.length) return finish()
    station = STATIONS[index]
    hold = new HoldTimer(700)
    const line = `Reach ${station.label} — as far as is comfy`
    api.setPrompt({ main: line, sub: 'Hold it for a moment' })
    void api.say(`Reach ${station.label.replace(/LEFT|RIGHT|HIGH|LOW/g, (m) => m.toLowerCase())}`, {
      main: line,
      sub: 'Hold it for a moment',
    })
    api.setHud({ trial: index + 1, total: STATIONS.length })
  }

  function record(point, side) {
    extremes.push({ id: station.id, x: point.x, y: point.y })
    if (side) bothHands[side]?.push({ id: station.id, x: point.x, y: point.y })
    api.sfx.correct(index)
    api.haptic('correct')
    if (!getSettings().reducedMotion) api.particles.burst(point.x, point.y, PALETTE.green)
    index++
    api.clock.after(700, nextStation)
  }

  function finish() {
    if (done) return
    done = true

    const xs = extremes.map((e) => e.x)
    const ys = extremes.map((e) => e.y)
    // Pad outwards a little: the child stopped where it got uncomfortable, and
    // a target centred exactly on that limit would sit right at the edge of
    // what they can do.
    const pad = 0.03
    const box = {
      minX: clamp(Math.min(...xs) - pad, 0.02, 0.45),
      maxX: clamp(Math.max(...xs) + pad, 0.55, 0.98),
      minY: clamp(Math.min(...ys) - pad, 0.02, 0.45),
      maxY: clamp(Math.max(...ys) + pad, 0.55, 0.98),
    }

    const width = box.maxX - box.minX
    const height = box.maxY - box.minY
    const asymmetry = Math.abs((0.5 - box.minX) - (box.maxX - 0.5))

    saveReachCalibration(box, {
      stations: extremes,
      width: Math.round(width * 1000) / 1000,
      height: Math.round(height * 1000) / 1000,
      // A large left/right asymmetry is worth a therapist knowing about. It is
      // a descriptive observation about this session, not a finding.
      asymmetry: Math.round(asymmetry * 1000) / 1000,
      seated: getSettings().seated,
      handsUsed: {
        left: bothHands.left.length,
        right: bothHands.right.length,
      },
      at: new Date().toISOString(),
    })

    api.recorder.event('reachCalibrated', {
      width: Math.round(width * 1000) / 1000,
      height: Math.round(height * 1000) / 1000,
      asymmetry: Math.round(asymmetry * 1000) / 1000,
    })

    // One "trial" so the session is a real, summarisable record.
    api.recorder.trial({
      accuracy: 'correct',
      promptLevel: 'A',
      prompted: true,
      targetId: 'reach-envelope',
      chosenId: 'reach-envelope',
      note: `w=${width.toFixed(2)} h=${height.toFixed(2)} asym=${asymmetry.toFixed(2)}`,
    })

    api.setPrompt({ main: 'Your space is set!', sub: 'Now every game fits you' })
    void api.say('All done. Your play space is set up.', {
      main: 'Your space is set!',
      sub: 'Now every game fits you',
    })
    api.clock.after(2200, () => api.finish({ outcome: 'completed' }))
  }

  return {
    requires: 'both',

    difficultySnapshot() {
      return { calibration: true }
    },

    mount(a) {
      api = a
      index = 0
      extremes = []
      bothHands = { left: [], right: [] }
      done = false
      api.setPrompt({ main: 'Let me see how far you can reach', sub: 'Five easy stretches' })
      void api.say(
        'Let us see how far you can reach. Five easy stretches. Only go as far as is comfortable.',
        { main: 'Let me see how far you can reach', sub: 'Five easy stretches' }
      )
      api.clock.after(3200, nextStation)
    },

    update(f) {
      if (done || !station) return
      const { frame, dt, now } = f
      const s = getSettings()
      const pointers = pointersFor(frame, s)
      trail.push(pointers[0])

      // Which pointer is furthest in the station's direction? That is the one
      // making the effort.
      let best = null
      for (const p of pointers) {
        const score =
          station.id === 'left' ? 1 - p.x
            : station.id === 'right' ? p.x
              : station.id === 'up' ? 1 - p.y
                : station.id === 'down' ? p.y
                  : 1 - Math.hypot(p.x - 0.5, p.y - 0.5)
        if (!best || score > best.score) best = { p, score }
      }
      if (!best) {
        hold.step(false, dt)
        return
      }

      // "Reached far enough" is relative to what they have already shown they
      // can do, not to an absolute screen position — that is the whole point.
      const reachedEnough = (() => {
        switch (station.id) {
          case 'left': return best.p.x < 0.34
          case 'right': return best.p.x > 0.66
          case 'up': return best.p.y < 0.34
          case 'down': return best.p.y > 0.66
          default: return Math.hypot(best.p.x - 0.5, best.p.y - 0.5) < 0.2
        }
      })()

      // Stationary counts too: a child who has extended as far as they can and
      // holds still there has finished the stretch even if they never crossed
      // our nominal line.
      const slow = (best.p.hand?.speed ?? 0) < 0.06
      const accept = reachedEnough || (slow && hold.elapsed > 900)

      const r = hold.step(accept, dt)
      if (r.justCompleted) {
        record({ x: best.p.x, y: best.p.y }, best.p.side)
      }
      void now
    },

    render(f) {
      const { view, frame, now } = f
      const s = getSettings()
      const p = pulse(now)

      // Everything recorded so far, plus the live box.
      if (extremes.length >= 2) {
        const xs = extremes.map((e) => e.x)
        const ys = extremes.map((e) => e.y)
        drawReachBox(
          view,
          { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) },
          { label: 'your reach so far' }
        )
      }
      for (const e of extremes) {
        const ctx = view.ctx
        ctx.save()
        ctx.beginPath()
        ctx.arc(view.px(e.x), view.py(e.y), view.pr(0.018), 0, Math.PI * 2)
        ctx.fillStyle = hexA(PALETTE.green, 0.9)
        ctx.fill()
        ctx.restore()
      }

      if (station && !done) {
        drawTarget(
          view,
          {
            id: station.id,
            x: station.x,
            y: station.y,
            radius: 0.11,
            color: 'teal',
            sprite: { kind: 'emoji', value: station.emoji },
          },
          {
            progress: hold?.elapsed ? clamp(hold.elapsed / hold.holdMs, 0, 1) : 0,
            highlight: true,
            pulse: p,
            reducedMotion: s.reducedMotion,
            highContrast: s.highContrast,
          }
        )
      }

      if (done) {
        const prof = loadProfile()
        if (prof.reach) drawReachBox(view, prof.reach, { color: hexA(PALETTE.green, 0.8), label: 'your play space' })
        drawBanner(view, '⭐', { size: 0.16, y: 0.32 })
      }

      if (frame.pose) {
        drawSkeleton(view, frame.pose.lm, POSE_BONES, { color: 'rgba(126,232,255,0.5)', joints: true })
      }
      for (const h of frame.hands) {
        drawSkeleton(view, h.lm, HAND_BONES, {
          color: h.side === 'left' ? 'rgba(46,230,208,0.6)' : 'rgba(255,217,61,0.6)',
        })
        drawHandCursor(view, h, { trail: h === frame.hands[0] ? trail.points : null, reducedMotion: s.reducedMotion })
      }
    },

    unmount() {
      station = null
      done = true
    },
  }
}
