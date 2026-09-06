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

There is now a **third** system sitting on top of these two — the visible
five-level journey in §5. It leaves prompt fading completely alone, but it does
bound the difficulty staircase: the staircase no longer roams the whole range of
every dimension, only the band the child's current level allows. Read §5 before
interpreting any difficulty number, because a stored staircase position is now a
preference *inside* a band rather than an absolute.

---

## 5. Journey, levels and points

Three systems decide how hard a trial is and what it is worth. They compose, and
a reader who has understood only two of them will misread every number in the
app.

| system | who sees it | what it moves | what moves it |
| --- | --- | --- | --- |
| **level** (`core/journey.js`) | the child: chosen, shown as five pips, celebrated | a floor **and** a ceiling on every dimension the game declares — an *envelope* | clearing a level, by comprehension |
| **staircase** (`core/adaptive.js`) | nobody, deliberately | one dimension at a time, **inside** the current level's envelope | three clean successes up, two genuine errors down |
| **prompt stage** (A–G) | an adult, in the HUD and the dashboard | how much help is given, on identical content | five of the last six answered independently → fade; two errors → restore |

The level decides the band, the staircase tunes within the band, and prompt
fading is orthogonal to both — any stage can occur at any level. So "level 3" is
not a difficulty setting the way "Medium" is. It is the promise that no trial
this round is easier than the level-3 floor or harder than the level-4 floor,
which is what `bandFor()` in `adaptive.js` clamps every trial to. A child on
level 4 having a bad run therefore gets *easier level-4 trials*, never level-1
trials, and a child who is flying gets a taste of level 5 without leaving the
level they chose.

Settings → Help → Difficulty: **Fixed** collapses the envelope to a point (floor
= ceiling = the chosen level's plan) and is the only way to stop the staircase
moving at all. It is the therapist taking the wheel, and it overrides the child's
choice on **both** counts: `resolveLevel()` returns `settings.fixedLevel` before
it looks at the requested level or at the unlock, so the round is played at that
level *and judged against that level's bar*, and a pass writes an ordinary clear
with the levels below it backfilled. The in-game level picker is shown
non-interactive while it is on, and the intro reads "Set in settings".

That is the coherent choice — crediting level-5 work against level 1's 55 % bar
would be worse — but it has a consequence worth stating: **fixed mode can unlock
levels the child never climbed to**, including levels above their current one,
because the adult asserted the level and the child met its bar. The uploaded
round records `settingsSnapshot.difficultyMode` and `level`, so a clear made this
way is identifiable after the fact; it is not distinguishable from a
self-chosen clear by `clearedBy` alone.

### How a level plan is derived

Not five presets per game: 69 games × 5 hand-written presets is 345 of them, and
they would drift out of step with the engines within a week. A plan is computed
from what the catalogue already declares.

1. Each dimension in the game's rotation (`DIMS[…]` in `catalog/games.js` — the
   same order the staircase rotates through) has **room**: the number of steps
   between the game's declared `start` index and the end of that dimension's
   value list in `DIMENSIONS`.
2. A level gets a **budget** of `round(fraction × total room)`, with fractions
   `[0, 0.2, 0.42, 0.68, 1]`.
3. The budget is spent **round-robin** through the rotation — one step on the
   first dimension, one on the second, … and round again — so no single demand
   runs far ahead of the others. That is the staircase's own rule applied to the
   envelope. Leftover budget lands on whichever dimensions come first in the
   rotation, which is why the first dimension can sit a step ahead at level 4.

Two consequences worth stating plainly: **level 1 is always exactly the game's
declared starting point** (budget 0), and **level 5 always has every dimension
at its ceiling** (budget = total room), so a journey genuinely ends somewhere and
adding a value to a dimension in `DIMENSIONS` raises every game's level 5
automatically.

`levelBounds()` then sets the ceiling to the *next* level's floor — the absolute
maximum at level 5. `levelChange(game, level)` diffs two consecutive plans and
phrases what moved in child words ("smaller targets · more to choose from")
rather than a per-game string, so the copy on the tile cannot drift out of step
with what the engine will actually do.

| level | name | icon | comprehension needed to clear |
| --- | --- | --- | --- |
| 1 | First Steps | 🌱 | 55 % |
| 2 | Warming Up | 🌿 | 60 % |
| 3 | Getting Good | 🌟 | 65 % |
| 4 | Strong | 💪 | 70 % |
| 5 | Champion | 🏆 | 75 % |

### Worked example: Find & Touch

