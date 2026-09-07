# LearningO — Dyslexia-Friendly / Life-Skills Question Bank

Target: children with dyslexia and other learning differences, approx. ages 5–10.
Structure: one JSON file per **Subject × Module** (12 files total).
Each file: **15 question types × 10 questions = 150 questions**.
Full set: **1,800 questions**, globally validated with zero duplicate IDs.

## Build status — COMPLETE

| Subject | Listen | Read | Write | Speak |
|---|---|---|---|---|
| English | done 150 | done 150 | done 150 | done 150 |
| Math    | done 150 | done 150 | done 150 | done 150 |
| Science | done 150 | done 150 | done 150 | done 150 |

All 12 files are individually content-designed — nothing in this bank is
templated or auto-generated from a formula. Every question has its own
distractor reasoning, its own hidden life lesson, and its own feedback text.

| File | Questions | Band mix (easy / medium / happy) |
|---|---|---|
| english_listen.json | 150 | 56 / 63 / 31 |
| english_read.json   | 150 | 56 / 63 / 31 |
| english_write.json  | 150 | 58 / 62 / 30 |
| english_speak.json  | 150 | 56 / 61 / 33 |
| math_listen.json    | 150 | 55 / 62 / 33 |
| math_read.json      | 150 | 52 / 61 / 37 |
| math_write.json     | 150 | 54 / 61 / 35 |
| math_speak.json     | 150 | 53 / 62 / 35 |
| science_listen.json | 150 | 54 / 61 / 35 |
| science_read.json   | 150 | 52 / 61 / 37 |
| science_write.json  | 150 | 56 / 62 / 32 |
| science_speak.json  | 150 | 54 / 60 / 36 |

## Schema, per question

- `question_type` / `interaction` — maps to one of 12 reusable UI widgets
  (tap_mcq, true_false, match_pairs, sort_bins, drag_order, drag_to_blank,
  letter_bank, typed_short, typed_long, tap_hotspot, mic_record, multi_select)
- `difficulty_band` — `easy` (fluency, ~90% success), `medium` (learning edge,
  ~65-75% success — this is where growth data lives), `happy` (pure joy,
  near-certain success, silly/warm content, low mastery weight so it never
  drags a child's profile down)
- `life_skill` — the everyday-life lesson folded into the question itself
  (handwashing, road safety, sharing, saving money, asking for help, honesty,
  environment care, time/routine, organisation, home responsibility, social
  skills, emotional literacy, food/nutrition — 14 fixed domains, used across
  all 12 files)
- `distractor_insight` — what each specific wrong answer reveals, so one wrong
  tap becomes a diagnosis (e.g. picking "d" for "dog" flags b/d reversal,
  not just "wrong")
- `cognition` — Bloom level, executive-function tags, working-memory load (1-4)
- `analysis` / `tags` — dyslexia markers, personality signals, parent notes,
  teacher actions — built for later reporting, not just scoring
- `adaptive` / `telemetry` / `wellbeing` — rules for the app itself: what to do
  on 1st/2nd/3rd wrong answer, expected response time, mood check-ins, and a
  hard rule that feedback praises process ("you listened to the end"), never
  intelligence
- `speech_scoring` (Speak modules only) — `expected_keywords` for grading via
  speech recognition, plus one `sample_answer` for engineering/QA reference

Every file also contains an `analytics_dictionary` block with ten ready-made
reporting recipes — skill profile, life-skill radar, dyslexia error map,
attention curve, working-memory ceiling, confidence calibration, impulsivity
index, persistence index, mood trend, personality map — so the same tag data
across all 12 files can drive one consistent set of dashboards later.

## Content notes

- **English** modules use a 15-type taxonomy per module (Listen/Read/Write/Speak),
  covering phonics, decoding, spelling, and oral language, each climbing from
  Foundation to Independent difficulty.
- **Math** modules cover number sense, operations, geometry, measurement,
  fractions, data handling, and logical reasoning, all wrapped in real-life
  contexts (money, time, sharing, safety).
- **Science** modules cover life science, physical science, and earth science,
  including diagrams, classification, cause-and-effect, the scientific method,
  and genuine scientific inference — the hardest items in each module ask a
  child to reason from given facts to a conclusion that isn't stated outright.
- Across all 12 files, safety, honesty, and help-seeking items carry a
  `mastery_weight` above 1.0 so they surface prominently in any report, even
  when overall accuracy is high.

## Build architecture (for future maintenance)

- `builder.py` — the reusable schema builder. `build(subject, module, code,
  TYPES, QS)` takes a `TYPES` dict (per-type pedagogical metadata) and a `QS`
  list (per-question dicts) and returns full 36-key question objects.
- Per-module content lives in `{prefix}_{module}.py` (TYPES) plus one or more
  `{prefix}_{module}_qs*.py` files (QS lists), e.g. `en_listen.py` +
  `en_listen_q_a.py` ... `en_listen_q_d.py`.
- `assemble_en_listen.py`, `assemble_en_rest.py`, `assemble_math.py`,
  `assemble_science.py` — the four assembly scripts that import the raw
  content, call `build()`, and write the final JSON files with metadata,
  the type registry, and the analytics dictionary attached.
