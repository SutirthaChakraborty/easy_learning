# About Learningo (easy_learning)

Learningo is a play-first, gamified learning platform built for children with dyslexia
and other neurodivergent learners. It turns school subjects into short, encouraging,
audio-supported rounds — reading, writing, and speaking feel like an adventure instead of
a struggle, with instant positive feedback (stars, XP, streaks) instead of red marks.

This document is the project's map: what it is, who it's for, what it's made of, and
where to look for more detail. It intentionally doesn't duplicate the two deeper docs
already in this repo:

- **[README.md](./README.md)** — the day-to-day user manual (what a Student/Parent/
  Admin/Teacher/Super Admin can click and what happens).
- **[docs/design-guide.md](./docs/design-guide.md)** — the developer's architecture guide
  (repo map, the 3-database backend, auth systems, how to add a feature).
- **[DEPLOY.md](./DEPLOY.md)** — how the app is deployed to production (Hostinger VPS,
  Nginx, PM2, MongoDB Atlas).

Read those for specifics. This page is the overview that ties them together.

---

## 1. Mission

> "We believe every child learns differently, and that difference is something to
> celebrate, not fix."

Learningo (product name; the codebase and repo are still called `easy_learning`) exists
to make core literacy and numeracy practice accessible to kids whose brains work
differently — without singling them out or making learning feel like a test. Every
lesson is a short round with audio support, playful visuals, and immediate encouragement.

**Target users:** children (roughly ages 5–14) with dyslexia, ADHD, or other learning
differences; their parents/guardians; and the schools, coaching centres, and teachers who
support them.

---

## 2. What's in the product

### 2.1 The three worlds

Content is organized into three subjects, each covering four skills:

| Subject | Skills |
|---|---|
| **English** ("English Kingdom") | Listen · Read · Write · Speak |
| **Mathematics** ("Maths Galaxy") | Listen · Read · Write · Speak |
| **Science** ("Science Lab") | Listen · Read · Write · Speak |

That's 12 content modules in total. Each module is played in **rounds of exactly 10
questions**, with a **Practice** mode (untimed, 1 star per correct answer) and a
**Warrior** mode (timed, pass at 6+/10, with speed bonus stars for fast correct answers).

There's also a subject-agnostic, story-based **Learn** mode that mixes topics rather than
drilling one subject, and a standalone **Game Zone** with three English games — Spelling
Bee, Memory Match, and Word Puzzle — each independently star-rated.

### 2.2 Motivation, not grading

Progress is tracked as XP, levels, streaks, and 16 unlockable achievement badges (across
Learning, Games, Streak, XP-milestone, and Special categories), all visible on a personal
**Dashboard**: an activity heatmap, a 30-day XP trend chart, a full "progress map" of all
12 module slots, and a scrollable round history. Nothing is logged manually — finishing a
round of 10 questions updates the dashboard automatically.

### 2.3 Five roles, one platform

| Role | Who | Sign-in |
|---|---|---|
| **Student** | The kids doing the learning | Google or email/password |
| **Parent** | A guardian tracking their own kids, no organization needed | Google only |
| **Admin** | Runs a school/coaching centre — manages tutors, batches, students, and question review | Google only |
| **Teacher** | A tutor an Admin has added, manages their own assigned batches and uploads questions | Google only, must already exist as a Tutor record |
| **Super Admin** | The single platform operator, approves organizations platform-wide | Email/password, one hardcoded account |

Organizations (schools/coaching centres) go through an approval workflow with the Super
Admin, and batch-scoped question content, so a student in an org only ever sees content
approved for their batch — never the general seed bank. Admins and Teachers each have
threaded chat with the Super Admin for support. Full detail on all of this is in
README.md §§2–6 and design-guide.md §5.4.

### 2.4 Accessibility & language

- **14 languages** are fully supported (English, Spanish, Portuguese, French, Italian,
  German, Dutch, Russian, Turkish, Chinese, Japanese, Korean, Indonesian, Vietnamese),
  switchable at any time from the navbar and remembered per device.
- Text-to-speech (browser Web Speech API) backs reading content so a child can complete
  lessons without needing to decode text unaided.
- A subtle, purely decorative animated 3D background (`Background3D`) runs across every
  page — CSS-only, `aria-hidden`, and automatically disabled when the OS/browser
  `prefers-reduced-motion` is set.

---

## 3. How it's built

Learningo is a MERN-stack single-page application:

| Layer | Technology |
|---|---|
| Client | React 19 + Vite, React Router 7, Redux Toolkit, react-i18next, Framer Motion, Recharts, Firebase Auth (Google popup) |
| Server | Node.js + Express 4, Mongoose 8, JWT auth, `express-validator`, `multer` + Cloudinary (uploads), `exceljs` (teacher question-upload templates) |
| Database | MongoDB — **three separate databases** (default content/activity, org/admin data, super-admin data) |
| Not used | GraphQL, WebSockets (badge counts use ~25s polling instead), TypeScript, automated test suite |

The client and server are independent apps (`client/`, `server/`), each with its own
`npm run dev`; there's no shared root build step. Production runs on a Hostinger VPS —
Nginx serving the built React SPA and proxying `/api` to an Express process kept alive by
PM2, with MongoDB Atlas as the database (see [DEPLOY.md](./DEPLOY.md) for the full
runbook).

For the actual repo layout, the three-database split and why it exists, the auth model
per role, and copy-paste recipes for adding a new module/game/language/achievement, see
**[docs/design-guide.md](./docs/design-guide.md)** — it's written to be the only file a
developer needs to read before making a change.

---

## 4. Project history note

An earlier planning document, [PROJECT_PLAN.md](./PROJECT_PLAN.md), describes an
originally-scoped vanilla HTML/CSS/JS + ml5.js/TensorFlow.js build (GitHub Pages hosted).
The project has since been rebuilt as the React/Node/MongoDB application described above
and in design-guide.md — PROJECT_PLAN.md is kept for historical record but no longer
reflects the current architecture or stack.

---

## 5. Team

Built by Futuresight Analytics Limited. Sutirtha Chakraborty (project owner), Parichay
(developer), Raunak (company owner) — see PROJECT_PLAN.md §9 for the original
responsibility breakdown.
