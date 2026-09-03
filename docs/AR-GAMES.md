# Camera Games (AR) — developer & clinical reference

An adaptive, camera-based cognitive-motor learning environment. The child sees
themselves on screen and reaches out to play; MediaPipe turns their hands and
body into the controller. Every interaction deliberately trains one or more
underlying functions rather than merely "touching AR objects".

Live at **`/games/ar`** (hub), `/games/ar/<gameId>` (a game),
`/games/ar/insights` (progress and analysis).

---

## 1. The one idea everything else follows from

**Cognitive accuracy and motor execution speed are never combined.**

A child who touches the right answer after 3.2 seconds is recorded as:

| field | value |
| --- | --- |
| `accuracy` | `correct` |
| `latencyMs` | 1180 — prompt → first intentional movement (the *decision*) |
| `movementTimeMs` | 2020 — movement onset → contact (the *execution*) |
| `pathEfficiency` | 0.71 — straight-line ÷ actual hand path |
| `promptLevel` | `C` |

…never as `FAIL`. A slow but correct answer is not an error anywhere in this
system: not in the score, not in the feedback, not in the adaptive ladder, not
in the dashboard.

Consequences you will see throughout the code:

- there is **no buzzer and no points penalty**. Feedback has exactly three
  classes — correct, *almost* (right answer, imprecise or late), and a neutral
  "let's look again" reset. `playFeedback()` in `engines/base.js` is the only
  place that decides, so a game cannot invent a fourth.
- a response window that expires **while the child is resting on the correct
  answer** records `near`, not `omission`. They knew it; they were too slow.
- the results screen headline is understanding and independence, not points.

Nothing here is a clinical measure. These are descriptive summaries of in-game
behaviour, and the UI says so in plain words. High scores are **not** evidence
that a skill generalises off-screen — that is prompt stage G, checked by a
person, and the game can never award it.

---

## 2. Architecture

```
client/src/ar/
  core/          camera, tracking, clock, rendering, feedback, telemetry, adaptation
  engines/       the 10 interaction primitives + the shared trial machine
  content/       item library, packs, and the stroke font for the tracing games
  catalog/       every game as data: engine + content + domains + life skill
  pages/         the hub, the game route, the insights dashboard
```

### The pipeline

```
camera → MediaPipe → tracker (normalised frame) → engine (game logic)
                                  ↓                      ↓
                            canvas renderer         telemetry
                                                         ↓
                                            adaptive engine ⇄ child profile
```

### Coordinate spaces (`core/geometry.js`)

| space | meaning |
| --- | --- |
| **video** | `[0,1]` as MediaPipe reports it |
| **stage** | `[0,1]` over the visible play area, mirrored so x grows to the *child's* right |
| **pixel** | stage × canvas size, for drawing only |

The video is rendered `object-fit: cover`, so part of the frame is cropped.
`makeStageTransform` reproduces that exact crop — which is why a fingertip
drawn at the child's fingertip actually lands on the target they are reaching
for. Radii are always a fraction of the stage's **shorter** side, and distances
are compared with `aspectDist`, so a circle is a circle in both orientations.

### The game clock (`core/clock.js`)

Every timing decision in every game reads `api.clock`, never
`performance.now()` and never `setTimeout`. That is what makes Pause correct: a
child paused for 40 s mid-reach does not come back to an expired response
window, and their recorded latency excludes the pause. `advance(dt)` is clamped,
so a dropped frame or a GC pause cannot skip a trial.

### The tracker (`core/tracker.js`)

Not a React hook: at 30–60 fps, `setState` per frame would re-render everything
every frame. The tracker owns a mutable `frame` object; the render loop reads it
directly and React only hears about coarse status changes.

- **One-Euro filtering** on every fingertip (`core/filters.js`). Raw landmarks
  wobble 1–2 % of the frame even for a still hand, which would make a child
  "tap" a target they were only hovering near and would destroy the
  path-efficiency and timing metrics.
- **`requestVideoFrameCallback`** where the browser provides it, so we get a
  real capture timestamp and can measure how stale the analysed pixels were.
- **Handedness**: MediaPipe's labels assume a mirrored input; we feed the raw
  frame, so they are swapped by default (`handSwap`). The laterality games open
  with a three-second "raise your right hand" check that auto-corrects it, and
  a therapist can flip it in Settings → Body.

---

## 3. The ten interaction primitives

Every activity is one of these plus content. That is the only way a catalogue
this size stays maintainable — and it is what would let a therapist author a
new activity without touching game code.