`find-touch-colour` uses the `discriminate` rotation — `targetSize`, `choices`,
`distractors`, `eccentricity`, `window` — and declares no `start` overrides, so
every dimension begins at index 0. Room is 5 + 5 + 4 + 4 + 5 = **23** steps,
giving budgets of 0, 5, 10, 16 and 23:

| level | indices | target radius | choices | distractors | reach | response window |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 0 0 0 0 | 0.155 | 2 | none | 0.40 | unlimited |
| 2 | 1 1 1 1 1 | 0.135 | 2 | unrelated | 0.55 | unlimited |
| 3 | 2 2 2 2 2 | 0.115 | 3 | related | 0.70 | 3.5 × own median |
| 4 | 4 3 3 3 3 | 0.085 | 4 | similar | 0.85 | 2.8 × own median |
| 5 | 5 5 4 4 5 | 0.072 | 6 | confusable | 1.00 | 1.8 × own median |

Level 4 is where it shows: 16 steps into a five-wide rotation is three full
passes plus one, and the one goes to `targetSize`. Level 5 exhausts every
dimension, as it must.

Note the plateaus. `choices` index 0 and 1 are both 2, and `window` index 0 and 1
are both unlimited, so level 2 raises all five indices but only three of them
change anything the child can feel. That is deliberate in the value lists — the
first step into a new demand is a freebie — but it does mean `levelChange()` can
name a dimension whose *value* did not move.

One caveat on the table: `distractors` is the one dimension the prompt ladder
also shifts (−2 at stage A through +2 at stage F, clamped to the list), so the
similarity actually delivered can sit either side of the plan. Every other
dimension arrives exactly as tabulated.

### Clearing a level

Comprehension is `summarise().comprehensionPct` — precisely
`(correct + correctInhibit + near) / answered`. Three things earn it: the right
answer; the right answer reached imprecisely or late (`near`); and, in the
inhibition games, correctly *not* moving on a no-go trial (`correctInhibit`).
That last one matters more than it looks: the whole Stop & Think group emits it,
so in a go/no-go round a successful withhold counts towards clearing exactly as
a successful reach does — which is right, because withholding is the skill that
game is teaching.

A round clears the level it was played at when it has **at least 4 trials** and
comprehension at or above that level's bar. **Speed appears nowhere in this
decision.** A round shorter than 4 trials is a sample, not an attempt: it earns
points, but it neither clears the level nor counts towards the attempt tally the
anti-wall rule below uses.

