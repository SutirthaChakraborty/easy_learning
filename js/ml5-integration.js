/**
 * Easy Learn — ml5.js AI Integration
 * Futuresight Analytics Limited
 *
 * Wraps ml5.js features:
 *  - Sound Classifier (Teachable Machine phonics checker)
 *  - HandPose (letter air-trace game)
 *  - Face API (emotion-aware difficulty)
 *
 * ⚠️  ml5.js is loaded lazily from CDN — only when an AI feature
 *     is first activated. This keeps page load fast.
 *
 * Requires: ml5.js v1 (loaded at runtime)
 * CDN: https://unpkg.com/ml5@1/dist/ml5.min.js
 */

// ─── Feature Flags ────────────────────────────────────────────────────────────

const AI_FEATURES = {
  soundClassifier: true,   // Teachable Machine phonics
  handPose       : true,   // Air-trace letter game
  faceApi        : false,  // Emotion detection (privacy-sensitive — off by default)
};

// ─── ml5 Loader ───────────────────────────────────────────────────────────────

let ml5Loaded = false;

async function loadMl5() {
  if (ml5Loaded || window.ml5) {
    ml5Loaded = true;
    return;
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src   = 'https://unpkg.com/ml5@1/dist/ml5.min.js';
    script.onload  = () => { ml5Loaded = true; console.log('🤖 ml5.js loaded'); resolve(); };
    script.onerror = () => reject(new Error('Failed to load ml5.js from CDN'));
    document.head.appendChild(script);
  });
}

// ─── Sound Classifier (Teachable Machine) ─────────────────────────────────────

export const PhonicsChecker = {
  classifier: null,
  isListening: false,
  onResult: null, // callback(label, confidence)

  /**
   * Initialise the sound classifier from a Teachable Machine model URL.
   * @param {string} modelURL — path to your Teachable Machine model folder
   *   e.g. 'models/phonics-sound/' — must contain model.json + metadata.json
   */
  async init(modelURL = 'models/phonics-sound/') {
    if (!AI_FEATURES.soundClassifier) return;
    await loadMl5();

    this.classifier = await new Promise((resolve) => {
      const c = window.ml5.soundClassifier(modelURL, { probabilityThreshold: 0.7 }, () => resolve(c));
    });

    console.log('🎙️ Phonics sound classifier ready');
  },

  /**
   * Start listening and call onResult with every classified label.
   * @param {function} callback — (label: string, confidence: number) => void
   */
  startListening(callback) {
    if (!this.classifier) {
      console.warn('PhonicsChecker: not initialised. Call init() first.');
      return;
    }
    this.onResult   = callback;
    this.isListening = true;

    this.classifier.classify((error, results) => {
      if (error) { console.error(error); return; }
      if (!this.isListening) return;
      const top = results[0];
      if (top && this.onResult) {
        this.onResult(top.label, top.confidence);
      }
    });
  },

  stopListening() {
    this.isListening = false;
  },
};

// ─── HandPose — Air-Trace Letter Game ─────────────────────────────────────────