| engine | verb | powers |
| --- | --- | --- |
| `tap` | Touch | Find & Touch, Read & Find, Listen & Find, Repair the Sequence, Vanishing Target, Phonics, Number Match, Big/Small, Above/Below, Safe or Not, Where Does It Go, Emotion, What Should I Do, Time of Day, Coins — 20 games |
| `goNoGo` | Touch / Avoid | Pets Only, Rule Switch, Safe Hands |
| `sequence` | Sequence | Simon Reach, Copy the Pattern, Word Builder, Sentence Order, handwashing / toothbrushing / dressing / morning routine / crossing the road |
| `rhythm` | Move on cue | Rhythm Reach |
| `pop` | Reach | Ball Pop, Whole-Body Number Hunt, Reach Near & Far |
| `trace` | Trace | Trace the Road, Air Writing, Shape Drawing, Finger Maze, Pinch & Write |
| `bilateral` | Two hands | Two-Hand Catch, Cross the Middle |
| `pose` | Imitate | Mirror Me, Copy My Gesture, My Space Bubble, Fast or Slow, Follow Two/Three Things |
| `collect` | Grab & carry | Count & Collect, Grocery Mission, Pack My Bag, Money Shop, Sort the Groceries, Laundry Sort, Tidy the Room |
| `cue` | Move / Freeze | Red Light Green Light, Traffic Light Game, Wait For It, Calm Movement |

Plus `calibration` (Set Up My Space) and `mission` (My Whole Day, which chains
seven real sub-games into one session).

### Adding a game

Add an entry to `catalog/games.js`. No new game code:

```js
g({
  id: 'find-shape',
  group: 'look',
  title: 'Find the Shape',
  icon: '🔺',
  how: '"Touch the triangle." Ten shapes, some easy to mix up.',
  engine: 'tap',
  dims: 'discriminate',                       // which difficulty ladder
  domains: ['visualDiscrimination', 'auditoryComprehension'],
  lifeSkill: 'instructions',
  config: {
    trials: 12,
    spriteKind: 'shape',
    makeTrial: askByAttribute({ sets: ['shapes'], attribute: 'shape', noun: 'shape' }),
  },
})
```

`domains` is not decoration: it decides which capability estimates the round
feeds, what the dashboard aggregates, and how the hub groups games. Wrong
domains mean wrong analytics.

### Adding a question type

An `ask*` in `engines/asks.js` is ~20 lines and returns a plain description of
one question. This is where a therapist's "new activity" usually lives.

---

## 4. Adaptive difficulty and prompt fading

Two **independent** ladders, because they are two different things.

**Difficulty** moves along one dimension at a time — target size, then choice
count, then distractor similarity, then reach eccentricity, then response
window — so you can see *which* demand a child is at ceiling on, instead of a
single opaque "level 7". The staircase is deliberately asymmetric: three clean
successes to step up, two genuine errors to step down. `near` is neutral.

**Prompt** fades A → F as the child succeeds *without* needing the help:

| stage | help given |
| --- | --- |
| A | the answer pulses and an animated hand demonstrates the reach |
| B | spoken instruction + a highlight on the answer |
| C | spoken instruction; the highlight appears only briefly |
| D | instruction only |
| E | independent, with closely related wrong answers on screen |
| F | the instruction is a situation: "it is bedtime — what do you need?" |
| G | **real-world transfer, checked by an adult away from the screen** |

Stage G can never be awarded by the game.

`distractors` shifts with the prompt stage as well as with its own dimension,
which is what makes stage E meaningfully harder than stage D on identical
content.

---

## 5. The child capability profile

Deliberately not "easy / medium / hard". Two children with the same diagnosis
can have opposite profiles, and one child can have excellent visual
discrimination alongside a very restricted reach envelope. `core/profile.js`
keeps an independent running estimate per functional domain, plus:

- **the calibrated reach envelope** — the single highest-leverage thing in the
  platform. Run *Set Up My Space* once and every game places its targets inside
  what this child can actually reach. Without it, "peripheral target" silently
  turns a cognitive task into a physical one, and a restricted reach looks like
  poor accuracy.
- **a personal response window**: `personalWindowMs()` derives timeouts from the
  child's own median latency, so a slow-but-accurate child is never timed out on
  someone else's clock.
- dominant hand, inferred from spontaneous use rather than asked.

Accommodations in Settings apply *through* `accommodate()`, so no game can
forget one: large targets, extra time (×1–×4), seated reach, single-hand,
dwell time, calm visuals, high contrast, instruction channel (voice / text /
both).

---

## 6. Data

### What is recorded

Trial-level rows with cognitive and motor columns kept apart — see §1. Plus,
per game family: `timingErrorMs` (rhythm), `coverage` / `traceAccuracy` /
`meanDeviation` / `strayCount` (tracing), `bilateralOffsetMs` /
`usedBothHands` (two-hand), `postureScore` / `holdBreaks` (imitation and
freeze), `crossedMidline`, `stepLatenciesMs`, `pipelineLatencyMs`.

### What is never recorded

**No frame, crop or image is ever captured, stored or uploaded.** MediaPipe runs
entirely in-page; the video element is never read back. Only
landmark-derived numbers leave the device, and only when
`settings.telemetry` is on. Everything works offline: sessions land in a local
ring buffer and `flushPendingSessions()` retries later.

