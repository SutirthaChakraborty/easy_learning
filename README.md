<div align="center">

<img src="https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=for-the-badge" />
<img src="https://img.shields.io/badge/Version-0.1.0-blue?style=for-the-badge" />
<img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" />
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
- [Database Models](#database-models)
- [Authentication System](#authentication-system)
- [Accessibility](#accessibility)
- [Design System](#design-system)
- [Branch Strategy & Contributing](#branch-strategy--contributing)
- [Roadmap](#roadmap)
- [The Team](#the-team)
- [About the Company](#about-the-company)
- [License](#license)

---

## About the Project

**Easy Learn** is an accessible, gamified web learning platform designed for **children aged 5–14 with dyslexia and other learning disabilities**. It combines multi-sensory learning techniques with game mechanics to make education engaging and effective for every type of learner.

The platform covers **three core subjects** — English, Mathematics, and Science — each with four learning modes: Listen, Read, Write, and Speak. Mini-games reinforce skills, while an XP and badge system keeps children motivated.

**Built by Futuresight Analytics Limited** (Ireland).

---

## Key Features

| Feature | Description | Status |
|---|---|---|
| Multi-Sensory Modules | Listen, Read, Write, Speak — four modes per subject | In Progress |
| Dyslexia Mode | OpenDyslexic font, wider letter spacing, color overlays | In Progress |
| Gamification Engine | XP points, levels, badges, streaks, leaderboards | In Progress |
| Mini-Games | Spelling Bee, Memory Match, Word Puzzle | In Progress |
| Dual Authentication | Google OAuth (Firebase) + Email/Password (JWT) | Done |
| Text-to-Speech | Web Speech API integration for all content | Planned |
| Progress Dashboard | Real-time reports for parents and teachers | Planned |
| AI Personalization | Adaptive difficulty, emotion detection, gesture input | Future |
| Multi-Language Support | Additional languages beyond English | Future |

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Build tool & dev server |
| React Router | 7 | Client-side routing |
| Redux Toolkit | 2 | Global state management |
| Firebase Auth | 12 | Google OAuth integration |
| Framer Motion | 12 | Animations and transitions |
| React Icons | 5 | SVG icon library |
| Fredoka (fontsource) | 5 | Primary UI font |
| CSS Modules | — | Component-scoped styles |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | >= 18 | Server runtime |
| Express | 4 | REST API framework |
| MongoDB (Atlas) | 7 | NoSQL database |
| Mongoose | 8 | MongoDB ODM |
| JSON Web Token | 9 | Token-based authentication |
| bcryptjs | 3 | Password hashing |
| cors | 2 | Cross-origin request handling |
| dotenv | 16 | Environment variable management |
| nodemon | 3 | Dev auto-restart |

### Planned AI/ML (Phase 3–4)

| Technology | Purpose |
|---|---|
| ml5.js | Face detection, pose estimation, sound classification |
| TensorFlow.js | Custom model inference in-browser |
| Teachable Machine | Train custom gesture/sound models |
| Web Speech API | Text-to-speech, speech recognition |
| MediaPipe Hands | Real-time hand tracking |

---

## Project Structure

```
easy_learning/                          ← Monorepo root
│
├── client/                             ← React + Vite frontend (port 3000)
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env                            ← Firebase API key (copy from .env.example)
│   └── src/
│       ├── main.jsx                    ← App entry point, Redux Provider
│       ├── App.jsx                     ← Router + all page routes
│       ├── index.css                   ← Global styles, design tokens
│       ├── components/                 ← Reusable UI components
│       │   ├── Navbar/
│       │   ├── Hero/
│       │   ├── Card/
│       │   ├── Button/
│       │   ├── Modal/
│       │   ├── Loader/
│       │   ├── Footer/
│       │   ├── AudioPlayer/
│       │   ├── ProgressBar/
│       │   └── ToggleSwitch/
│       ├── pages/                      ← Route-level pages
│       │   ├── Home.jsx
│       │   ├── Learn.jsx
│       │   ├── SubjectPage.jsx
│       │   ├── GamesPage.jsx
│       │   ├── modules/                ← Learning module players
│       │   │   ├── ListenModule.jsx
│       │   │   ├── ReadModule.jsx
│       │   │   ├── WriteModule.jsx
│       │   │   └── SpeakModule.jsx
│       │   └── games/                  ← Mini-game pages
│       │       ├── SpellingGame.jsx
│       │       ├── MemoryGame.jsx
│       │       └── PuzzleGame.jsx
│       ├── store/                      ← Redux store + slices
│       │   └── store.js                ← 16 slices (one per module/subject combo)
│       ├── context/
│       │   ├── AuthContext.jsx         ← Auth state (JWT + Firebase)
│       │   ├── ProgressContext.jsx     ← XP, badges, streak state
│       │   └── ThemeContext.jsx        ← Dyslexia mode, contrast toggle
│       ├── firebase/
│       │   └── auth.js                 ← Firebase init + Google sign-in
│       ├── data/
│       │   └── lessons.js              ← Hardcoded fallback lesson data
│       ├── utils/                      ← Pure utility functions
│       └── assets/                     ← Images, sounds, backgrounds
│
├── server/                             ← Node.js + Express API (port 5000)
│   ├── server.js                       ← Express app entry point, route mounting
│   ├── package.json
│   ├── .env                            ← Secrets (copy from .env.example)
│   ├── routes/                         ← Route definitions (16+ files)
│   │   ├── auth.js
│   │   ├── readEnglish.js
│   │   ├── readMaths.js
│   │   ├── readScience.js
│   │   ├── listenEnglish.js
│   │   ├── listenMaths.js
│   │   ├── listenScience.js
│   │   ├── writeEnglish.js
│   │   ├── writeMaths.js
│   │   ├── writeScience.js
│   │   ├── speakEnglish.js
│   │   ├── speakMaths.js
│   │   ├── speakScience.js
│   │   ├── spellEnglish.js
│   │   ├── memoryMatch.js
│   │   ├── wordPuzzle.js
│   │   └── learn.js
│   ├── controllers/                    ← Request handlers (mirror of routes/)
│   ├── models/                         ← Mongoose schemas (17 models)
│   ├── middleware/                     ← Auth middleware
│   ├── config/                         ← App configuration (db connection)
│   └── data/                           ← Seed data + seed script
│       ├── seed.js                     ← Populates all 17 collections
│       ├── read_english.json
│       ├── read_maths.json
│       ├── read_science.json
│       ├── listen_english.json
│       ├── listen_maths.json
│       ├── listen_science.json
│       ├── write_english.json
│       ├── write_maths.json
│       ├── write_science.json
│       ├── speak_english.json
│       ├── speak_maths.json
│       ├── speak_science.json
│       ├── spell_english.json
│       ├── memory_match.json
│       ├── word_puzzle.json
│       └── learn.json
│
├── docs/
│   └── design-guide.md                 ← Typography, colors, accessibility standards
├── updates/                            ← Daily & weekly team progress reports
│   ├── daily/                          ← YYYY-MM-DD.md
│   └── weekly/                         ← week-NN-YYYY.md
├── setup.sh                            ← Auto-install (Linux/macOS)
├── setup.bat                           ← Auto-install (Windows CMD)
├── setup.ps1                           ← Auto-install (Windows PowerShell)
├── PROJECT_PLAN.md                     ← 16-week development roadmap
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js >= 18** — [nodejs.org](https://nodejs.org)
- **npm >= 9** (bundled with Node.js)
- **Git** — [git-scm.com](https://git-scm.com)
- A MongoDB Atlas account (or local MongoDB instance)
- A Firebase project (for Google OAuth)

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

# Start frontend only  →  http://localhost:3000
npm run client

# Start backend only   →  http://localhost:5000
npm run server
```

### Seeding the Database

Populate all 17 MongoDB collections with lesson and game data:

```bash
cd server && npm run seed
```

This runs `server/data/seed.js` and inserts all JSON fixture data.

---

## Environment Variables

### Server — `server/.env`

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_strong_random_secret_here
JWT_EXPIRES_IN=7d
```

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Express server port (default: 5000) |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `CLIENT_URL` | Yes | Frontend origin for CORS |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens — change before production |
| `JWT_EXPIRES_IN` | No | Token TTL (default: `7d`) |

### Client — `client/.env`

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
```

The remaining Firebase config values (authDomain, projectId, etc.) are set inside `client/src/firebase/auth.js`.

---

## API Reference

Base URL: `http://localhost:5000`

All responses follow the shape:

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

#### `POST /api/auth/register`

Register a new user with email and password.

**Request body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "<jwt>",
  "user": { "id": "...", "name": "Jane Smith", "email": "jane@example.com" }
}
```

---

#### `POST /api/auth/login`

Login with email and password, returns a JWT.

**Request body:**
```json
{
  "email": "jane@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "<jwt>",
  "user": { "id": "...", "name": "Jane Smith", "email": "jane@example.com" }
}
```

---

#### `POST /api/auth/session`

Sync a Firebase Google OAuth user to the server session (sets an httpOnly cookie).

**Request body:**
```json
{
  "uid": "firebase_uid",
  "email": "jane@example.com",
  "displayName": "Jane Smith"
}
```

---

#### `GET /api/auth/session`

Returns the currently authenticated session user.

---

#### `DELETE /api/auth/session`

Clears the session cookie (logout for Firebase users).

---

### Learning Content Endpoints

All content endpoints share the same four operations. Replace `{module}` with one of `read`, `listen`, `write`, `speak` and `{subject}` with one of `english`, `maths`, `science`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/{module}/{subject}` | Get all questions for this module/subject |
| `GET` | `/api/{module}/{subject}/:id` | Get a single question by ID |
| `POST` | `/api/{module}/{subject}/seed` | Seed this collection from JSON data |
| `DELETE` | `/api/{module}/{subject}/all` | Delete all content in this collection |

**Available combinations (12 total):**

| Module | English | Maths | Science |
|---|---|---|---|
| `read` | `/api/read/english` | `/api/read/maths` | `/api/read/science` |
| `listen` | `/api/listen/english` | `/api/listen/maths` | `/api/listen/science` |
| `write` | `/api/write/english` | `/api/write/maths` | `/api/write/science` |
| `speak` | `/api/speak/english` | `/api/speak/maths` | `/api/speak/science` |

**Example — `GET /api/read/english`:**

```json
{
  "success": true,
  "count": 5,
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

**Example — `GET /api/listen/english`:**

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 1,
      "sentence": "The cat sat on the mat.",
      "level": "beginner",
      "emoji": "🐱",
      "xp": 10
    }
  ]
}
```

---

### Mini-Game Endpoints

#### Spelling Bee — `/api/spell/english`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/spell/english` | Get all spelling words |
| `GET` | `/api/spell/english/:id` | Get a single word |

**Response shape:**
```json
{
  "id": 1,
  "word": "beautiful",
  "hint": "Something pleasing to the eye",
  "difficulty": "medium",
  "emoji": "🌸"
}
```

#### Memory Match — `/api/game/memory-match`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/game/memory-match` | Get card pair sets |

**Response shape:**
```json
{
  "id": 1,
  "difficulty": "easy",
  "pairs": [
    { "word": "cat", "image": "cat.png", "emoji": "🐱" }
  ]
}
```

#### Word Puzzle — `/api/game/word-puzzle`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/game/word-puzzle` | Get puzzle challenges |

**Response shape:**
```json
{
  "id": 1,
  "letters": ["d", "o", "g"],
  "answer": "dog",
  "difficulty": "easy",
  "emoji": "🐶"
}
```

---

## Database Models

MongoDB is used with Mongoose. There are **17 collections** total.

### User

```
users
├── name         String  required
├── email        String  required, unique
├── passwordHash String  required (bcryptjs)
├── createdAt    Date    auto
└── updatedAt    Date    auto
```

### Learning Content (pattern — applies to all 12 module/subject combos)

**Read (ReadEnglish, ReadMaths, ReadScience):**
```
id        Number
title     String
content   String
question  String
options   [String]
answer    String
emoji     String
```

**Listen (ListenEnglish, ListenMaths, ListenScience):**
```
id        Number
sentence  String
level     String   (beginner | intermediate | advanced)
emoji     String
xp        Number
```

**Write (WriteEnglish, WriteMaths, WriteScience):**
```
id        Number
character String
type      String   (letter | word | number | symbol)
hint      String
level     String
emoji     String
```

**Speak (SpeakEnglish, SpeakMaths, SpeakScience):**
```
id            Number
word          String
pronunciation String
level         String
emoji         String
```

### Game Models

**SpellEnglish:**
```
id         Number
word       String
hint       String
difficulty String
emoji      String
```

**MemoryMatch:**
```
id         Number
difficulty String
pairs      [{ word, image, emoji }]
```

**WordPuzzle:**
```
id         Number
letters    [String]
answer     String
difficulty String
emoji      String
```

---

## Authentication System

Easy Learn uses a **dual authentication strategy** to support both social login and traditional email/password accounts.

### Strategy 1 — Google OAuth via Firebase

1. User clicks "Sign in with Google"
2. Firebase redirects to Google's OAuth consent screen
3. On success, Firebase returns a user object client-side
4. Frontend sends the user's UID and profile to `POST /api/auth/session`
5. Server sets an httpOnly session cookie
6. `AuthContext` marks the user as authenticated

### Strategy 2 — Email/Password via JWT

1. User registers at `POST /api/auth/register` — password is hashed with bcryptjs before storage
2. On login at `POST /api/auth/login`, server compares the provided password against the hash
3. On success, server returns a signed JWT (expires in 7 days by default)
4. Frontend stores the JWT in `localStorage` under the key `jwt_token`
5. Subsequent requests include the token in the Authorization header
6. `AuthContext` validates the token on every app load

### Auth Context API

Located at `client/src/context/AuthContext.jsx`. Provides:

| Value / Method | Type | Description |
|---|---|---|
| `user` | Object | Current authenticated user, or `null` |
| `registerManual(name, email, password)` | Function | Create a new account |
| `loginManual(email, password)` | Function | Sign in with credentials |
| `logout()` | Function | Clear auth state and redirect to home |
| `getToken()` | Function | Retrieve JWT from localStorage |

### Protected Routes

All lesson and game pages require authentication. Components use the `useAuth()` hook and redirect unauthenticated users to `/login`.

---

## Accessibility

Easy Learn targets **WCAG 2.1 Level AA** compliance.

| Feature | Implementation |
|---|---|
| Dyslexia Font | OpenDyslexic via `ThemeContext` toggle |
| Letter Spacing | 0.05em globally; increased in dyslexia mode |
| Line Height | 1.6 base; 1.8+ in dyslexia mode |
| Color Contrast | Minimum 4.5:1 for normal text, 3:1 for large text |
| High Contrast Mode | Toggle via Accessibility Toolbar |
| Keyboard Navigation | All interactive elements reachable via Tab |
| Focus Indicators | Visible on all focusable elements |
| Text-to-Speech | Web Speech API (planned full integration) |
| Alt Text | All images have descriptive alt attributes |
| Form Labels | All inputs have associated `<label>` elements |

---

## Design System

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| Primary | `#6c63ff` | Buttons, links, key accents |
| Secondary | `#ff6584` | Highlights, badge colors |
| Accent | `#43e97b` | Success states, XP bar fill |
| Warning | `#f7971e` | Streak indicators, alerts |
| Dark | `#1a1a2e` | Main background |
| Mid | `#16213e` | Section and card backgrounds |

### Typography

| Role | Font | Size |
|---|---|---|
| Primary (default) | Fredoka | 18px base |
| Dyslexia mode | OpenDyslexic | 18px base |
| Line height | — | 1.6 (body), 1.8 (dyslexia mode) |

Full design guidelines are in [docs/design-guide.md](./docs/design-guide.md).

---

## Branch Strategy & Contributing

We use a **feature-branch workflow**. No one pushes directly to `main`.

```
main
├── features-sutirtha      ← Architecture, project management
├── features-parichay      ← Frontend features
└── features-raunak        ← Business/strategic features
```

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

1. Checkout your assigned feature branch
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
| Phase 1 — Foundation | Scaffolding, design system, auth, gamification engine | Partially done |
| Phase 2 — Core Learning | All 12 learning modules, 3 mini-games, TTS, dashboards | In progress |
| Phase 3 — AI Features | ml5.js, gesture recognition, emotion detection, sound models | Planned |
| Phase 4 — Launch | Accessibility audit, performance, cross-browser testing, deploy | Planned |

---

## The Team

<div align="center">

| Role | Name | Branch | Responsibilities |
|---|---|---|---|
| Project Owner | **Sutirtha Chakraborty** | `features-sutirtha` | Product vision, architecture, project management |
| Developer | **Parichay Dutta Biswas** | `features-parichay` | Frontend development, feature implementation |
| Company Owner | **Raunak** | `features-raunak` | Strategic direction, business requirements |

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

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgements

- [OpenDyslexic](https://opendyslexic.org/) — Dyslexia-friendly typeface
- [WCAG 2.1](https://www.w3.org/TR/WCAG21/) — Web Content Accessibility Guidelines
- [MongoDB Atlas](https://www.mongodb.com/atlas) — Cloud database hosting
- [Firebase](https://firebase.google.com/) — Google OAuth integration
- All educators, parents, and children who inspired this work

---

<div align="center">

Made with care by the **Easy Learn** team at **Futuresight Analytics Limited**

*Registered in Ireland*

[![Futuresight Analytics](https://img.shields.io/badge/Futuresight%20Analytics-Data%20%26%20AI-blue?style=for-the-badge)](mailto:talent@futuresightanalytics.eu)

</div>
