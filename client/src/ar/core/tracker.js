/**
 * Camera + MediaPipe detection loop, producing one normalized "frame" object
 * per animation tick in STAGE space (see geometry.js).
 *
 * Deliberately not a React hook internally: at 30-60 fps, setState per frame
 * would re-render every game on every frame. Instead the tracker owns a mutable
 * `frame` object; the render loop and game logic read it directly, and React
 * only hears about coarse status changes (loading / ready / error).
 */
import { getHandLandmarker, getPoseLandmarker, HAND, POSE } from './vision'
import { makeStageTransform, clamp, aspectDist } from './geometry'
import { PointFilter, Holder } from './filters'

const HAND_KEYS = ['left', 'right']

function emptyFrame() {
  return {
    t: 0,
    dt: 0,
    fps: 0,
    detectMs: 0,
    captureLatencyMs: null,
    latencyMs: 60,
    hands: [],
    left: null,
    right: null,
    primary: null,
    pose: null,
    bodyPresent: false,
    stage: { w: 0, h: 0 },
    handsSwapped: true,
    frames: 0,
  }
}

/** Per-hand smoothing state, kept across frames so filters have history. */
function makeHandState() {
  return {
    tip: new PointFilter({ minCutoff: 1.6, beta: 0.05 }),
    palm: new PointFilter({ minCutoff: 1.1, beta: 0.03 }),
    wrist: new PointFilter({ minCutoff: 1.1, beta: 0.03 }),
    holder: new Holder(240),
    pinchHigh: false,
    lastSeen: -Infinity,
  }
}

export class ARTracker {
  constructor(options = {}) {
    this.opts = {
      tracking: 'hand', // 'hand' | 'pose' | 'both'
      mirror: true,
      handSwap: true, // MediaPipe handedness assumes a mirrored frame; ours is raw.
      maxHands: 2,
      targetFps: 60,
      width: 960,
      height: 720,
      ...options,
    }

    this.frame = emptyFrame()
    this.frame.handsSwapped = this.opts.handSwap
    this.status = 'idle' // idle | starting | ready | paused | error
    this.error = null

    this.video = null
    this.stream = null
    this.hand = null
    this.pose = null

    this.stageSize = { w: 0, h: 0 }
    this.transform = makeStageTransform(0, 0, 0, 0, this.opts.mirror)

    this._listeners = new Set()
    this._statusListeners = new Set()
    this._running = false
    this._paused = false
    this._rafId = null
    this._vfcId = null
    this._lastVideoTime = -1
    this._lastTick = 0
    this._fpsWindow = []
    this._captureLatencySamples = []
    this._detectSamples = []
    this._handState = { left: makeHandState(), right: makeHandState() }
    this._poseHolder = new Holder(320)
    this._boundLoop = this._loop.bind(this)
  }

  // ── subscriptions ──────────────────────────────────────────────────────────
  /** Called on every produced frame. Keep the callback cheap. */
  onFrame(fn) {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }

  onStatus(fn) {
    this._statusListeners.add(fn)
    fn(this.status, this.error)
    return () => this._statusListeners.delete(fn)
  }

  _setStatus(status, error = null) {
    if (this.status === status && this.error === error) return
    this.status = status
    this.error = error
    for (const fn of this._statusListeners) {
      try {
        fn(status, error)
      } catch (e) {
        console.error('[ar] status listener threw', e)
      }
    }
  }

  // ── lifecycle ──────────────────────────────────────────────────────────────
  setStageSize(w, h) {
    if (this.stageSize.w === w && this.stageSize.h === h) return
    this.stageSize = { w, h }
    this._rebuildTransform()
  }

  _rebuildTransform() {
    const vw = this.video?.videoWidth || 0
    const vh = this.video?.videoHeight || 0
    this.transform = makeStageTransform(
      vw,
      vh,
      this.stageSize.w,
      this.stageSize.h,
      this.opts.mirror
    )
    this.frame.stage = { ...this.stageSize }
  }

  setHandSwap(swap) {
    this.opts.handSwap = swap
    this.frame.handsSwapped = swap
  }

