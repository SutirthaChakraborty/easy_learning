<div align="center">

<img src="https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=for-the-badge" />
<img src="https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge" />
<img src="https://img.shields.io/badge/Platform-Web-orange?style=for-the-badge" />
<img src="https://img.shields.io/badge/Node.js-%3E%3D18-339933?style=for-the-badge&logo=node.js" />
<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" />

<br /><br />

```
███████╗ █████╗ ███████╗██╗   ██╗    ██╗     ███████╗ █████╗ ██████╗ ███╗   ██╗
██╔════╝██╔══██╗██╔════╝╚██╗ ██╔╝    ██║     ██╔════╝██╔══██╗██╔══██╗████╗  ██║
█████╗  ███████║███████╗ ╚████╔╝     ██║     █████╗  ███████║██████╔╝██╔██╗ ██║
██╔══╝  ██╔══██║╚════██║  ╚██╔╝      ██║     ██╔══╝  ██╔══██║██╔══██╗██║╚██╗██║
███████╗██║  ██║███████║   ██║       ███████╗███████╗██║  ██║██║  ██║██║ ╚████║
╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝       ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝
```

# Easy Learn — Gamified Learning for Every Mind

### *An inclusive, interactive learning platform built for children with dyslexia and learning disabilities*

<br/>

> **"Every child deserves a learning experience that fits their mind — not the other way around."**

<br/>

---

</div>

## Table of Contents

- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [One-Command Setup](#one-command-setup)
  - [Manual Setup](#manual-setup)
  - [Running the App](#running-the-app)
  - [Seeding the Database](#seeding-the-database)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
  - [Authentication](#authentication-endpoints)
  - [Learning Content](#learning-content-endpoints)
  - [Mini-Games](#mini-game-endpoints)
  - [Dashboard & Progress](#dashboard--progress-endpoints)
  - [Admin](#admin-endpoints)
  - [Super-Admin](#super-admin-endpoints)
  - [Teacher](#teacher-endpoints)
  - [Contact](#contact-endpoint)
- [Database Architecture & Models](#database-architecture--models)
- [Roles & Authentication](#roles--authentication)
- [Internationalization (i18n)](#internationalization-i18n)
- [Accessibility](#accessibility)
- [Design System](#design-system)
- [Deployment](#deployment)
- [Branch Strategy & Contributing](#branch-strategy--contributing)
- [Roadmap](#roadmap)
- [The Team](#the-team)
- [About the Company](#about-the-company)
- [License](#license)

---

## About the Project

**Easy Learn** is an accessible, gamified web learning platform designed for **children aged 5–14 with dyslexia and other learning disabilities**. It combines multi-sensory learning techniques with game mechanics to make education engaging and effective for every type of learner.

The platform covers **three core subjects** — English, Mathematics, and Science — each with four learning modes: Listen, Read, Write, and Speak. Mini-games reinforce skills, a round-based scoring system (with a "Warrior" speed-bonus mode) drives motivation, and a personal dashboard tracks XP, streaks, and achievements over time.

Beyond the student experience, Easy Learn is a small multi-tenant platform: **organizations** (schools/tutoring centres) sign up, a **super-admin** approves them, an **org admin** manages tutors/batches/students, and **teachers** upload their own question banks that are scoped to the batches they teach.

**Built by Futuresight Analytics Limited** (Ireland).

---

## Key Features

| Feature | Description | Status |
|---|---|---|
| Multi-Sensory Modules | Listen, Read, Write, Speak — four modes across English, Maths, Science (12 combinations) | Done |
| Dyslexia-Friendly Typography | Increased letter/word spacing and line height applied globally via the Fredoka type system | Done |
| Round-Based Scoring | Every module/game is capped at 10 questions per round; Practice vs. Warrior mode toggle | Done |
| Warrior Bonus Scoring | Speed bonus stars for fast correct answers (≤10s / ≤15s / ≤20s) on top of the base star-per-correct-answer | Done |
| Mini-Games | Spelling Bee, Memory Match, Word Puzzle | Done |
| Student Dashboard | XP/level, activity heatmap, performance chart, round history, 16-badge achievement system | Done |
| Multi-Role Platform | Student, Teacher, Org Admin, Super-Admin — each with its own login and dashboard | Done |
| Batch-Scoped Question Uploads | Teachers upload question banks (Excel) targeted at specific batches; admin reviews & approves | Done |
| Admin ↔ Super-Admin Chat | Threaded messaging with unread badges (polling-based) between org admins and the super admin | Done |
| Organization Onboarding | Org registration, reversible approve/reject with history, resubmission after rejection | Done |
| Dual Authentication | Google OAuth (Firebase) + Email/Password (JWT) — separate per role | Done |
| Internationalization | 14 of 21 planned languages live via i18next, incl. RTL support | In Progress |
| 3D Animated Background | Ambient parallax "brick" scene shared across the whole app | Done |
| Contact Us | Public contact form (student/parent/teacher/admin/other) routed to the super-admin | Done |
| Text-to-Speech / Speech Recognition | Web Speech API in the Speak & Listen modules | Done |
| AI Personalization | Adaptive difficulty, emotion detection, gesture input | Future |

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19.2 | UI framework |
| Vite | 8 | Build tool & dev server |
| React Router | 7.14 | Client-side routing |
| Redux Toolkit | 2.11 | Global state management |
| Firebase Auth | 12.12 | Google OAuth integration |
| Framer Motion | 12.38 | Animations and transitions |
| Recharts | 3.8 | Dashboard charts |
| i18next / react-i18next | 26 / 17 | Internationalization |
| i18next-http-backend | 4 | Loads `/locales/*/translation.json` at runtime |
| i18next-browser-languagedetector | 8.2 | Detects/persists user language |
| React Icons | 5.6 | SVG icon library |
| Fredoka (fontsource) | 5.2 | Primary UI font |
| @vitejs/plugin-basic-ssl | 2.3 | Local HTTPS dev server (required for mic access on some browsers) |
| CSS Modules | — | Component-scoped styles |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | >= 18 | Server runtime |
| Express | 4.21 | REST API framework |
| MongoDB (Atlas) | driver 7.2 | NoSQL database — **3 separate clusters/connections** |
| Mongoose | 8.10 | MongoDB ODM |
| JSON Web Token | 9 | Token-based authentication (4 independent secrets, one per role) |
| bcryptjs | 3 | Password hashing |
| express-validator | 7.3 | Request validation for admin/super-admin/teacher/contact forms |
| multer / multer-storage-cloudinary | 2.2 / 4 | File uploads (avatars, org logos, contact attachments, question sheets) |
| cloudinary | 1.41 | Hosted image storage for org logos |
| exceljs | 4.4 | Reads/writes the `.xlsx` question-upload template |
| google-translate-api-x | 10.7 | Backs the `npm run translate` locale-generation script |
| cors | 2.8 | Cross-origin request handling (per-origin allowlist) |
| cookie-parser | 1.4 | httpOnly session cookie parsing |
| dotenv | 16.5 | Environment variable management |
| nodemon | 3.1 | Dev auto-restart |

### Planned AI/ML

| Technology | Purpose |
|---|---|
| ml5.js | Face detection, pose estimation, sound classification |
| TensorFlow.js | Custom model inference in-browser |
| Teachable Machine | Train custom gesture/sound models |
| MediaPipe Hands | Real-time hand tracking |

---

## Project Structure

```
easy_learning/                          ← Monorepo root
│
├── client/                             ← React + Vite frontend (port 5173/3000)
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env                            ← Firebase API key + API base URL (copy from .env.example)
│   ├── public/
│   │   └── locales/{lang}/translation.json  ← i18next resources (14 languages)
│   └── src/
│       ├── main.jsx                    ← App entry point, Redux Provider
│       ├── App.jsx                     ← Router + all page routes
│       ├── index.css                   ← Global styles, dyslexia-friendly base typography
│       ├── i18n/i18n.js                ← i18next init (http-backend + language detector)
│       ├── components/
│       │   ├── Navbar/, Hero/, Cards/, ProgressBar/, ModeToggle/, ContactForm/
│       │   ├── LanguageSwitcher/       ← Language picker (RTL-aware)
│       │   ├── RoundComplete/          ← Shared end-of-round results overlay
│       │   ├── Background3D/           ← Ambient 3D parallax background layer
│       │   ├── StudentDashboardViewer/ ← Read-only dashboard viewer (admin/teacher/super-admin drill-down)
│       │   └── Admin/                  ← Shared admin/super-admin UI kit (DataTable, Modal, SearchBar, MultiSelect, ScheduleEditor, WeeklyScheduleGrid, StatCard...)
│       ├── pages/                      ← Route-level pages
│       │   ├── Home.jsx, Learn.jsx, SubjectPage.jsx, GamesPage.jsx, ContactUs.jsx
│       │   ├── Login.jsx, RoleSelect.jsx, AdminLogin.jsx, TeacherLogin.jsx, SuperAdminLogin.jsx
│       │   ├── Dashboard.jsx, DashboardView.jsx, ProgressMap.jsx
│       │   ├── modules/                ← Learning module players (Read/Write/Listen/Speak)
│       │   ├── games/                  ← Mini-game pages (Spelling/Memory/Puzzle)
│       │   ├── admin/AdminDashboard.jsx
│       │   ├── superadmin/SuperAdminDashboard.jsx
│       │   └── teacher/                ← TeacherDashboard, TeacherBatchDetail, TeacherQuestionUpload
│       ├── store/
│       │   └── store.js + slices/      ← Redux Toolkit slices (dashboard + one per module/subject combo)
│       ├── context/
│       │   ├── AuthContext.jsx         ← Student auth (JWT + Firebase)
│       │   └── AdminAuthContext.jsx    ← Admin, teacher, and super-admin auth (3 independent JWTs)
│       ├── firebase/auth.js            ← Firebase init + Google sign-in
│       ├── utils/                      ← authHeaders, warriorBonus, designations, etc.
│       └── assets/
│
├── server/                             ← Node.js + Express API (port 5000)
│   ├── server.js                       ← Express app entry point, route mounting, CORS allowlist
│   ├── package.json
│   ├── .env                            ← Secrets (copy from .env.example)
│   ├── db/adminDb.js, superAdminDb.js  ← Secondary Mongoose connections
│   ├── config/cloudinary.js
│   ├── routes/                         ← ~25 route files
│   ├── controllers/                    ← Request handlers (mirror of routes/)
│   ├── models/                         ← 23 default-DB models
│   │   ├── admin/                      ← 7 models (Organization, OrgAdmin, Tutor, Student, Parent, Subject, Batch)
│   │   └── superadmin/                 ← 4 models (Organization, GlobalSettings, ChatMessage, QuestionUploadBatch)
│   ├── middleware/                     ← authMiddleware (per-role + dashboardAuth), upload.js, validate.js
│   ├── validators/                     ← express-validator chains per form
│   ├── utils/                          ← constants, performance aggregation, questionVisibility
│   ├── uploads/                        ← multer disk storage (avatars, contact-attachments, question-uploads) — gitignored
│   ├── scripts/                        ← translate-content.js, seed-all.js
│   └── data/                           ← Seed data + seed script
│       ├── seed.js                     ← Populates the default-DB question/game collections
│       └── *.json                      ← 16 fixture files (one per module/subject + games + learn)
│
├── docs/
│   ├── design-guide.md                 ← Typography, colors, accessibility standards
│   └── user-manual.md                  ← End-user walkthrough
├── updates/                            ← Daily & weekly team progress reports
│   ├── daily/                          ← YYYY-MM-DD.md
│   └── weekly/                         ← week-NN-YYYY.md
├── setup.sh / setup.bat / setup.ps1    ← Auto-install scripts (macOS/Linux, Windows CMD, PowerShell)
├── DEPLOY.md                           ← Hostinger VPS deployment guide (Nginx + PM2 + MongoDB Atlas)
├── PROJECT_PLAN.md                     ← 16-week development roadmap
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js >= 18** — [nodejs.org](https://nodejs.org)
- **npm >= 9** (bundled with Node.js)
- **Git** — [git-scm.com](https://git-scm.com)
- A MongoDB Atlas account (the app expects **three** connection strings — see [Environment Variables](#environment-variables))
- A Firebase project (for Google OAuth)
- A Cloudinary account (for organization logo uploads)

### One-Command Setup

The setup scripts install all dependencies and copy `.env.example` → `.env` for both client and server.

| OS | Command |
|---|---|
| Linux / macOS | `bash setup.sh` |
| Windows CMD | `setup.bat` |
| Windows PowerShell | `powershell -ExecutionPolicy Bypass -File setup.ps1` |

### Manual Setup

```bash
# 1. Clone the repository
git clone https://github.com/SutirthaChakraborty/easy_learning.git
cd easy_learning

# 2. Install root dependencies (concurrently)
npm install

# 3. Install client dependencies
cd client && npm install && cd ..

# 4. Install server dependencies
cd server && npm install && cd ..

# 5. Copy and fill in environment files
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit both .env files with your real credentials
```

### Running the App

```bash
# Start BOTH frontend and backend together (recommended)
npm run dev

# Start frontend only  →  http://localhost:5173
npm run client

# Start backend only   →  http://localhost:5000
npm run server
```

### Seeding the Database

Populate the default-DB question/game collections with lesson and game data:

```bash
cd server && npm run seed
```

This runs `server/data/seed.js` and inserts all JSON fixture data. `npm run seed:all` (`server/scripts/seed-all.js`) is available for a broader multi-collection reseed, and `npm run translate` (`server/scripts/translate-content.js`) can auto-generate locale content via `google-translate-api-x`.

---

## Environment Variables

Easy Learn talks to **three independent MongoDB clusters** and signs **four independent JWT secrets**, one per role. All are required — a missing one causes that role's login flow to fail with a generic "Internal server error".

### Server — `server/.env`

```env
PORT=5000
CLIENT_URL=http://localhost:5173

# Main app DB (students, learning content, activity/dashboard data)
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your_strong_random_secret_here
JWT_EXPIRES_IN=7d

# Admin DB (organizations, tutors/teachers, students, parents, batches)
ADMIN_MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<admindb>
ADMIN_JWT_SECRET=your_strong_random_secret_here
ADMIN_JWT_EXPIRES_IN=7d

# Super-admin DB (org approvals, global settings, contact messages, chat, question review)
SUPERADMIN_MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<superadmindb>
SUPERADMIN_JWT_SECRET=your_strong_random_secret_here

# Teacher auth (reads the admin DB's Tutor model, signs its own JWT)
TEACHER_JWT_SECRET=your_strong_random_secret_here
TEACHER_JWT_EXPIRES_IN=7d

# Cloudinary (organization logo uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Express server port (default: 5000) |
| `CLIENT_URL` | Yes | Frontend origin(s) for CORS — comma-separated for multiple origins |
| `MONGODB_URI` | Yes | Default-DB MongoDB Atlas connection string |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Yes / No | Student JWT signing secret / TTL (default `7d`) |
| `ADMIN_MONGODB_URI` | Yes | Admin-DB connection string |
| `ADMIN_JWT_SECRET` / `ADMIN_JWT_EXPIRES_IN` | Yes / No | Org-admin JWT signing secret / TTL |
| `SUPERADMIN_MONGODB_URI` | Yes | Super-admin-DB connection string |
| `SUPERADMIN_JWT_SECRET` | Yes | Super-admin JWT signing secret |
| `TEACHER_JWT_SECRET` / `TEACHER_JWT_EXPIRES_IN` | Yes / No | Teacher JWT signing secret / TTL |
| `CLOUDINARY_*` | Yes | Cloudinary credentials for org-logo uploads |

### Client — `client/.env`

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_API_BASE_URL=http://localhost:5000/api
```

The remaining Firebase config values (authDomain, projectId, etc.) are hardcoded inside `client/src/firebase/auth.js`.

---

## API Reference

Base URL: `http://localhost:5000`

Most responses follow the shape:

```json
{
  "success": true,
  "count": 5,
  "data": [ ... ]
}
```

Error responses:

```json
{
  "success": false,
  "message": "Description of what went wrong"
}
```

---

### Authentication Endpoints

Each role authenticates independently and receives its own JWT.

| Role | Method | Endpoint | Description |
|---|---|---|---|
| Student | `POST` | `/api/auth/register` | Register with email + password |
| Student | `POST` | `/api/auth/login` | Login with email + password → JWT |
| Student | `POST` | `/api/auth/session` | Sync a Firebase Google OAuth user → sets an httpOnly session cookie |
| Student | `GET` | `/api/auth/session` | Get the currently authenticated session user |
| Student | `DELETE` | `/api/auth/session` | Clear the session cookie (logout) |
| Admin | `POST` | `/api/admin/auth/google` | Firebase Google sign-in for org admins |
| Admin | `GET` | `/api/admin/auth/me` | Get current admin from JWT |
| Super-Admin | `POST` | `/api/superadmin/auth/login` | Email/password login (single super-admin account, no Google) |
| Teacher | `POST` | `/api/teacher/auth/google` | Firebase Google sign-in for teachers |
| Teacher | `GET` | `/api/teacher/auth/me` | Get current teacher from JWT |

**Example — `POST /api/auth/login` response:**
```json
{
  "success": true,
  "token": "<jwt>",
  "user": { "id": "...", "name": "Jane Smith", "email": "jane@example.com" }
}
```

---

### Learning Content Endpoints

Replace `{module}` with one of `read`, `listen`, `write`, `speak` and `{subject}` with one of `english`, `maths`, `science`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/{module}/{subject}` | `dashboardAuth` | Get questions for this module/subject — batch-scoped for org students, seed data for everyone else |
| `GET` | `/api/{module}/{subject}/:id` | `dashboardAuth` | Get a single question by ID |
| `POST` | `/api/{module}/{subject}/seed` | none | Seed this collection from JSON fixture data |
| `DELETE` | `/api/{module}/{subject}/all` | none | Delete all content in this collection |

**Available combinations (12 total):**

| Module | English | Maths | Science |
|---|---|---|---|
| `read` | `/api/read/english` | `/api/read/maths` | `/api/read/science` |
| `listen` | `/api/listen/english` | `/api/listen/maths` | `/api/listen/science` |
| `write` | `/api/write/english` | `/api/write/maths` | `/api/write/science` |
| `speak` | `/api/speak/english` | `/api/speak/maths` | `/api/speak/science` |

> A logged-in student who belongs to an organization (has a `Student` record) sees **only** their batch's approved teacher-uploaded questions for that module/subject — never seed data. A student with no `Student` record sees the developer/seed question bank instead. If a batch has no approved uploads for that module/subject, the response includes `"noOrgQuestions": true` instead of falling back.

**Example — `GET /api/read/english`:**

```json
{
  "success": true,
  "count": 5,
  "noOrgQuestions": false,
  "data": [
    {
      "id": 1,
      "title": "Colours",
      "content": "Colours make art beautiful...",
      "question": "What are red, blue and yellow called?",
      "options": ["Secondary colours", "Primary colours", "Warm colours"],
      "answer": "Primary colours",
      "emoji": "🎨"
    }
  ]
}
```

---

### Mini-Game Endpoints

These stay public (no `dashboardAuth`) since they're not tied to per-organization content.

#### Spelling Bee — `/api/spell/english`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/spell/english` | Get all spelling words |
| `GET` | `/api/spell/english/:id` | Get a single word |
| `POST` | `/api/spell/english/check` | Check a submitted answer |

#### Memory Match — `/api/game/memory-match`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/game/memory-match` | Get all card-pair sets |
| `GET` | `/api/game/memory-match/cards` | Get a shuffled play set |
| `POST` | `/api/game/memory-match/check` | Check a submitted pair match |

#### Word Puzzle — `/api/game/word-puzzle`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/game/word-puzzle` | Get puzzle challenges |
| `GET` | `/api/game/word-puzzle/play` | Get a play set |
| `POST` | `/api/game/word-puzzle/check` | Check a submitted answer |

---

### Dashboard & Progress Endpoints

All under `/api/dashboard`, protected by `dashboardAuth` (accepts either a JWT bearer token or the Firebase session cookie).

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/log-session` | Log a completed module/game session (duration, XP, score) — auto-checks & awards achievements |
| `GET` | `/stats` | Level, total XP, streak, session count |
| `GET` | `/activity` | Daily activity heatmap data |
| `GET` | `/achievements` | Earned achievements (of 16 defined badges) |
| `GET` | `/performance` | XP-over-time series for the dashboard chart |
| `GET` | `/module-stars` | Per-module/subject star totals |
| `POST` | `/log-answer` | Log a single question answer |
| `GET` | `/answers` | Answer history |
| `POST` | `/log-round` | Log a completed 10-question round (stars, warrior bonus, pass/fail) |
| `GET` | `/rounds` | Round history |

---

### Admin Endpoints

All under `/api/admin`, protected by admin JWT. Scoped to the admin's own organization throughout.

| Area | Method | Endpoint(s) | Description |
|---|---|---|---|
| Profile / Org | `GET/PATCH` | `/profile`, `GET/POST /org` | Admin identity (incl. designation, avatar) and organization registration/edit |
| Chat | `GET/POST` | `/chat`, `/chat/unread-count` | Threaded chat with the super-admin |
| Tutors | `GET/POST/PATCH/DELETE` | `/tutors`, `/tutors/:id`, `.../performance`, `.../schedule` | Manage tutors, view performance & schedule |
| Subjects | `GET/POST/PATCH/DELETE` | `/subjects`, `/subjects/:id` | Manage subject catalogue |
| Batches | `GET/POST/PATCH/DELETE` | `/batches`, `/batches/:id`, `.../students`, `.../subjects`, `.../teachers`, `.../schedule` | Class rosters, subject assignment, teacher assignment, weekly schedule |
| Students | `GET/POST/PATCH/DELETE` | `/students`, `/students/:id`, `.../performance`, `.../dashboard/*` | Manage students; drill into a student's dashboard (stats/activity/achievements/performance/answers/rounds) |
| Parents | `GET/POST` | `/parents` | Manage parent records |
| Question Review | `GET/POST/PATCH` | `/questions/uploads*`, `/questions/:module/:subject/:id` | Review/approve/reject teacher-uploaded question batches; edit individual questions |

---

### Super-Admin Endpoints

All under `/api/superadmin`, protected by super-admin JWT. There is a single super-admin account for the whole platform.

| Area | Method | Endpoint(s) | Description |
|---|---|---|---|
| Organizations | `GET/PUT` | `/organizations`, `.../approve`, `.../reject`, `.../subscription` | List, reversibly approve/reject (with history), and manage subscription for orgs |
| Org drill-down | `GET` | `/organizations/:id/admin`, `.../students`, `.../tutors`, `.../students/:id/performance`, `.../students/:id/dashboard/*` | Inspect any org's admin identity, roster, and per-student dashboard |
| Chat | `GET/POST` | `/chat`, `/chat/unread-count`, `/chat/:id` | Conversation list (one per org) + per-org thread |
| Settings | `GET/POST` | `/settings` | Global key/value platform settings |
| Contact | `GET/PUT` | `/contact`, `/contact/:id` | Review and respond to public Contact Us submissions |

---

### Teacher Endpoints

All under `/api/teacher`, protected by teacher JWT. Scoped to batches the teacher is assigned to.

| Area | Method | Endpoint(s) | Description |
|---|---|---|---|
| Students | `GET/PATCH` | `/students`, `/students/:id` | View/update students in the teacher's batches |
| Batches | `GET/POST/DELETE` | `/batches`, `/batches/:id`, `.../students`, `.../schedule` | View assigned batches, manage roster & schedule |
| Question Uploads | `GET/POST/PATCH` | `/questions/template`, `/questions/upload`, `/questions/uploads*`, `/questions/:module/:subject/:id` | Download the `.xlsx` template, upload a batch-scoped question sheet, track review status, edit questions |

---

### Contact Endpoint

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/contact` | none | Public contact form (role: student/admin/teacher/parent/other), optional file attachment — routed to the super-admin |

---

## Database Architecture & Models

Easy Learn intentionally uses **three separate MongoDB connections/databases**, each owned by a different role's controllers:

| DB | Env var | Owns |
|---|---|---|
| Default DB | `MONGODB_URI` | Student accounts, all learning-content collections, dashboard/activity data — keyed by email string |
| Admin DB | `ADMIN_MONGODB_URI` | Organizations, org admins, tutors/teachers, students, parents, subjects, batches |
| Super-admin DB | `SUPERADMIN_MONGODB_URI` | A mirrored `Organization` record, global settings, contact messages, admin↔super-admin chat, question-upload review batches |

`Organization` is intentionally duplicated across the admin and super-admin DBs and kept in sync manually in the controllers. Cross-DB lookups (e.g. an admin's student dashboard, or a super-admin drilling into an org) join by **email string**, not a shared `ObjectId`.

### Default DB — key models

**User** — `name`, `email` (unique), `passwordHash`, timestamps.

**Learning content** (pattern applies to all 12 `{Read|Write|Listen|Speak}{English|Maths|Science}` collections):
```
id        Number
question / content / character / word   (field name varies by module)
options   [String]        (read)
answer    String
level / difficulty  String
emoji     String
xp        Number           (listen)
```

**Game models** — `SpellEnglish` (word/hint/difficulty/emoji), `MemoryMatch` (difficulty/pairs), `WordPuzzle` (letters/answer/difficulty/emoji).

**Progress/dashboard models:**
- `StudentActivity` — daily activity per email (`sessions[]`, `totalMinutes`, `totalXP`, `totalSessions`)
- `StudentAchievement` — earned achievements per email + achievement ID
- `StudentAnswer` — per-question answer log
- `StudentRound` — one doc per completed round (`email`, `module`, `subject`, `mode`, `stars`, `bonusStars`, `totalStars`, `passed`, `completedAt`)
- `ContactMessage` — public Contact Us submissions (persisted in the super-admin DB)
- `Counter` — auto-increment helper for seed IDs

### Admin DB — models (`server/models/admin/`)

`Organization`, `OrgAdmin` (incl. `designation`), `Tutor`, `Student` (incl. `batchIds`), `Parent`, `Subject`, `Batch` (roster + per-subject teacher assignment + weekly schedule).

### Super-admin DB — models (`server/models/superadmin/`)

`Organization` (mirror, incl. `rejectionHistory`), `GlobalSettings`, `ChatMessage` (keyed by `adminUid`, two independent read-flags), `QuestionUploadBatch` (an upload/review event — not to be confused with the roster `Batch` model above).

---

## Roles & Authentication

Easy Learn has **four independent roles**, each with its own login, JWT secret, and (for three of them) Google OAuth flow:

| Role | Sign-in methods | Token storage | React context |
|---|---|---|---|
| Student | Google OAuth (Firebase → httpOnly session cookie) or Email/Password (JWT) | `localStorage: jwt_token` / `firebase_jwt` | `AuthContext.jsx` |
| Org Admin | Google OAuth (Firebase → JWT) | `localStorage` (admin key) | `AdminAuthContext.jsx` |
| Teacher | Google OAuth (Firebase → JWT) | `localStorage` (teacher key) | `AdminAuthContext.jsx` |
| Super-Admin | Email/Password only (single account) | `localStorage` (super-admin key) | `AdminAuthContext.jsx` |

### Student — Google OAuth via Firebase

1. User clicks "Sign in with Google" → Firebase handles the OAuth consent screen
2. Frontend sends the Firebase user's UID/profile to `POST /api/auth/session`
3. Server sets an httpOnly session cookie
4. `AuthContext` marks the user as authenticated

### Student — Email/Password via JWT

1. Register at `POST /api/auth/register` — password hashed with bcryptjs
2. Login at `POST /api/auth/login` — server compares against the hash, returns a signed JWT (`JWT_EXPIRES_IN`, default 7d)
3. Frontend stores the JWT in `localStorage` and attaches it as a Bearer token on subsequent requests

### Admin / Teacher / Super-Admin

Admin and teacher both authenticate via a Firebase Google popup, then exchange the Firebase ID token for a role-specific JWT (`ADMIN_JWT_SECRET` / `TEACHER_JWT_SECRET`) — the app resolves their `OrgAdmin`/`Tutor` record in the admin DB by email. The super-admin is the one exception: a single seeded account authenticates with email/password only, signed with `SUPERADMIN_JWT_SECRET`.

### Protected Routes

Learning-content and dashboard endpoints require `dashboardAuth` (student JWT or Firebase session cookie). Admin/teacher/super-admin API routes each require their own JWT middleware. **Note:** the client-side module pages currently have no route guard — an unauthenticated visitor hitting a module page sees the module's generic error state rather than a "please log in" prompt (a known gap; `Dashboard.jsx` has the pattern to copy for a proper fix).

---

## Internationalization (i18n)

The frontend uses `i18next` + `react-i18next` + `i18next-http-backend`, loading resources from `client/public/locales/{lang}/translation.json`. The selected language persists in `localStorage` under `i18nextLng`; RTL languages automatically set `dir="rtl"` on `<html>`.

**Currently shipped (14 of 21 planned languages):** `en, es, pt, fr, it, de, nl, ru, tr, zh, ja, ko, id, vi`
**Planned but not yet added:** `hi, bn, mr, ta, te, ur, ar` (`ar`/`ur` are RTL)

All new UI text should go through `t('key')` — never hardcode English strings — and the key must be added to every locale file. Dashboard achievement names look up `dashboard.achievements.{id}.name` with an English `defaultValue` fallback so untranslated languages degrade gracefully.

`npm run translate` (`server/scripts/translate-content.js`) can bootstrap new locale files via `google-translate-api-x`.

---

## Accessibility

Dyslexia-friendly typography (Fredoka font, `letter-spacing: 0.05em`, `line-height: 1.6`, `word-spacing: 0.1em`) is applied **globally by default** rather than behind a toggle. There is currently no user-facing high-contrast or OpenDyslexic-font switch — see [`docs/design-guide.md`](./docs/design-guide.md) for the full accessibility standards this project targets (WCAG 2.1 AA) and for gaps to close.

| Feature | Status |
|---|---|
| Dyslexia-friendly base typography | Done — applied globally |
| Keyboard navigation | Implemented on interactive elements |
| Alt text / form labels | Implemented across pages |
| Text-to-Speech / Speech Recognition | Done — Web Speech API in Speak/Listen modules |
| Toggleable dyslexia font / high-contrast mode | Not yet implemented |

---

## Design System

### Look & Feel

The app uses a dark, deep-space theme (`radial-gradient` navy background) with an ambient animated 3D "brick" backdrop (`components/Background3D`) shared across every page, and Framer Motion for page/element transitions.

| Token | Value | Usage |
|---|---|---|
| Background | `#16234a → #060912` (radial gradient) | App-wide background |
| Font | Fredoka | Primary UI typeface, 18px base |

Full design guidelines are in [docs/design-guide.md](./docs/design-guide.md).

---

## Deployment

Production deployment (Hostinger VPS, Nginx + PM2 + MongoDB Atlas, domain `quizify.cloud`) is documented step-by-step in [DEPLOY.md](./DEPLOY.md), including the three-cluster/four-secret environment setup, Nginx reverse-proxy config, and the redeploy checklist.

---

## Branch Strategy & Contributing

We use a **feature-branch workflow**. No one pushes directly to `main`.

### Branch Rules

| Rule | Detail |
|---|---|
| Branch from `main` | Always create branches off `main` |
| Pull Requests | All merges require at least one reviewer approval |
| Commit convention | Use prefixes below |
| No force push to `main` | Protected branch |

### Commit Message Convention

```
feat:      New feature
fix:       Bug fix
docs:      Documentation changes
style:     Formatting, missing semicolons, etc.
refactor:  Code restructuring without behavior change
test:      Adding or updating tests
chore:     Maintenance tasks (deps, config)
```

### Contributing Steps

1. Create a feature branch off `main`
2. Make focused, well-scoped changes
3. Commit with the convention above
4. Open a PR against `main` with a clear description
5. Request review from at least one teammate
6. Add a daily standup entry in `updates/daily/YYYY-MM-DD.md`

### Update Reports

Progress reports live in `updates/`:

- **Daily standup** — `updates/daily/YYYY-MM-DD.md`
  - What did I do? / What will I do? / Any blockers?
- **Weekly sprint summary** — `updates/weekly/week-NN-YYYY.md`
  - Goals, Achievements, Upcoming work, Team notes

---

## Roadmap

Based on the 16-week plan in [PROJECT_PLAN.md](./PROJECT_PLAN.md):

| Phase | Focus | Status |
|---|---|---|
| Phase 1 — Foundation | Scaffolding, design system, auth, gamification engine | Done |
| Phase 2 — Core Learning | 12 learning modules, 3 mini-games, TTS, round scoring, student dashboard | Done |
| Phase 3 — Platform | Multi-role auth (admin/super-admin/teacher), batch-scoped question uploads, i18n, org onboarding & chat | Mostly done — i18n at 14/21 languages |
| Phase 4 — AI Features | ml5.js, gesture recognition, emotion detection, sound models | Planned |
| Phase 5 — Launch Hardening | Accessibility toggle, full i18n coverage, cross-browser/perf audit | Planned |

---

## The Team

<div align="center">

| Role | Name | Responsibilities |
|---|---|---|
| Project Owner | **Sutirtha Chakraborty** | Product vision, architecture, project management |
| Developer | **Parichay Dutta Biswas** | Full-stack development, feature implementation |
| Company Owner | **Raunak** | Strategic direction, business requirements |

</div>

---

## About the Company

<div align="center">

```
╔══════════════════════════════════════════════════════╗
║           FUTURESIGHT ANALYTICS LIMITED              ║
║                                                      ║
║       Data & AI Consultancy and Recruitment          ║
║            Registered in Ireland                     ║
╚══════════════════════════════════════════════════════╝
```

</div>

**Futuresight Analytics Limited** is a Data & AI consultancy and recruitment firm registered in Ireland. We partner with organizations to unlock the power of data-driven decision-making and AI innovation.

| Service | Description |
|---|---|
| Consultancy | Data strategy, AI implementation, digital transformation |
| Recruitment | Connecting top data & AI talent with leading organizations |

| Channel | Details |
|---|---|
| Email | [talent@futuresightanalytics.eu](mailto:talent@futuresightanalytics.eu) |
| Phone | [+353 899 77 66 44](tel:+353899776644) |

---

## License

This repository does not currently include a published `LICENSE` file. All rights reserved by **Futuresight Analytics Limited** unless/until a license is added — contact the team above for usage terms.

---

## Acknowledgements

- [WCAG 2.1](https://www.w3.org/TR/WCAG21/) — Web Content Accessibility Guidelines
- [MongoDB Atlas](https://www.mongodb.com/atlas) — Cloud database hosting
- [Firebase](https://firebase.google.com/) — Google OAuth integration
- [Cloudinary](https://cloudinary.com/) — Image hosting for organization logos
- [i18next](https://www.i18next.com/) — Internationalization framework
- All educators, parents, and children who inspired this work

---

<div align="center">

Made with care by the **Easy Learn** team at **Futuresight Analytics Limited**

*Registered in Ireland*

[![Futuresight Analytics](https://img.shields.io/badge/Futuresight%20Analytics-Data%20%26%20AI-blue?style=for-the-badge)](mailto:talent@futuresightanalytics.eu)

</div>