export const HandTracker = {
  handpose     : null,
  videoEl      : null,
  canvasEl     : null,
  ctx          : null,
  isTracking   : false,
  trailPoints  : [],         // Array of {x, y} — the drawn trail
  onHandUpdate : null,       // callback(landmarks)

  /**
   * @param {HTMLVideoElement} videoEl — webcam stream
   * @param {HTMLCanvasElement} canvasEl — overlay canvas for drawing
   */
  async init(videoEl, canvasEl) {
    if (!AI_FEATURES.handPose) return;
    await loadMl5();

    this.videoEl  = videoEl;
    this.canvasEl = canvasEl;
    this.ctx      = canvasEl.getContext('2d');

    // Start webcam
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoEl.srcObject = stream;
    await videoEl.play();

    // ml5 HandPose
    this.handpose = await new Promise((resolve) => {
      const hp = window.ml5.handPose(videoEl, { flipped: true }, () => resolve(hp));
    });

    // Start detection loop
    this.handpose.on('predict', (results) => {
      if (!this.isTracking) return;
      this._drawHands(results);
      if (this.onHandUpdate) this.onHandUpdate(results);

      // Record index fingertip position for trail
      if (results.length > 0) {
        const tip = results[0].landmarks[8]; // Index fingertip
        if (tip) {
          this.trailPoints.push({ x: tip[0], y: tip[1] });
          if (this.trailPoints.length > 80) this.trailPoints.shift(); // Keep last 80 points
        }
      }
    });

    console.log('✋ HandPose ready');
  },

  startTracking() { this.isTracking = true;  this.trailPoints = []; },
  stopTracking()  { this.isTracking = false; },

  clearTrail() { this.trailPoints = []; },

  _drawHands(predictions) {
    const { ctx, canvasEl } = this;
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    predictions.forEach((pred) => {
      const landmarks = pred.landmarks;

      // Draw skeleton connections
      const connections = [
        [0,1],[1,2],[2,3],[3,4],       // Thumb
        [0,5],[5,6],[6,7],[7,8],       // Index
        [0,9],[9,10],[10,11],[11,12],  // Middle
        [0,13],[13,14],[14,15],[15,16],// Ring
        [0,17],[17,18],[18,19],[19,20],// Pinky
      ];

      ctx.strokeStyle = 'rgba(108, 99, 255, 0.8)';
      ctx.lineWidth   = 2;
      connections.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(landmarks[a][0], landmarks[a][1]);
        ctx.lineTo(landmarks[b][0], landmarks[b][1]);
        ctx.stroke();
      });

      // Draw joints
      landmarks.forEach((pt, i) => {
        ctx.fillStyle = i === 8 ? '#ff6584' : 'rgba(108, 99, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], i === 8 ? 8 : 4, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Draw trail
    if (this.trailPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.trailPoints[0].x, this.trailPoints[0].y);
      this.trailPoints.forEach((pt) => ctx.lineTo(pt.x, pt.y));
      ctx.strokeStyle = 'rgba(255, 101, 132, 0.8)';
      ctx.lineWidth   = 4;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.stroke();
    }
  },

  /**
   * Compare the recorded trail against a reference letter path.
   * Returns a similarity score 0–1.
   * @param {Array<{x,y}>} referencePath
   */
  scoreAgainstPath(referencePath) {
    if (!this.trailPoints.length || !referencePath.length) return 0;

    // Simple bounding-box normalisation + point distance scoring
    const normalise = (pts) => {
      const xs = pts.map((p) => p.x);
      const ys = pts.map((p) => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const rangeX = maxX - minX || 1;
      const rangeY = maxY - minY || 1;
      return pts.map((p) => ({ x: (p.x - minX) / rangeX, y: (p.y - minY) / rangeY }));
    };

    const trail = normalise(this.trailPoints);
    const ref   = normalise(referencePath);

    // Sample 20 evenly-spaced points from each
    const sample = (arr, n) =>
      Array.from({ length: n }, (_, i) => arr[Math.floor((i / n) * arr.length)]);

    const tSampled = sample(trail, 20);
    const rSampled = sample(ref,   20);

    const totalDist = tSampled.reduce((sum, pt, i) => {
      const dx = pt.x - rSampled[i].x;
      const dy = pt.y - rSampled[i].y;
      return sum + Math.sqrt(dx * dx + dy * dy);
    }, 0);

    const avgDist = totalDist / 20;
    return Math.max(0, 1 - avgDist * 2); // Score 0–1
  },
};

// ─── Face API — Emotion-Aware Adaptation ──────────────────────────────────────

export const EmotionDetector = {
  detector        : null,
  videoEl         : null,
  isRunning       : false,
  frustrationCount: 0,
  onFrustration   : null, // callback() — fired after sustained frustration

  async init(videoEl) {
    if (!AI_FEATURES.faceApi) return;
    await loadMl5();

    this.videoEl = videoEl;

    this.detector = await new Promise((resolve) => {
      const fd = window.ml5.faceApi(
        videoEl,
        { withLandmarks: true, withExpressions: true },
        () => resolve(fd)
      );
    });

    console.log('😊 EmotionDetector ready');
  },

  startDetecting(onFrustration) {
    if (!this.detector) return;
    this.onFrustration    = onFrustration;
    this.isRunning        = true;
    this.frustrationCount = 0;
    this._detect();
  },

  stopDetecting() {
    this.isRunning = false;
  },

  _detect() {
    if (!this.isRunning) return;

    this.detector.detect((err, results) => {
      if (err || !results.length) {
        setTimeout(() => this._detect(), 2000);
        return;
      }

      const expressions = results[0].expressions;
      const isFrustrated =
        (expressions.angry || 0) > 0.4 ||
        (expressions.disgusted || 0) > 0.35 ||
        (expressions.sad || 0) > 0.5;

      if (isFrustrated) {
        this.frustrationCount++;
        // Fire callback after ~10 seconds of sustained frustration (5 detections × 2s)
        if (this.frustrationCount >= 5 && this.onFrustration) {
          this.onFrustration();
          this.frustrationCount = 0; // Reset — don't spam
        }
      } else {
        this.frustrationCount = Math.max(0, this.frustrationCount - 1);
      }

      setTimeout(() => this._detect(), 2000); // Check every 2 seconds
    });
  },
};

// ─── XP Float Effect ──────────────────────────────────────────────────────────

/**
 * Show a floating "+XP" text animation from a source element.
 * @param {HTMLElement} sourceEl — element to float up from
 * @param {number} xp — XP amount to display
 */
export function showXPFloat(sourceEl, xp) {
  const rect  = sourceEl.getBoundingClientRect();
  const float = document.createElement('div');
  float.className = 'xp-float';
  float.textContent = `+${xp} XP`;
  float.style.cssText = `
    position: fixed;
    left: ${rect.left + rect.width / 2}px;
    top: ${rect.top}px;
    transform: translate(-50%, 0);
    pointer-events: none;
    z-index: 9999;
    font-weight: 900;
    font-size: 1.2rem;
    color: #43e97b;
    text-shadow: 0 2px 8px rgba(0,0,0,0.4);
    animation: xpFloat 1.2s ease-out forwards;
  `;
  document.body.appendChild(float);
  setTimeout(() => float.remove(), 1300);
}

// ─── Screen Shake ─────────────────────────────────────────────────────────────

/**
 * Apply a CSS screen shake effect on wrong answer.
 */
export function screenShake() {
  document.body.classList.add('screen-shake');
  setTimeout(() => document.body.classList.remove('screen-shake'), 500);
}