When a round does not clear, the child is never told they failed — `advice` names
the single thing that would clear it ("Get 65 % of the turns right to open the
next level", or "Play a few more turns to finish this level").

A level can end up marked cleared four ways. Which one is stored per level in
`cleared[level].by`, and `journeySnapshot()` reports `clearedByEffort` and
`clearedImplied` next to the raw clear count — because "demonstrated", "granted
for persistence", "inferred" and "arrived from another device" are four
different claims about a child. Collapsing them into a single "cleared" count
would silently overstate what the child has actually shown, so nothing in this
codebase is allowed to.

| `by` | rule | what it actually claims |
| --- | --- | --- |
| `criterion` | ≥ 4 trials and comprehension ≥ the bar | demonstrated at this level, on this device |
| `effort` | third or later ≥ 4-trial attempt at this level, comprehension within 20 points of the bar | real repeated effort landing close to the bar |
| `implied` | backfilled for every level below one that was just cleared | inferred from a higher clear, never observed |
| `remote` | arrived via `mergeRemoteJourney()` | this device has no evidence at all |

The `effort` path is the anti-wall rule, and it exists because one badly-matched
level can otherwise end a child's use of the app entirely. Backfilling is sound
because level plans are **monotone** — every level's floor is at least the floor
below it — so clearing level 4 genuinely is evidence about levels 1 to 3; it also
makes "all five" reachable for a child an adult started at level 3.

A *clean* clear opens two levels instead of one (comprehension ≥ 92 % and 3
stars): a child who has visibly passed straight through a level should not have
to grind the next one to arrive where they already are. Settings → Help →
**Unlock all levels (adult)** (`journeyUnlockAll`) is the override that makes
every level selectable without playing; clearing one still has to be earned.

**Not every game has a journey.** `hasJourney(game)` is false when the catalogue
entry sets `journey: false` or declares no adaptive dimensions, and today that is
exactly one game — `setup-space`, which is a five-stretch *measurement* of the
child's reach, not a challenge. It shows no pips, has no levels to clear, and
uploads `level: null` rather than a spurious level 1 so no clinical view reports
a not-cleared verdict for it. It still earns points, because the child played.

**A mission is one level, not eight.** `missionEngine` builds each stage as a
pseudo-game with id `<missionId>:<stageId>`, and `activeLevel()` resolves that
composite by prefix to the *mission's* level — so "My Whole Day" runs its whole
chain at one envelope rather than eight independent ones, and produces a single
`ARSession` whose trials carry `stage` rather than eight sessions with eight
levels. The `whole-day` badge reads `levelsCleared(missionId)` for the same
reason.

**A cleared level is not evidence of real-world transfer.** It says this child
answered enough of a camera task correctly, at a known envelope of demand, with a
known amount of help. Transfer is prompt stage **G**, checked by an adult away
from the screen, and neither a level nor a point total can ever award it (§1,
§4).

### Points

One function, `pointsFor()`, decides every point in the app, and it returns the
itemised rows the results screen shows so the child can see where each point came
from.

| row | value | when |
| --- | --- | --- |
| turns played | 10 + 2 per turn, counting at most 24 turns (max 58) | always |
| got it right | `60 × (comprehension × 0.75 + independence × 0.25)` | any quality above zero |
| level bonus | ×1.0 / 1.2 / 1.4 / 1.6 / 1.8 on the two rows above | levels 2–5 |
| your best yet | 30 | beat this child's own best on this game **and** level |
| level cleared | 40 the first time, 12 for passing it again | cleared |
| first game today | 15 | first round of the day |

The quality weighting is identical to `starsFor()` — understanding three
quarters, independence one quarter, speed nothing — so the points a child sees
and the stars they see can never tell different stories. The three bonuses are
added *after* the level multiplier rather than multiplied by it. A personal best
needs to beat the stored one by 0.02 on the 0–1 quality score, and needs the same
4-trial minimum, so noise cannot pay out.

Two invariants hold everywhere:

- **Speed earns nothing.** No latency, movement-time or pace term appears in
  `pointsFor`, in `starsFor`, or in any badge condition. A slow, correct, unaided
  round is a maximum-scoring round.
- **Every round earns something.** The floor is turning up and taking turns, so
  the worst possible round still pays 10; the best possible one — 24 turns,
  perfect, unaided, a first clear of level 5, a personal best, first game of the
  day — pays 297.

Points are the child's currency: the hub total, the results screen, and a
cosmetic rank ladder (Explorer → Grand Champion, seven stops, `RANKS`). The ten
badges follow the same discipline: none is awarded for speed, and none can be
lost, because taking a badge away from a child who missed a week through illness
would teach exactly the wrong lesson.

On the insights screen points are **context, never the headline**. The KPI strip
across the top of every tab — understanding, independence, thinking time, moving
time — is the headline and is always visible; the Journey tab's own stat strip
leads with levels cleared and carries points and rank after them. A reader who
looks at that screen sees understanding first whichever tab is open.

Points and dashboard XP are **not the same number**. A round's `xp` equals its
points inside the AR section, but `mirrorToDashboard()` divides by
`AR_XP_DIVISOR` (4) before crediting the app-wide `StudentActivity.totalXP`,
because journey points top out near 300 where every other module's round is
worth at most 70. Without the scaling one camera game would be worth four reading
lessons in a shared economy that nothing else opted into.

### Where the journey lives

| place | what | why there |
| --- | --- | --- |
| `profile.journey` in localStorage (`core/profile.js`) | the source of truth: `points`, `lifetimePoints`, `days[]`, `badges[]`, and per game `{ level, cleared{}, best{}, attempts{}, plays, points }` | offline and anonymous play has to behave identically, and no camera-adjacent data needs a server to be useful |
| per-round fields on the uploaded `ARSession` (`core/telemetry.js`) | `level`, `levelCleared`, `clearedBy`, `newBest`, `pointsAwarded`, `pointsBreakdown`, `journeyPoints`, `stars`, `xp` (= `pointsAwarded`) | a stored round reads back as "level 3, cleared by criterion, 96 points" without recomputing it from trials |
| `GET /api/ar/journey` → `mergeRemoteJourney()` | cross-device recovery, pulled once when the hub mounts | a child who changes device or clears their browser gets their levels back |
| the `journey` block on `GET /api/ar/insights` | the clinical read: per game `levelInWindow`, `levelsCleared`, and the clear counts split four ways | it is the only surface that keeps criterion / effort / unknown / implied apart server-side |

The server does not keep a journey of its own. `GET /api/ar/journey` rebuilds one
from the rounds that were uploaded — points summed from `pointsAwarded`, days
from the UTC-bucketed `startedAt`, and per game the levels that have a
`levelCleared: true` round — so there is exactly one record and no second running
total to drift out of step with it. Two details it has to reproduce, or the
restore quietly costs a child progress:

- **it backfills.** Only levels that a round cleared are uploaded, so returning
  just those would hand back a path with holes in it — and cost the all-five
  trophy to a child who had finished a game by skipping ahead. It fills 1…max
  from the same monotonicity argument the device uses.
- **it reproduces the clean-clear double unlock.** The offered level is
  `max(bestClear + 1, cleanClear + 2)`, falling back to the hardest level ever
  *played* when nothing has cleared. `stars` and `summary.comprehensionPct` are on
  the same session, so a clean clear is recognisable server-side.

The `journey` block on `GET /api/ar/insights` is a different question and is
scoped to the requested window, which is why its per-game level field is called
`levelInWindow`: a game cleared at level 4 last term and played at level 2 last
week must not read as a regression. It also re-derives `implied` server-side
(implied levels are never uploaded) and resolves a level cleared more than once
to its strongest provenance.

The merge then takes **the better of the two** per field — higher points, higher
unlocked level, more plays, the union of played days and of cleared levels — so
a device that has been offline for a week can never be overwritten by a staler
server copy, and a server round-trip can never cost a child progress. What it
*can* cost is provenance: the payload carries which levels cleared but not how,
so a clear that arrives this way is stored `by: 'remote'` (§10).

`recordRound()` is the only writer *on the play path*, called exactly once per
round from `ARStage` — which is also why stars, the clear verdict and the points
are all settled *before* `recorder.end()` uploads the round; otherwise the stored
and uploaded copies of the same round would disagree. Two other functions write
journey state: `mergeRemoteJourney()` on the restore path above, and
`resetJourney()`, which Settings → Data calls alongside `resetProfile()` so that
an erase during a round also clears the *ambient* level and the round in progress
cannot record a clear against the child who was just erased.

---

## 6. The child capability profile

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

## 7. Data

### What is recorded

Trial-level rows with cognitive and motor columns kept apart — see §1. Plus,
per game family: `timingErrorMs` (rhythm), `coverage` / `traceAccuracy` /
`meanDeviation` / `strayCount` (tracing), `bilateralOffsetMs` /
`usedBothHands` (two-hand), `postureScore` / `holdBreaks` (imitation and
freeze), `crossedMidline`, `stepLatenciesMs`, `pipelineLatencyMs`.

Each round also carries the journey verdict listed in §5: which level it was
played at, whether it cleared, and the itemised points. Note the asymmetry with
that section's four-way table — **a session's `clearedBy` can only ever be
`'criterion'`, `'effort'` or `null`.** `implied` and `remote` are device-side
bookkeeping for levels that no round ever cleared, so they are never attached to
a session and a consumer switching on this field needs three branches, not five.
A clinical view that wants the implied count re-derives it from monotonicity, as
`getInsights` does.

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
| `GET /api/ar/insights?days=` | per-game / per-domain / per-hand / progression / life skills, plus a `journey` block with the clear counts split four ways |
| `DELETE /api/ar/sessions` | erase all of the caller's AR telemetry |
| `GET /api/ar/journey` | levels, points and played days rebuilt from the caller's rounds, for `mergeRemoteJourney()` |

Rounds are also mirrored into `StudentRound` and `StudentActivity` so camera
games show up in the child's normal progress alongside the other modules.

---

## 8. No scrolling. Anywhere.

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

## 9. Running it

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

## 10. Known limits, stated plainly

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
- **Restored progress loses its provenance.** `GET /api/ar/journey` says which
  levels a child cleared but not by which route, so `mergeRemoteJourney()` marks
  everything it restores `by: 'remote'`. Such a level counts in
  `levelsCleared()` but in neither the `clearedByEffort` nor the
  `clearedImplied` tally, so in an aggregate it reads like a criterion clear.
  Anything clinical should read `cleared[level].by` per level rather than
  subtract the two counters — and a child on a borrowed device has, strictly, an
  unattributed clear rather than a demonstrated one.
- **A journey day is a UTC day.** `days[]`, the five-days badge and the
  "first game today" bonus all bucket on the UTC date, which is what the rest of
  the platform's `StudentActivity` rows do, so they agree with each other rather
  than with the child's local midnight. Points-only, but it means one local day
  far from UTC can pay the daily bonus twice.
- **Nothing here is validated as an assessment.** The metrics are descriptive.
  Treating movement smoothness as a diagnosis would be wrong, and the dashboard
  says so where a reader will see it.
