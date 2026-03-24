# 🗺️ Easy Learn — Project Master Plan

> **Document Owner:** Sutirtha Chakraborty (Project Owner)
> **Company:** Futuresight Analytics Limited 🍀
> **Version:** 1.0 — 24 March 2026
> **Status:** 🟢 Active

---

## 📋 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Vision & Goals](#2-vision--goals)
3. [Tech Stack](#3-tech-stack)
4. [Project Phases & Timeline](#4-project-phases--timeline)
5. [Detailed Task Breakdown](#5-detailed-task-breakdown)
6. [Risk Register](#6-risk-register)
7. [Marketing Strategy](#7-marketing-strategy)
8. [Deliverables & Definition of Done](#8-deliverables--definition-of-done)
9. [Team Responsibilities](#9-team-responsibilities)
10. [KPIs & Success Metrics](#10-kpis--success-metrics)

---

## 1. Executive Summary

**Easy Learn** is a browser-based, gamified learning platform for children (ages 5–14) with dyslexia and learning disabilities. Powered by modern web technologies, AI/ML tools (ml5.js, TensorFlow.js, Teachable Machine), and immersive video + canvas effects, it delivers school curriculum content in a fun, accessible, and personalised way.

**Target Users:** Children with dyslexia, ADHD, and learning differences | Parents | SEN teachers

**Platform:** Web (progressive — works offline after first load)

**Business Model:** B2C subscription + B2B licensing to schools and therapy centres

---

## 2. Vision & Goals

### Vision

> A world where every child — regardless of how their brain is wired — can access education that feels exciting, not exhausting.

### Goals

| Priority | Goal | Metric |
| --- | --- | --- |
| 🔴 Must | Launch MVP accessible learning platform | Live by Week 12 |
| 🔴 Must | Pass WCAG 2.1 AA accessibility audit | 100% pass |
| 🟡 Should | Integrate ml5.js AI features | 2+ AI features live |
| 🟡 Should | Onboard 3 pilot schools | 3 schools Week 16 |
| 🟢 Could | Mobile app (PWA) | Week 20 |
| 🟢 Could | Multi-language support | Week 24 |

---

## 3. Tech Stack

### Frontend (Core)

| Layer | Technology | Purpose |
| --- | --- | --- |
| Structure | HTML5 (Semantic) | Accessible page structure |
| Styles | CSS3 + Custom Properties | Design system, animations |
| Scripting | Vanilla ES Modules | App logic, no framework overhead |
| Fonts | Google Fonts (Nunito) + OpenDyslexic | Typography |
| Video | HTML5 `<video>` + YouTube Embed | Hero backgrounds, tutorial videos |
| Canvas | HTML5 Canvas API | Particle systems, game rendering |

### AI / ML Layer

| Tool | Purpose | Integration Phase |
| --- | --- | --- |
| **ml5.js** (v1.x) | Face detection, PoseNet, handpose, sound classification | Phase 3 |
| **TensorFlow.js** | Custom model inference (word recognition) | Phase 4 |
| **Teachable Machine** | Train custom gesture/word classifiers without code | Phase 3 |
| **Web Speech API** | Text-to-speech + speech recognition (native browser) | Phase 2 |
| **MediaPipe Hands** | Real-time hand tracking for gesture mini-games | Phase 4 |

### Gaming & Effects

| Tool | Purpose |
| --- | --- |
| Canvas 2D API | Particle systems, confetti, XP animations |
| CSS `@keyframes` | Smooth UI transitions and rewards |
| HTML5 Video (`autoplay muted loop`) | Immersive hero backgrounds |
| Lottie Web | Lightweight JSON-based animated characters/mascots |
| Howler.js | Cross-browser audio engine for game sounds |

### Infrastructure

| Tool | Purpose |
| --- | --- |
| GitHub Pages | Free static hosting (MVP) |
| Netlify / Vercel | Production hosting with CI/CD |
| GitHub Actions | Automated deploy on merge to `main` |
| Cloudflare | CDN + DDoS protection |

---

## 4. Project Phases & Timeline

```
WEEK  01  02  03  04  05  06  07  08  09  10  11  12  13  14  15  16
      ├── PHASE 1 ──────────┤
                            ├── PHASE 2 ──────────────┤
                                                      ├── PHASE 3 ──────────┤
                                                                            ├─ PHASE 4 ─→
```

### Phase Overview

| Phase | Name | Duration | Start | End |
| --- | --- | --- | --- | --- |
| 1 | Foundation & Design System | 4 weeks | Week 01 | Week 04 |
| 2 | Core Learning Features | 5 weeks | Week 05 | Week 09 |
| 3 | AI Integration & Gaming | 4 weeks | Week 10 | Week 13 |
| 4 | Polish, Testing & Launch | 3 weeks | Week 14 | Week 16 |
| 5 | Post-Launch & Growth | Ongoing | Week 17 | — |

---

## 5. Detailed Task Breakdown

---

### 🔵 PHASE 1 — Foundation & Design System (Weeks 1–4)

**Goal:** Solid codebase, design language, and Hello World page that sets the template.

---

#### TASK 1.1 — Project Scaffolding

**Owner:** Sutirtha | **Week:** 1 | **Priority:** 🔴 Critical

**Subtasks:**

- [x] 1.1.1 Create GitHub repository
- [x] 1.1.2 Define branch strategy (`features-sutirtha`, `features-parichay`, `features-raunak`)
- [x] 1.1.3 Create folder structure (`public/`, `src/`, `updates/`, `docs/`)
- [x] 1.1.4 Write `.gitignore` and initial `README.md`
- [x] 1.1.5 Set up daily/weekly update report templates
- [ ] 1.1.6 Create GitHub Actions workflow for auto-deploy to GitHub Pages

**Expected Outcome:** Repo is live, team can clone and run locally, CI pipeline active.

**Risk:** Team members unfamiliar with Git flow → **Resolution:** Run a 30-min onboarding session; link to Git cheat sheet in README.

---

#### TASK 1.2 — Design System

**Owner:** Parichay | **Week:** 1–2 | **Priority:** 🔴 Critical

**Subtasks:**

- [x] 1.2.1 Define CSS custom properties (colours, spacing, typography, radius, shadows)
- [x] 1.2.2 Build `main.css` with utility classes, grid, buttons, cards
- [x] 1.2.3 Build `dyslexia.css` with OpenDyslexic font, colour overlays, high contrast
- [x] 1.2.4 Build `animations.css` with all keyframes (float, shimmer, XP bar, confetti)
- [ ] 1.2.5 Create design guide in Figma (or `docs/design-guide.md`)
- [ ] 1.2.6 Define component library: navbar, cards, buttons, modals, progress bars, badges

**Expected Outcome:** Any team member can build a new page just by using CSS classes.

**Risk:** Design drift between members → **Resolution:** All visual decisions go through `docs/design-guide.md`. No inline styles except page-specific overrides.

---

#### TASK 1.3 — Hello World Template Page

**Owner:** Parichay | **Week:** 2–3 | **Priority:** 🔴 Critical

**Subtasks:**

- [x] 1.3.1 Build `public/index.html` with nav, hero, features, team, CTA, footer
- [x] 1.3.2 Integrate CSS design system
- [x] 1.3.3 Connect `app.js`, `game-engine.js`, `accessibility.js`
- [x] 1.3.4 Build accessibility toolbar (dyslexia / contrast / large text / TTS)
- [x] 1.3.5 Add game HUD (level, XP bar, streak) to navbar
- [ ] 1.3.6 Add hero video background (autoplay, muted, loop)
- [ ] 1.3.7 Add canvas particle system behind hero text
- [ ] 1.3.8 Add Lottie animated mascot character

**Expected Outcome:** A visually stunning Hello World page that demonstrates the full platform aesthetic.

**Risk:** Video autoplay blocked by browser policies → **Resolution:** Always include `muted` attribute; provide still image fallback.

---

#### TASK 1.4 — CI/CD Pipeline

**Owner:** Sutirtha | **Week:** 3–4 | **Priority:** 🟡 High

**Subtasks:**

- [ ] 1.4.1 Create `.github/workflows/deploy.yml` for GitHub Pages auto-deploy
- [ ] 1.4.2 Configure Netlify/Vercel for staging and production environments
- [ ] 1.4.3 Set up branch protection rules on `main` (require PR + 1 review)
- [ ] 1.4.4 Add Lighthouse CI for automated accessibility and performance scoring

**Expected Outcome:** Every merge to `main` auto-deploys to production. Every PR gets a Lighthouse report.

**Risk:** Deployment config errors break production → **Resolution:** Keep `staging` branch as pre-production buffer; only promote to `main` after staging validation.

---

### 🟢 PHASE 2 — Core Learning Features (Weeks 5–9)

**Goal:** Functional learning modules, progress system, and parent/teacher dashboard.

---

#### TASK 2.1 — Learning Module Architecture

**Owner:** Parichay | **Week:** 5 | **Priority:** 🔴 Critical

**Subtasks:**

- [ ] 2.1.1 Define data schema for lessons (JSON: title, content, type, difficulty, XP reward)
- [ ] 2.1.2 Create `src/modules/lesson-runner.js` (renders any lesson from JSON)
- [ ] 2.1.3 Build lesson types: Reading | Word Match | Fill-in-the-blank | Audio
- [ ] 2.1.4 Create 3 starter lessons: Alphabet Recognition, Phonics Sounds, Sight Words
- [ ] 2.1.5 Build lesson page template: `public/lesson.html`

**Expected Outcome:** New lessons can be added by writing a JSON file — no code changes needed.

**Risk:** JSON schema becomes too rigid → **Resolution:** Design schema to be extensible; use optional fields with defaults.

---

#### TASK 2.2 — Gamification Engine

**Owner:** Parichay | **Week:** 5–6 | **Priority:** 🔴 Critical

**Subtasks:**

- [x] 2.2.1 XP award system with level-up logic
- [x] 2.2.2 Badge/achievement system (FIRST_LESSON, STREAK_3, STREAK_7, QUIZ_MASTER)
- [x] 2.2.3 Streak tracking with daily play record
- [x] 2.2.4 HUD (level, XP bar, streak counter)
- [ ] 2.2.5 Leaderboard (stored in localStorage; opt-in)
- [ ] 2.2.6 Confetti/celebration canvas animation on level-up
- [ ] 2.2.7 Animated badge popup with sound effect (Howler.js)
- [ ] 2.2.8 Daily challenge system (bonus XP for completing today's lesson)

**Expected Outcome:** Children are intrinsically motivated to open the app each day.

**Risk:** Children game the system (e.g., skip lessons for XP) → **Resolution:** Award XP only on correct answers, minimum time-on-task threshold, and completion ratio check.

---

#### TASK 2.3 — Text-to-Speech & Accessibility

**Owner:** Parichay | **Week:** 6–7 | **Priority:** 🔴 Critical

**Subtasks:**

- [x] 2.3.1 Click-to-read using Web Speech API
- [ ] 2.3.2 Lesson auto-narration (TTS plays when a new lesson loads)
- [ ] 2.3.3 Word-level highlight sync with speech (SpeechSynthesis `onboundary`)
- [ ] 2.3.4 Speed control slider (0.5x – 1.5x) in accessibility toolbar
- [ ] 2.3.5 Voice selection dropdown (UK/US/child-friendly voices)
- [ ] 2.3.6 Subtitles/captions display for video content

**Expected Outcome:** A child with severe dyslexia can complete every lesson without needing to read a single word independently.

**Risk:** `speechSynthesis` API inconsistent across browsers → **Resolution:** Feature-detect and gracefully degrade; test in Chrome, Firefox, Safari, and Edge.

---

#### TASK 2.4 — Mini-Games

**Owner:** Parichay | **Week:** 7–9 | **Priority:** 🟡 High

**Subtasks:**

- [ ] 2.4.1 **Word Scramble** — drag letters to form a word
- [ ] 2.4.2 **Memory Match** — flip cards to match word + image pairs
- [ ] 2.4.3 **Phonics Pop** — pop the balloon with the correct sound
- [ ] 2.4.4 **Sentence Builder** — drag words into the correct order
- [ ] 2.4.5 Shared game engine: timer, score, life system, XP reward
- [ ] 2.4.6 Animated win/lose screens with TTS feedback

**Expected Outcome:** 4 playable mini-games, each reinforcing a different literacy skill.

**Risk:** Canvas game performance on low-end tablets → **Resolution:** Cap at 30 FPS for mini-games; test on Chrome Android (budget device emulation).

---

#### TASK 2.5 — Parent & Teacher Dashboard

**Owner:** Sutirtha | **Week:** 8–9 | **Priority:** 🟡 High

**Subtasks:**

- [ ] 2.5.1 Design dashboard wireframe (Figma)
- [ ] 2.5.2 Build `public/dashboard.html` with progress charts
- [ ] 2.5.3 Display: lessons completed, XP earned, time spent, badges, streak
- [ ] 2.5.4 Weekly progress report (downloadable as PDF via `window.print()`)
- [ ] 2.5.5 Teacher view: multiple student profiles

**Expected Outcome:** Parents/teachers can track a child's growth at a glance.

**Risk:** Privacy concerns about tracking children's data → **Resolution:** All data stored locally (localStorage/IndexedDB) in MVP; no server uploads. GDPR notice on first use.

---

### 🟣 PHASE 3 — AI Integration & Gaming (Weeks 10–13)

**Goal:** ml5.js AI features, advanced gaming effects, video integration.

---

#### TASK 3.1 — ml5.js Core Integration

**Owner:** Parichay | **Week:** 10 | **Priority:** 🟡 High

**Subtasks:**

- [ ] 3.1.1 Add ml5.js v1 CDN to project
- [ ] 3.1.2 Create `public/js/ml5-integration.js` module
- [ ] 3.1.3 Build feature flags system (`config.js`) to toggle AI features on/off
- [ ] 3.1.4 Load ml5 lazily (only when AI lesson is activated — don't block page load)

---

#### TASK 3.2 — Teachable Machine: Word Pronunciation Checker

**Owner:** Parichay | **Week:** 10–11 | **Priority:** 🟡 High

**Subtasks:**

- [ ] 3.2.1 Train a Teachable Machine Sound Model for 10–20 common phonics sounds
- [ ] 3.2.2 Export model and host in `public/models/phonics-sound/`
- [ ] 3.2.3 Integrate ml5 `soundClassifier()` to listen and score pronunciation
- [ ] 3.2.4 Give real-time visual feedback (green tick / try again) with TTS coaching
- [ ] 3.2.5 Add to "Phonics" lesson module as an optional AI mode

**Expected Outcome:** A child says a word/sound into the microphone; the AI confirms if it's correct and awards XP.

**Risk:** Microphone permission denied → **Resolution:** Show clear permission prompt with friendly character; always offer a "skip mic" fallback.

---

#### TASK 3.3 — PoseNet / HandPose Mini-Game

**Owner:** Parichay | **Week:** 11–12 | **Priority:** 🟢 Medium

**Subtasks:**

- [ ] 3.3.1 Integrate ml5 `handPose()` via webcam
- [ ] 3.3.2 Build "Letter Air-Trace" game — trace a letter shape in the air with your finger
- [ ] 3.3.3 Draw hand skeleton overlay on canvas in real-time
- [ ] 3.3.4 Score accuracy against stored letter path templates
- [ ] 3.3.5 Award XP and play celebrate animation on correct trace

**Expected Outcome:** A child traces the letter "A" with their finger in the air and the AI confirms correct form.

**Risk:** Webcam not available → **Resolution:** Feature only unlocked if webcam permission granted; standard keyboard/touch alternative always available.

---

#### TASK 3.4 — Face-Based Emotion Feedback

**Owner:** Parichay | **Week:** 12–13 | **Priority:** 🟢 Could Have

**Subtasks:**

- [ ] 3.4.1 Integrate ml5 `faceApi()` for emotion detection
- [ ] 3.4.2 Monitor if child appears confused or frustrated during a lesson
- [ ] 3.4.3 If frustration detected for 30s → automatically offer a hint or switch to easier mode
- [ ] 3.4.4 Show empathetic mascot message: "You're doing great! Let's try a different way 🌟"

**Expected Outcome:** The platform adapts in real-time to the emotional state of the learner.

**Risk:** Inaccurate emotion detection → misleading feedback → **Resolution:** Use emotion as a soft signal only; never punish or change difficulty based on a single detection event (require 10-second sustained reading).

---

#### TASK 3.5 — Video Backgrounds & Gaming Effects

**Owner:** Parichay | **Week:** 10 | **Priority:** 🔴 Critical

**Subtasks:**

- [ ] 3.5.1 Source 3 royalty-free looping videos (space, underwater, forest — thematic backgrounds)
- [ ] 3.5.2 Add HTML5 `<video>` as hero background (`autoplay muted loop playsinline`)
- [ ] 3.5.3 Build canvas particle system (floating stars, bubbles, leaves matching theme)
- [ ] 3.5.4 Add Lottie JSON animated mascot (friendly character that reacts)
- [ ] 3.5.5 Add Howler.js ambient background music (toggleable, muted by default)
- [ ] 3.5.6 Confetti cannon on level-up (canvas `requestAnimationFrame` burst)
- [ ] 3.5.7 Screen shake effect on wrong answer (CSS `@keyframes` shake)
- [ ] 3.5.8 XP float (+10 XP text floats up from button on correct answer)

**Expected Outcome:** The platform feels like a video game, not a worksheet.

**Risk:** Video files too large (slow load) → **Resolution:** Use compressed WebM < 5MB; lazy-load video; poster image shown until video ready.

---

### 🟠 PHASE 4 — Polish, Testing & Launch (Weeks 14–16)

**Goal:** Production-ready, accessible, performant, and launched.

---

#### TASK 4.1 — Accessibility Audit

**Owner:** Sutirtha | **Week:** 14 | **Priority:** 🔴 Critical

**Subtasks:**

- [ ] 4.1.1 Run automated audit (axe DevTools / Lighthouse)
- [ ] 4.1.2 Manual keyboard navigation test (every feature accessible without mouse)
- [ ] 4.1.3 Screen reader test (NVDA + Chrome, VoiceOver + Safari)
- [ ] 4.1.4 Colour contrast check (all text ≥ 4.5:1)
- [ ] 4.1.5 Resize to 400% zoom — content should not overflow
- [ ] 4.1.6 User test session with 2 children who have dyslexia (via therapist partner)

**Expected Outcome:** WCAG 2.1 AA certified. Lighthouse Accessibility score ≥ 95.

---

#### TASK 4.2 — Performance Optimisation

**Owner:** Parichay | **Week:** 14–15 | **Priority:** 🟡 High

**Subtasks:**

- [ ] 4.2.1 Compress all images to WebP
- [ ] 4.2.2 Compress video to WebM (< 5MB each)
- [ ] 4.2.3 Lazy-load ml5.js and TensorFlow.js (only load when AI feature activated)
- [ ] 4.2.4 Add `preload`, `prefetch`, and `preconnect` link hints
- [ ] 4.2.5 Target Lighthouse Performance ≥ 90, FCP < 1.5s, LCP < 2.5s
- [ ] 4.2.6 Cache assets with Service Worker (PWA offline support)

---

#### TASK 4.3 — Cross-Browser & Device Testing

**Owner:** Parichay | **Week:** 15 | **Priority:** 🔴 Critical

**Subtasks:**

- [ ] 4.3.1 Test: Chrome (desktop + Android), Firefox, Safari (macOS + iOS), Edge
- [ ] 4.3.2 Test: iPad (touch), budget Android tablet (Chrome)
- [ ] 4.3.3 Test: touch interactions for all mini-games
- [ ] 4.3.4 Document any known issues in `docs/browser-compat.md`

---

#### TASK 4.4 — Launch

**Owner:** Sutirtha | **Week:** 16 | **Priority:** 🔴 Critical

**Subtasks:**

- [ ] 4.4.1 Final review and sign-off by Raunak
- [ ] 4.4.2 Deploy to production (Netlify/Vercel custom domain)
- [ ] 4.4.3 Set up Google Analytics 4 (with GDPR consent banner)
- [ ] 4.4.4 Announce on LinkedIn (Futuresight Analytics company page)
- [ ] 4.4.5 Send launch email to 3 pilot school contacts
- [ ] 4.4.6 Create Product Hunt listing (draft prepared in Week 15)

---

### ⚡ PHASE 5 — Post-Launch & Growth (Week 17+)

**Ongoing tasks after MVP launch:**

- [ ] 5.1 Collect user feedback via in-app survey (1 question per session)
- [ ] 5.2 Add 5 new lessons per week (JSON-driven — no code change)
- [ ] 5.3 A/B test dyslexia mode on/off at onboarding
- [ ] 5.4 Build backend API (Node.js/Supabase) for cloud progress sync
- [ ] 5.5 iOS/Android PWA packaging (Capacitor.js)
- [ ] 5.6 Irish language support (as Irish school market target)
- [ ] 5.7 Partnership with SpLD/dyslexia charities (IADSE, BDA)

---

## 6. Risk Register

| ID | Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | Video autoplay blocked by browser | High | Medium | Always use `muted` + `playsinline`; poster fallback |
| R2 | Microphone/webcam permission denied | High | Medium | Friendly prompt; always offer non-AI alternative |
| R3 | ml5.js model too slow on mobile | Medium | High | Lazy-load; quantised models; feature toggle off |
| R4 | GDPR/COPPA compliance for children's data | High | Critical | MVP: localStorage only, no cloud. Legal review before backend |
| R5 | OpenDyslexic font fails to load | Low | Medium | System font fallback (`Comic Sans MS, cursive`) |
| R6 | Scope creep delays MVP | High | High | Hard freeze: no new features added after Week 9 without PM approval |
| R7 | Key developer (Parichay) unavailable | Low | Critical | Document all code; no black-box logic; PR reviews ensure knowledge sharing |
| R8 | Lottie animation files too large | Medium | Medium | Use Lottie's `dotLottie` compressed format; < 100KB per animation |
| R9 | Canvas performance on low-end device | Medium | High | 30 FPS cap; `will-change: transform` for animated elements; requestAnimationFrame throttle |
| R10 | School procurement requires GDPR DPA | Medium | High | Prepare Data Processing Agreement template by Week 14 |

---

## 7. Marketing Strategy

### 7.1 Target Audience

| Segment | Description | Channel |
| --- | --- | --- |
| Parents (Primary) | Parents of children aged 5–14 with dyslexia/ADHD | Facebook Groups, Instagram, Google Ads |
| SEN Teachers | Special Educational Needs teachers in primary/secondary schools | LinkedIn, Education Conferences, Direct Email |
| OT / Therapists | Occupational therapists and learning support specialists | LinkedIn, Professional associations |
| School Admins | Decision-makers for school software procurement | Cold outreach, LinkedIn Sales Navigator |

---

### 7.2 Pre-Launch (Weeks 1–12)

| Week | Action | Owner | Outcome |
| --- | --- | --- | --- |
| 1 | Set up Futuresight Analytics LinkedIn company page | Raunak | Brand presence |
| 2 | Create Instagram & TikTok accounts (`@easylearn_app`) | Raunak | Audience building |
| 3–6 | Post weekly "behind-the-scenes" dev content (building the app) | Raunak + Parichay | Organic reach, authenticity |
| 4 | Write blog post: "Why Traditional Learning Fails Dyslexic Kids" | Sutirtha | SEO, authority |
| 6 | Build landing page with email waitlist (Mailchimp) | Parichay | Lead capture |
| 8 | Reach out to 10 SEN teachers for beta feedback | Sutirtha | Social proof |
| 10 | Share demo video on LinkedIn + YouTube | Raunak | Virality |
| 12 | Open beta for 50 families | All | Bug reports + testimonials |

---

### 7.3 Launch Week (Week 16)

| Action | Channel | Owner |
| --- | --- | --- |
| Product Hunt launch (Tuesday) | Product Hunt | Sutirtha |
| LinkedIn announcement | LinkedIn | Raunak |
| Press release to EdTech media | Email | Raunak |
| Email to waitlist (target 500+) | Mailchimp | Sutirtha |
| 30-second demo reel | Instagram / TikTok / YouTube Shorts | Parichay |
| Reach out to Irish EdTech podcasts | Direct email | Raunak |

---

### 7.4 Post-Launch Growth (Week 17+)

| Strategy | Detail | Timeline |
| --- | --- | --- |
| SEO Content | Weekly blog: "Top Tips for Teaching Dyslexic Children" | Ongoing |
| Referral Programme | Families get 1 month free for each referral | Month 2 |
| School Pilot Programme | Free 3-month trial for 5 pilot schools in Ireland/UK | Month 2 |
| Influencer Outreach | Partner with SEN educators on TikTok/Instagram | Month 3 |
| App Awards | Submit to EdTech awards (BETT, Digital EdTech Summit) | Month 4 |
| Partnership | Approach Dyslexia Ireland, British Dyslexia Association | Month 3 |

---

### 7.5 Pricing Model (Post-MVP)

| Plan | Price | Target | Features |
| --- | --- | --- | --- |
| Free | €0 | All | 3 lessons/week, basic games, no AI |
| Family | €9.99/month | Parents | Unlimited lessons, all AI features, 2 profiles |
| School | €299/year per class | Schools | 30 profiles, teacher dashboard, progress exports |
| Enterprise | Custom | Therapy centres | Custom branding, API access, unlimited |

---

## 8. Deliverables & Definition of Done

### Phase 1 Deliverables

- [x] GitHub repository live with branch strategy
- [x] CSS design system complete (`main.css`, `animations.css`, `dyslexia.css`)
- [x] Hello World page (`public/index.html`) with full accessibility
- [x] Game engine scaffolded (XP, levels, badges, streaks)
- [x] Daily/weekly update report system active
- [ ] CI/CD pipeline (GitHub Actions → GitHub Pages)
- [ ] Video hero background + particle canvas + Lottie mascot

### Phase 2 Deliverables

- [ ] 3 complete learning modules (JSON-driven)
- [ ] 4 mini-games (Word Scramble, Memory Match, Phonics Pop, Sentence Builder)
- [ ] TTS with word highlight sync
- [ ] Parent/teacher dashboard (client-side)
- [ ] Leaderboard + daily challenge

### Phase 3 Deliverables

- [ ] ml5.js pronunciation checker (Teachable Machine sound model)
- [ ] HandPose letter air-trace game
- [ ] Emotion-aware difficulty adaptation
- [ ] Video backgrounds (3 themes) + Lottie mascot + Howler.js audio

### Phase 4 Deliverables

- [ ] WCAG 2.1 AA audit passed
- [ ] Lighthouse score: Performance ≥ 90, Accessibility ≥ 95
- [ ] Cross-browser test report
- [ ] Production deployment live
- [ ] Google Analytics 4 + consent banner
- [ ] Product Hunt listing published

---

## 9. Team Responsibilities

| Area | Sutirtha (Project Owner) | Parichay (Developer) | Raunak (Company Owner) |
| --- | --- | --- | --- |
| Architecture | ✅ Leads | Reviews | Approves |
| Feature Dev | Reviews + Tests | ✅ Builds | — |
| Design | Approves | ✅ Implements | Feedback |
| AI/ML | Scopes | ✅ Implements | — |
| Business req. | Translates | — | ✅ Sets |
| Marketing | Supports | Creates demos | ✅ Leads |
| Legal/GDPR | Coordinates | — | ✅ Responsible |
| Launch | ✅ Manages | Supports | ✅ Signs off |

### How We Work

- **Daily standups:** Fill `updates/daily/YYYY-MM-DD.md` each morning (async — no call required)
- **Weekly sprints:** Monday planning → Friday review in `updates/weekly/week-NN-YYYY.md`
- **PRs:** Every feature goes through a pull request. At least 1 review before merge to `main`.
- **Demos:** Short screen recording shared on WhatsApp/Slack every Friday

---

## 10. KPIs & Success Metrics

### Technical KPIs

| Metric | Target | Tool |
| --- | --- | --- |
| Lighthouse Performance | ≥ 90 | Lighthouse CI |
| Lighthouse Accessibility | ≥ 95 | Lighthouse CI |
| First Contentful Paint | < 1.5s | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |
| WCAG 2.1 AA violations | 0 | axe DevTools |

### Product KPIs (Post-Launch)

| Metric | Target (Month 1) | Target (Month 3) |
| --- | --- | --- |
| Monthly Active Users | 200 | 1,000 |
| Daily Active Users | 30 | 200 |
| Lessons completed/user/week | 3 | 7 |
| Average session length | 8 min | 15 min |
| Day-7 retention | 30% | 45% |
| NPS Score | > 50 | > 65 |
| Paying subscribers | 10 | 100 |
| Pilot schools onboarded | 1 | 5 |

---

## 📌 Quick Reference: How to Use This Plan

1. **Each Monday:** Open this file, pick your Phase tasks, plan the week's work
2. **Open a GitHub Issue** for each subtask you're working on this week
3. **Work in your branch** (`features-parichay`, `features-sutirtha`, or `features-raunak`)
4. **Open a PR** when done — reference the issue number
5. **Fill in the daily report** each morning (copy `updates/daily/TEMPLATE.md`)
6. **End-of-week:** Fill in weekly summary (copy `updates/weekly/TEMPLATE.md`)
7. **Update this file** as tasks are completed (check the boxes!)

---

*Document maintained by Sutirtha Chakraborty | Futuresight Analytics Limited 🍀*
*Last updated: 24 March 2026*