A guardian can erase the whole profile and history from Settings → Data, and the
insights screen has an Erase that also calls `DELETE /api/ar/sessions`.

### Rhythm timing is honest about our own latency

`timingError = contactTime − beatTime`, with the *measured* pipeline lag
subtracted, and `session.pipeline` records exactly what was subtracted
(capture latency source, inference time, delegate, fps) so the number is
auditable rather than a black box. The meaningful output is **variability**
(how consistent the child is), not the median — a constant offset is just an
offset, and part of it is us.

### API

| route | purpose |
| --- | --- |
| `POST /api/ar/session` | upsert one round (idempotent on `clientSessionId`) |
| `POST /api/ar/sessions` | batch retry, tolerant of one bad row |
| `GET /api/ar/sessions` | the caller's rounds, trials excluded |
| `GET /api/ar/session/:id` | one round including trials |
| `GET /api/ar/insights?days=` | per-game / per-domain / per-hand / progression |
| `DELETE /api/ar/sessions` | erase all of the caller's AR telemetry |

Rounds are also mirrored into `StudentRound` and `StudentActivity` so camera
games show up in the child's normal progress alongside the other modules.

---

## 7. No scrolling. Anywhere.

`/games`, `/games/ar`, `/games/ar/insights` and every game are fixed to the
viewport with `overflow: hidden`. A child reaching at a screen must not be able
to shift the play area under their own hand.

This is a hard constraint that shaped the design rather than something bolted
on afterwards:

- the hub **pages** its tiles (8 per page, 4×2 landscape / 2×4 portrait) instead
  of scrolling. Page arrows are also easier for a child to operate than a scroll
  gesture.
- the settings sheet is five small tabs, and switches to two columns on short
  viewports, so no pane ever exceeds the screen.
- the insights dashboard puts exactly three cards per tab, 3×1 or 1×3.
- type scales with `clamp()`, and each surface has an explicit order in which
  optional rows drop out as vertical room runs out.

Verified in Chrome at 320×568, 390×844, 844×390, 820×1180, 1180×820 and
1440×900: every page fits exactly, zero overflow.

---

## 8. Running it

```bash
cd client && npm install && npm run dev     # https://localhost:5173/games/ar
cd server && npm install && npm run dev
```

`npm run dev` and `npm run build` first run `scripts/setup-mediapipe.mjs`, which
vendors the MediaPipe WASM runtime and the two `.task` models into
`public/mediapipe/` (~40 MB, gitignored). Serving them from our own origin means
the first camera frame arrives seconds sooner, the games work on a school
network that blocks the public CDNs, and no third party sees a request the
moment a child opens a game. If the download fails the script exits cleanly and
`core/assets.js` falls back to the CDN at runtime.

`VITE_MEDIAPIPE_WASM_URL` / `VITE_MEDIAPIPE_MODEL_BASE` pin a private mirror for
an air-gapped deployment.

**HTTPS is required** for camera access — the dev server already uses
`@vitejs/plugin-basic-ssl`.

### Verification

The AR layer is covered by three headless suites plus a browser pass (see the
commit for the scripts):

- every `ask*` × 60 difficulty combinations → a well-formed trial (answer among
  the options, ≥2 options, something to read or hear)
- all 69 catalogue entries mount and survive 3200 synthetic frames with a moving
  hand and a visible body, including a pause/resume mid-run
- 1920 layout combinations → zero overlapping targets, zero off-screen
- 76 tracing glyphs stay inside their box
- content invariants: unique ids, one visual per item, digits ↔ quantities
  aligned, every food has a store bin, every gesture has a valid posture, no ZWJ
  or skin-tone emoji

---

## 9. Known limits, stated plainly

- **Haptics.** `navigator.vibrate` works on Android. iOS Safari has no vibration
  API, so we fall back to a paired game controller's actuator, then to a
  sub-bass audio pulse that is genuinely felt on a hand-held tablet. Settings →
  Sound reports which channel this device actually has.
- **Speech recognition is not used.** Every voice interaction is
  system-to-child (text-to-speech). Children with communication difficulties are
  poorly served by general ASR, and MediaPipe's audio API is classification, not
  speech-to-text. Every prompt has a non-verbal alternative.
- **No emotion detection from faces.** Facial movement is not a reliable measure
  of an internal state, so we never tell a child what they are feeling. Emotion
  work is scenario-based: the *situation* supplies the answer.
- **`spin` in the instruction games** is verified by shoulder width narrowing —
  a proxy, since a single camera cannot see a full turn.
- **Clean/dirty** ships as "does it need washing?", because clean and dirty are
  states a single picture cannot show, and an unanswerable question is worse
  than a differently-framed one.
- **Nothing here is validated as an assessment.** The metrics are descriptive.
  Treating movement smoothness as a diagnosis would be wrong, and the dashboard
  says so where a reader will see it.