  /**
   * @param {HTMLVideoElement} video an element already in the DOM (muted, playsInline)
   */
  async start(video) {
    if (this._running) return
    this.video = video
    this._running = true
    this._setStatus('starting')

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('CAMERA_UNSUPPORTED')
      }

      // Ask for the orientation the screen is actually in. A phone held upright
      // will usually hand back a genuinely portrait stream — its sensor is
      // physically rotated — which fills far more of the screen than a
      // landscape frame letterboxed into a tall window.
      //
      // These are `ideal`, never `exact`, on purpose: a device that has only
      // landscape modes must be free to ignore the request and give us its full
      // frame rather than crop its sensor to satisfy us. Whatever comes back,
      // `object-fit: contain` and the canvas fitted to it mean the whole frame
      // is shown and nothing is thrown away — this only decides how much of the
      // screen the picture gets to fill.
      const portrait =
        typeof window !== 'undefined' && window.innerHeight > window.innerWidth
      const longSide = Math.max(this.opts.width, this.opts.height)
      const shortSide = Math.min(this.opts.width, this.opts.height)

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: portrait ? shortSide : longSide },
          height: { ideal: portrait ? longSide : shortSide },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      })

      if (!this._running) {
        this.stream.getTracks().forEach((t) => t.stop())
        return
      }

      video.srcObject = this.stream
      video.muted = true
      video.playsInline = true
      await video.play()
      await new Promise((res) => {
        if (video.videoWidth) return res()
        video.onloadedmetadata = () => res()
      })
      this._rebuildTransform()

      const needHand = this.opts.tracking !== 'pose'
      const needPose = this.opts.tracking !== 'hand'
      const [handRes, poseRes] = await Promise.all([
        needHand ? getHandLandmarker({ numHands: this.opts.maxHands }) : null,
        needPose ? getPoseLandmarker() : null,
      ])
      if (!this._running) return
      this.hand = handRes?.task || null
      this.pose = poseRes?.task || null
      this.delegate = handRes?.delegate || poseRes?.delegate || 'CPU'

      this._setStatus('ready')
      this._scheduleNext()
    } catch (err) {
      this._running = false
      const code =
        err?.name === 'NotAllowedError'
          ? 'CAMERA_DENIED'
          : err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError'
            ? 'CAMERA_MISSING'
            : err?.message === 'CAMERA_UNSUPPORTED'
              ? 'CAMERA_UNSUPPORTED'
              : 'MODEL_FAILED'
      console.error('[ar] tracker start failed:', err)
      this._setStatus('error', code)
    }
  }

  pause() {
    if (!this._running || this._paused) return
    this._paused = true
    this._setStatus('paused')
    // Keep the camera track live: re-acquiring getUserMedia on every resume
    // costs ~1 s and re-prompts on some browsers.
  }

  resume() {
    if (!this._running || !this._paused) return
    this._paused = false
    this._lastVideoTime = -1
    this._lastTick = 0
    for (const k of HAND_KEYS) {
      this._handState[k].tip.reset()
      this._handState[k].palm.reset()
      this._handState[k].wrist.reset()
      this._handState[k].holder.clear()
    }
    this._poseHolder.clear()
    this._setStatus('ready')
    this._scheduleNext()
  }

  stop() {
    this._running = false
    this._paused = false
    if (this._rafId != null) cancelAnimationFrame(this._rafId)
    if (this._vfcId != null && this.video?.cancelVideoFrameCallback) {
      this.video.cancelVideoFrameCallback(this._vfcId)
    }
    this._rafId = null
    this._vfcId = null
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
    if (this.video) {
      this.video.srcObject = null
      this.video = null
    }
    // The landmarkers are shared singletons — never closed here.
    this.hand = null
    this.pose = null
    this._listeners.clear()
    this._statusListeners.clear()
    this._setStatus('idle')
  }

  // ── the loop ───────────────────────────────────────────────────────────────
  _scheduleNext() {
    if (!this._running || this._paused) return
    const v = this.video
    if (v?.requestVideoFrameCallback) {
      // Frame-accurate: gives us the real capture timestamp, which is what makes
      // the rhythm game's timing error meaningful instead of measuring our own
      // pipeline lag.
      this._vfcId = v.requestVideoFrameCallback((now, meta) => this._boundLoop(now, meta))
    } else {
      this._rafId = requestAnimationFrame((now) => this._boundLoop(now, null))
    }
  }

  _loop(now, meta) {
    if (!this._running || this._paused) return
    const video = this.video
    if (!video || video.readyState < 2) {
      this._scheduleNext()
      return
    }

    const dt = this._lastTick ? (now - this._lastTick) / 1000 : 1 / 30
    this._lastTick = now

    this._fpsWindow.push(now)
    while (this._fpsWindow.length && now - this._fpsWindow[0] > 1000) this._fpsWindow.shift()

    // Capture latency: how stale the pixels we are about to analyse already are.
    let captureLatency = null
    if (meta && Number.isFinite(meta.captureTime)) {
      captureLatency = clamp(now - meta.captureTime, 0, 400)
    } else if (meta && Number.isFinite(meta.presentationTime)) {
      captureLatency = clamp(now - meta.presentationTime, 0, 400)
    }
    if (captureLatency != null) {
      this._captureLatencySamples.push(captureLatency)
      if (this._captureLatencySamples.length > 90) this._captureLatencySamples.shift()
    }

    // MediaPipe rejects a repeated timestamp; skip when the camera has not
    // produced a new frame yet (common when display refresh > camera fps).
    const vt = video.currentTime
    const isNewVideoFrame = vt !== this._lastVideoTime
    if (isNewVideoFrame) {
      this._lastVideoTime = vt
      const ts = Math.round(now)
      const t0 = performance.now()
      try {
        if (this.hand) this._ingestHands(this.hand.detectForVideo(video, ts), now)
        if (this.pose) this._ingestPose(this.pose.detectForVideo(video, ts), now)
      } catch (err) {
        // A single bad inference should not kill the game.
        console.warn('[ar] detect failed for one frame:', err?.message || err)
      }
      const detectMs = performance.now() - t0
      this._detectSamples.push(detectMs)
      if (this._detectSamples.length > 60) this._detectSamples.shift()
    }

    this._composeFrame(now, dt)

    for (const fn of this._listeners) {
      try {
        fn(this.frame)
      } catch (e) {
        console.error('[ar] frame listener threw', e)
      }
    }

    this._scheduleNext()
  }

  // ── hand ingestion ─────────────────────────────────────────────────────────
  _ingestHands(result, now) {
    const seen = { left: false, right: false }
    const lists = result?.landmarks || []
    const handedness = result?.handedness || result?.handednesses || []

    for (let i = 0; i < lists.length; i++) {
      const lm = lists[i]
      if (!lm || lm.length < 21) continue
      const cat = handedness[i]?.[0]
      const rawLabel = cat?.category_name || cat?.categoryName || 'Right'
      const score = cat?.score ?? 0.5

      // MediaPipe's handedness assumes a mirrored (selfie-flipped) input. We
      // feed the raw frame, so by default the label refers to the opposite
      // hand. `handSwap` is auto-calibrated by the laterality games and
      // therapist-overridable in settings.
      let side = rawLabel.toLowerCase() === 'left' ? 'left' : 'right'
      if (this.opts.handSwap) side = side === 'left' ? 'right' : 'left'
      if (seen[side]) side = side === 'left' ? 'right' : 'left' // never two "left" hands
      if (seen[side]) continue
      seen[side] = true

      const st = this._handState[side]
      const dtSec = st.lastSeen === -Infinity ? 1 / 30 : Math.max((now - st.lastSeen) / 1000, 1 / 240)
      st.lastSeen = now

      const T = this.transform
      const stagePts = lm.map((p) => {
        const s = T.toStage(p.x, p.y)
        return { x: s.x, y: s.y, z: p.z ?? 0, visibility: p.visibility ?? 1 }
      })

      const tip = st.tip.filter(stagePts[HAND.INDEX_TIP], dtSec)
      const wrist = st.wrist.filter(stagePts[HAND.WRIST], dtSec)
      const palmRaw = {
        x: (stagePts[HAND.INDEX_MCP].x + stagePts[HAND.PINKY_MCP].x + stagePts[HAND.WRIST].x) / 3,
        y: (stagePts[HAND.INDEX_MCP].y + stagePts[HAND.PINKY_MCP].y + stagePts[HAND.WRIST].y) / 3,
      }
      const palm = st.palm.filter(palmRaw, dtSec)

      const { w, h } = this.stageSize
      // Hand span (wrist → middle MCP) is our scale reference, so pinch and
      // gesture thresholds work the same for a small child close to the camera
      // and a taller one further back.
      const span =
        aspectDist(stagePts[HAND.WRIST], stagePts[HAND.MIDDLE_MCP], w, h) || 0.12

      const pinchRaw = aspectDist(stagePts[HAND.THUMB_TIP], stagePts[HAND.INDEX_TIP], w, h) / span
      // 0 = fully pinched, 1 = wide open; hysteresis stops flicker at the edge.
      const pinch = clamp(1 - pinchRaw / 1.05, 0, 1)
      if (st.pinchHigh) st.pinchHigh = pinch > 0.45
      else st.pinchHigh = pinch > 0.65

      const extended = countExtendedFingers(stagePts, w, h, span)
      const openness = clamp(extended.count / 5, 0, 1)

      const hand = {
        side,
        score,
        rawLabel,
        lm: stagePts,
        tip,
        palm,
        wrist,
        span,
        pinch,
        pinching: st.pinchHigh,
        openness,
        fingers: extended.flags,
        gesture: classifyGesture(extended, st.pinchHigh),
        velocity: { ...st.tip.velocity },
        speed: Math.hypot(st.tip.velocity.x, st.tip.velocity.y),
        t: now,
      }
      st.holder.push(hand, now)
    }

    for (const k of HAND_KEYS) if (!seen[k]) this._handState[k].holder.get(now)
  }

  // ── pose ingestion ─────────────────────────────────────────────────────────
  _ingestPose(result, now) {
    const lm = result?.landmarks?.[0]
    if (!lm || lm.length < 33) return
    const T = this.transform
    const pts = lm.map((p) => {
      const s = T.toStage(p.x, p.y)
      return { x: s.x, y: s.y, z: p.z ?? 0, visibility: p.visibility ?? 1 }
    })
    // Mirroring swaps which physical side each landmark index belongs to. Remap
    // so `pose.lm[POSE.LEFT_WRIST]` really is the child's left wrist.
    const remapped = this.opts.mirror ? mirrorPoseSides(pts) : pts

    const keyJoints = [
      POSE.LEFT_SHOULDER, POSE.RIGHT_SHOULDER, POSE.LEFT_HIP, POSE.RIGHT_HIP,
      POSE.LEFT_WRIST, POSE.RIGHT_WRIST, POSE.NOSE,
    ]
    const visible =
      keyJoints.reduce((s, i) => s + (remapped[i]?.visibility > 0.5 ? 1 : 0), 0) / keyJoints.length

    const hipMid = mid(remapped[POSE.LEFT_HIP], remapped[POSE.RIGHT_HIP])
    const shoulderMid = mid(remapped[POSE.LEFT_SHOULDER], remapped[POSE.RIGHT_SHOULDER])
    const { w, h } = this.stageSize
    const shoulderWidth = aspectDist(
      remapped[POSE.LEFT_SHOULDER],
      remapped[POSE.RIGHT_SHOULDER],
      w,
      h
    )

    this._poseHolder.push(
      {
        lm: remapped,
        world: result.worldLandmarks?.[0] || null,
        visible,
        hipMid,
        shoulderMid,
        shoulderWidth,
        // Body midline in stage space — "cross the midline" games need this.
        midline: shoulderMid.x,
        t: now,
      },
      now
    )
  }

  // ── frame assembly ─────────────────────────────────────────────────────────
  _composeFrame(now, dt) {
    const f = this.frame
    f.t = now
    f.dt = dt
    f.frames++
    f.fps = this._fpsWindow.length
    f.detectMs = avg(this._detectSamples)
    f.captureLatencyMs = this._captureLatencySamples.length
      ? avg(this._captureLatencySamples)
      : null
    // Best available estimate of stimulus-shown → contact-registered lag: how
    // stale the analysed pixels were + inference + one display frame.
    f.latencyMs = Math.round((f.captureLatencyMs ?? 45) + f.detectMs + 1000 / Math.max(f.fps, 30))
    f.stage = { ...this.stageSize }
    f.handsSwapped = this.opts.handSwap

    const left = this._handState.left.holder.get(now)
    const right = this._handState.right.holder.get(now)
    f.left = left
    f.right = right
    f.hands = [left, right].filter(Boolean)
    // Primary pointer = the hand moving with intent, else the visible one.
    f.primary =
      f.hands.length === 2
        ? f.hands.reduce((a, b) => (b.speed > a.speed * 1.25 ? b : a))
        : f.hands[0] || null

    const pose = this._poseHolder.get(now)
    f.pose = pose
    f.bodyPresent = Boolean(pose && pose.visible >= 0.5)

    return f
  }

  /** Median inference cost + capture lag, for the telemetry record. */
  latencyReport() {
    return {
      captureLatencyMs: this._captureLatencySamples.length
        ? Math.round(avg(this._captureLatencySamples))
        : null,
      detectMs: Math.round(avg(this._detectSamples) * 10) / 10,
      estimatedPipelineMs: this.frame.latencyMs,
      fps: this.frame.fps,
      delegate: this.delegate || null,
      captureTimestampSource: this._captureLatencySamples.length ? 'videoFrameCallback' : 'estimated',
    }
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────
const avg = (a) => (a.length ? a.reduce((s, n) => s + n, 0) / a.length : 0)
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

/**
 * A finger counts as extended when its tip is further from the wrist than its
 * PIP joint by a clear margin. Scale-invariant thanks to `span`.
 */
function countExtendedFingers(lm, w, h, span) {
  const wrist = lm[HAND.WRIST]
  const spec = [
    ['thumb', HAND.THUMB_TIP, HAND.THUMB_MCP],
    ['index', HAND.INDEX_TIP, HAND.INDEX_PIP],
    ['middle', HAND.MIDDLE_TIP, HAND.MIDDLE_PIP],
    ['ring', HAND.RING_TIP, HAND.RING_PIP],
    ['pinky', HAND.PINKY_TIP, HAND.PINKY_PIP],
  ]
  const flags = {}
  let count = 0
  for (const [name, tipIdx, pipIdx] of spec) {
    const tipD = aspectDist(lm[tipIdx], wrist, w, h) / span
    const pipD = aspectDist(lm[pipIdx], wrist, w, h) / span
    const up = tipD > pipD * (name === 'thumb' ? 1.02 : 1.08)
    flags[name] = up
    if (up) count++
  }
  return { flags, count }
}

function classifyGesture({ flags, count }, pinching) {
  if (pinching) return 'pinch'
  if (count === 0) return 'fist'
  if (count >= 4) return 'open'
  if (flags.index && !flags.middle && !flags.ring && !flags.pinky) return 'point'
  if (flags.thumb && count === 1) return 'thumbUp'
  if (flags.index && flags.middle && !flags.ring && !flags.pinky) return 'peace'
  return 'unknown'
}

/**
 * With a mirrored display, MediaPipe's LEFT_* indices land on the child's right
 * side of the screen. Swap the paired indices so downstream code can trust the
 * names.
 */
const POSE_PAIRS = [
  [1, 4], [2, 5], [3, 6], [7, 8], [9, 10],
  [11, 12], [13, 14], [15, 16], [17, 18], [19, 20], [21, 22],
  [23, 24], [25, 26], [27, 28], [29, 30], [31, 32],
]

function mirrorPoseSides(pts) {
  const out = pts.slice()
  for (const [a, b] of POSE_PAIRS) {
    const tmp = out[a]
    out[a] = out[b]
    out[b] = tmp
  }
  return out
}
