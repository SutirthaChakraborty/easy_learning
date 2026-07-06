# Learningo (easy_learning) — Design Guide

Read this before touching the code. It explains how the app is put together and gives
copy-paste recipes for the changes developers make most often (new subject module, new
game, new language, new achievement, new admin feature). If you're doing one of those,
jump straight to the **"How to add..."** section — you shouldn't need to read the actual
source files first.

## 1. What this is

A learning platform for dyslexic children ("Learningo"). Kids practice English/Maths/
Science through four skill modules (Listen, Read, Write, Speak) plus three standalone
games (Spelling, Memory Match, Word Puzzle). Progress (XP, stars, streaks, achievements)
is tracked on a personal dashboard. Schools/organizations can be onboarded by an org
**Admin**, who is in turn approved/managed by a single **Super Admin**.

## 2. Tech stack

| Layer | Stack |
|---|---|
| Client | React 19 + Vite, React Router 7, Redux Toolkit, react-i18next, Framer Motion, Recharts, Firebase Auth (Google popup) |
| Server | Node + Express 4, Mongoose 8, JWT (`jsonwebtoken`), `express-validator`, `multer` (uploads), `bcryptjs` |
| DB | MongoDB — **three separate connections/databases**, see §4 |
| No | GraphQL, WebSockets/socket.io (notifications use plain polling), TypeScript |

Root has no shared `package.json` scripts — `client/` and `server/` are run independently
(`npm run dev` in each).

## 3. Repo map

```
client/src/
  pages/            top-level routed pages (Home, Learn, SubjectPage, GamesPage, Dashboard, ...)
  pages/modules/     the 4 skill-module pages: ListenModule, ReadModule, WriteModule, SpeakModule
  pages/games/       SpellingGame, MemoryGame, PuzzleGame
  pages/admin/       AdminDashboard (org admin)
  pages/superadmin/  SuperAdminDashboard
  components/        shared UI: Navbar, RoundComplete, ContactForm, LanguageSwitcher, ...
  store/slices/       one Redux slice per content collection + dashboardSlice
  context/            AuthContext (student), AdminAuthContext (org admin)
  firebase/auth.js    Firebase app init
  i18n/i18n.js        i18next setup
  utils/              warriorBonus, sounds, speechLang, questionLang, designations
  data/lessons.js     static lesson data used by Learn page

server/
  routes/, controllers/, models/   one triplet per content type (see §5.1) plus admin/superadmin/auth/dashboard/contact
  models/admin/        Organization, OrgAdmin, Tutor, Student, Parent, Batch  (adminDb)
  models/superadmin/   Organization, GlobalSettings, ChatMessage             (superAdminDb)
  models/*.js (root)   default-DB content + activity models (StudentActivity, StudentRound, StudentAchievement, User, ContactMessage, ...)
  db/adminDb.js, db/superAdminDb.js   the two extra Mongoose connections
  middleware/          authMiddleware (student), adminAuth, superadminAuth, upload (multer), validate
  validators/          express-validator chains per form
  utils/constants.js   DESIGNATION_OPTIONS / ORG_TYPE_OPTIONS / PHONE_REGEX (mirrored in client/src/utils/designations.js — keep in sync)
  utils/performance.js getPerformanceForEmail() — joins adminDb Student/Tutor to default-DB activity data
  data/*.json           seed content per subject/skill
  scripts/              seed-all.js, translate-content.js
```

## 4. The three-database architecture (read this twice)

The server holds **three separate MongoDB connections**, each with its own env var and
its own set of Mongoose models:

1. **Default connection** (`MONGODB_URI`, via `mongoose.connect` in `server.js`) — all
   learning content (Listen/Read/Write/Speak/Learn/games question banks) and all student
   activity (`StudentActivity`, `StudentRound`, `StudentAchievement`, `User`). Records here
   are keyed by the student's **email string**, not by an ObjectId relation.
2. **adminDb** (`ADMIN_MONGODB_URI`, `server/db/adminDb.js`) — org-side data:
   `Organization`, `OrgAdmin`, `Tutor`, `Student`, `Parent`, `Batch`.
3. **superAdminDb** (`SUPERADMIN_MONGODB_URI`, `server/db/superAdminDb.js`) — the super
   admin's view: a **mirrored `Organization`** model (kept in sync manually — see below),
   `GlobalSettings`, `ContactMessage`, `ChatMessage`.

**`Organization` is intentionally duplicated** across adminDb and superAdminDb. Any
controller that changes org status/fields (approve, reject, resubmit, logo, designation)
must write to **both** copies. There's no automatic sync — if you add a field to one
`Organization` model, add it to the other too, and update both write sites.

Cross-DB joins are done in application code by string keys, never Mongo `$lookup`:
`SAOrganization.adminOrgId` / `adminUid` cross into adminDb; a student/tutor's `email`
crosses into the default-DB activity collections (see `utils/performance.js`).

## 5. Backend patterns

### 5.1 The "content module" pattern

Every subject × skill combination follows an identical 4-file shape:

```
server/routes/<skill><Subject>.js        e.g. readEnglish.js
server/controllers/<skill><Subject>Controller.js
server/models/<Skill><Subject>.js
server/data/<skill>_<subject>.json        seed data
```

Routes are always the same 4 endpoints:

```js
router.post('/seed', seedQuestions)     // wipes + reinserts from data/*.json
router.get('/', getAllQuestions)        // sorted by id
router.get('/:id', getQuestionById)
router.delete('/all', deleteAllQuestions)
```

Mounted in `server.js` under `/api/<skill>/<subject>` (e.g. `/api/read/english`).
No auth on these — question banks are public reads. Not every subject has every skill
(e.g. Spelling/Memory/Puzzle are English-only games, not per-subject modules).

Full inventory: Listen/Read/Write/Speak × {English, Maths, Science} = 12 modules, plus
Spell-English, Memory-Match, Word-Puzzle, and the standalone `Learn` collection (used by
the `/learn` lesson browser, has an extra `translations` mixed field for pre-translated
content).

### 5.2 Dashboard, activity & scoring

- `models/StudentActivity.js` — one doc per student per day: `sessions[]`, `totalMinutes`,
  `totalXP`, `totalSessions`. Powers the heatmap/streaks.
- `models/StudentRound.js` — one doc per completed round of 10 questions: `email`,
  `module`, `subject`, `mode`, `stars`, `bonusStars`, `totalStars`, `passed`, `completedAt`.
- `models/StudentAchievement.js` — earned badges, keyed by `email` + `achievementId`.
- `controllers/dashboardController.js` — `logSession`, `logRound`, `getStats`,
  `getActivity`, `getAchievements`, `getPerformance`, `getRounds`, plus the `ACHIEVEMENTS`
  array (16 badges) and `checkAndAwardAchievements()`.
- Routes live under `/api/dashboard/*`, all behind `dashboardAuth` middleware
  (`middleware/authMiddleware.js`) which accepts **either** a JWT `Authorization: Bearer`
  header **or** the Firebase-backed `user_session` cookie — this is what lets both login
  methods (see §6.4) hit the same endpoints.

**Round system**: every module/game caps a round at exactly 10 questions (not infinite
cycling). 1 star per correct answer. "Warrior mode" passes at 6+ correct, with a speed
bonus per correct answer (`client/src/utils/warriorBonus.js`: ≤10s → +5, ≤15s → +4, ≤20s
→ +3 bonus stars). On the 10th question a `RoundComplete` overlay
(`client/src/components/RoundComplete/`) shows the result and calls `logRound`.

**Session/round logging pattern used in every module component**: accumulate progress in
`useRef`s during play (`roundStarsRef`, `roundBonusRef`, `wordStartRef`/`gameStartRef`,
`sessionLoggedRef` to guard against double-logging), then **snapshot the refs into React
state** (`roundResult`) at the moment the round finishes — never read refs directly during
render, they won't trigger re-renders and can be stale. `RoundComplete` and the dashboard
call both read from that state snapshot.

### 5.3 Auth — three independent systems

| Who | Login | Token | Middleware |
|---|---|---|---|
| Student | Firebase Google popup **or** email/password | Firebase → session cookie (`POST /api/auth/session`, `httpOnly` cookie) **or** JWT in `localStorage` (`jwt_token`) | `authMiddleware.dashboardAuth` accepts either |
| Org Admin | email/password | JWT (`ADMIN_JWT_SECRET`) | `middleware/adminAuth.js` |
| Super Admin | single hardcoded account from `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD` env vars | JWT (`SUPERADMIN_JWT_SECRET`) | `middleware/superadminAuth.js` |

There is exactly one super admin account (env-configured, not a DB row) — don't build
multi-super-admin assumptions into new code without checking with the team first.

### 5.4 Admin / Super-Admin / Organization lifecycle

- Org registration (`POST /api/admin/org`) is **reversible**: `approveOrg`/`rejectOrg` in
  `superadminController.js` have no status guard, so an org can be approved → rejected →
  approved again freely. Rejections push `{reason, rejectedAt}` onto a
  `rejectionHistory[]` array (kept on both `Organization` copies) — full history is always
  preserved and shown to the super admin.
- **Resubmission**: if an admin re-registers while their org is `rejected`, `registerOrg`
  edits the existing doc in place (same `_id`), clears `rejectionReason`, sets `status:
  'pending'`. It does **not** push a new `rejectionHistory` entry — that was already
  recorded when the org was rejected. (This was a real bug once — don't reintroduce it.)
- File uploads (org logo, avatar, contact attachment) go through `middleware/upload.js`
  (multer), land in `server/uploads/{org-logos,avatars,contact-attachments}/` (gitignored),
  and are served statically at `/uploads/*`. `handleUpload()` wraps multer errors as JSON
  400s; `fileUrl()` builds the absolute URL stored on the doc.
- Admin↔Super-Admin **chat**: `models/superadmin/ChatMessage.js`, keyed by `adminUid`
  (string, matching how `Organization.adminUid` crosses DBs — not an ObjectId ref).
  `readByAdmin`/`readBySuperadmin` are two separate booleans since either side can send.
  Admin side: `GET/POST /api/admin/chat`, `GET /api/admin/chat/unread-count`. Super admin
  side: `GET /api/superadmin/chat` (one row per adminUid via aggregate), `GET/POST
  /api/superadmin/chat/:id` (id = org's `_id`, resolved to `adminUid` server-side), `GET
  /api/superadmin/chat/unread-count`. **Route order matters**: `/chat/unread-count` must
  be declared before `/chat/:id` in Express or `:id` swallows it.
- **No WebSockets anywhere in this app.** Unread badges are plain `setInterval` polling
  (~25s) against the unread-count endpoints. If you need real-time updates for a new
  feature, this is the existing pattern to extend, not a reason to introduce socket.io.
- Public (non-admin) contact: `POST /api/contact`, no auth, role ∈
  {student, admin, teacher, parent, other} — separate from the authenticated admin↔super
  admin chat.
- `utils/performance.js` → `getPerformanceForEmail(email)` is the one shared function that
  joins an adminDb Student/Tutor to their default-DB `StudentActivity`/`StudentRound`/
  `StudentAchievement` docs. Both `adminController.getStudentPerformance` and
  `superadminController.getOrgStudentPerformance` call it — reuse it for any new
  performance view instead of re-writing the join.

### 5.5 Env vars (server/.env)

```
MONGODB_URI=              default DB (content + student activity)
ADMIN_MONGODB_URI=        org/admin DB
SUPERADMIN_MONGODB_URI=   super-admin DB
JWT_SECRET= / JWT_EXPIRES_IN=
ADMIN_JWT_SECRET= / ADMIN_JWT_EXPIRES_IN=
SUPERADMIN_JWT_SECRET= / SUPERADMIN_JWT_EXPIRES_IN=
SUPER_ADMIN_EMAIL= / SUPER_ADMIN_PASSWORD=
CLIENT_URL=               comma-separated allowed CORS origins
PORT=                     defaults to 5000
```

Client (`client/.env`, see `client/.env.example`): `VITE_FIREBASE_*` keys and
`VITE_API_BASE_URL`.

## 6. Frontend patterns

### 6.1 Routing (`client/src/App.jsx`)

Flat route table, no nested layouts beyond a conditional Navbar
(`hideNavbar` list for login/dashboard-style full-bleed pages). Notable dynamic routes:
`/subject/:subject`, `/module/:skill/:subject` (skill ∈ listen/read/write/speak),
`/games/:gameName`.

### 6.2 Redux slices

One slice per backend content collection (`client/src/store/slices/*Slice.js`), registered
1:1 in `store/store.js`. Each module/game page dispatches its own slice's fetch thunk on
mount. `dashboardSlice.js` is the exception — it aggregates thunks for stats, activity,
achievements, performance, module stars, session logging, and round logging/history, and
is used across many pages (Dashboard, SubjectPage's star display, every module/game).

### 6.3 Pages vs. modules vs. games

- `pages/*.jsx` — top-level routed screens (Home, Learn, SubjectPage, GamesPage,
  Dashboard, Login, ContactUs, RoleSelect).
- `pages/modules/*.jsx` — the 4 generic skill players (ListenModule, ReadModule,
  WriteModule, SpeakModule). Each is parameterized by `:subject` from the URL and fetches
  from the matching Redux slice — there is **one** `ReadModule.jsx` for all three
  subjects, not three separate files.
- `pages/games/*.jsx` — the 3 standalone games, each subject-agnostic (English only).

### 6.4 i18n

- `i18next` + `react-i18next` + `i18next-http-backend`; locale files at
  `client/public/locales/{lang}/translation.json`. **21 languages supported**: `en, hi, bn,
  mr, ta, te, ur, es, pt, fr, it, de, nl, ru, tr, ar, zh, ja, ko, id, vi`. RTL languages
  (`ar`, `ur`) auto-set `dir="rtl"` on `<html>`. Selected language persists in
  `localStorage` under `i18nextLng`.
- **Never hardcode UI strings** — always `t('some.key')`, and add the key to every locale
  file (even if just copy the English string as a placeholder — missing keys silently fall
  back to English via `defaultValue`).
- Dashboard keys live under `dashboard.*` (e.g. `dashboard.stats.*`,
  `dashboard.achievements.<id>.name`). Achievement i18n pattern: backend sends
  `achievement.id` (e.g. `first_step`); frontend does
  `t(\`dashboard.achievements.${id}.name\`, { defaultValue: ach.name })`.

### 6.5 Auth on the client

`context/AuthContext.jsx` (students) listens to Firebase `onAuthStateChanged` **and**
checks a `jwt_token` in `localStorage`, exposing a unified `user` shape (`{ uid, email,
name, photoURL, authType }`). On Firebase login it POSTs to `/api/auth/session` to mint the
matching cookie/JWT. `context/AdminAuthContext.jsx` is the separate, JWT-only context for
org admins. Super admin auth is handled inline in `SuperAdminLogin.jsx` + its own JWT in
`localStorage` (no context — it's a single-screen dashboard flow).

## 7. How to add a new feature

### 7.1 Add a new subject or skill content module

1. Copy an existing triplet, e.g. for a new "Write History" module: duplicate
   `server/routes/writeEnglish.js` → `writeHistory.js`, `writeEnglishController.js` →
   `writeHistoryController.js`, `models/WriteEnglish.js` → `models/WriteHistory.js` (rename
   the Mongoose model string too), and add `server/data/write_history.json` seed data
   matching the schema.
2. Mount the route in `server.js`: `app.use('/api/write/history', writeHistoryRoutes)`.
3. (Optional) add the model to `scripts/seed-all.js`'s `SEEDS` array so it re-seeds with
   everything else.
4. Client: duplicate a slice, e.g. `writeEnglishSlice.js` → `writeHistorySlice.js`
   (change the API path), register it in `store/store.js`.
5. If it's a new **subject** (not just a new skill on an existing subject), add it to the
   subject list in `SubjectPage.jsx` (`subjectIcons`, translation keys under
   `subjectPage.<subject>.*` in every locale file) and wherever subjects are listed
   (`Learn.jsx`, `Home.jsx`).
6. If it's a new **skill** on an existing subject, `pages/modules/<Skill>Module.jsx`
   already exists and is subject-generic — just point it at the new slice for that
   subject's route param, no new page needed.
7. Wire dashboard logging: call `logDashboardSession({ module, subject, durationMinutes,
   xpEarned, score })` and, if it follows the round-of-10 pattern, `logRoundResult(...)` on
   completion — copy the ref-then-snapshot-to-state pattern from an existing module (§5.2).

### 7.2 Add a new game

Follow the same content-module triplet as §7.1, but mount under `/api/game/<name>` and add
the page under `pages/games/`, plus a route + card in `GamesPage.jsx`. Games don't take a
`:subject` param.

### 7.3 Add a new language

1. Copy `client/public/locales/en/translation.json` to `client/public/locales/<code>/` and
   translate every key.
2. Add `<code>` to the supported-languages list in `LanguageSwitcher` component and to the
   RTL list in `i18n.js` if it's RTL.
3. `server/scripts/translate-content.js` can machine-translate seed JSON content if the new
   language needs translated question banks (uses `google-translate-api-x`) — check
   `Learn.js`'s `translations` mixed field for the pattern of storing per-language content
   inline versus a separate collection.

### 7.4 Add a new achievement/badge

Add an entry to the `ACHIEVEMENTS` array in `dashboardController.js` (id, name, criteria
check inside `checkAndAwardAchievements()`), then add
`dashboard.achievements.<id>.name`/`.description` keys to every locale file. No frontend
code change needed — the achievement grid renders from whatever the API returns.

### 7.5 Add a new admin/super-admin feature that touches org data

Remember §4: if it reads/writes `Organization`, update **both** the adminDb and
superAdminDb models/controllers, or your change will silently only apply to one side.
Add validation via a new chain in `validators/` + `middleware/validate.js`, not ad-hoc
checks in the controller. If it needs a cross-DB join, extend or reuse
`utils/performance.js` rather than duplicating the join logic.

## 8. Gotchas / conventions worth remembering

- **Express route order**: any router with both a literal path and a `:param` catch-all
  (e.g. chat's `/unread-count` vs `/:id`) must declare the literal path first.
- **No `.env.example` at repo root or in `server/`** — only `client/.env.example` exists.
  When setting up a new environment, cross-check §5.5's var list against a real `.env` a
  teammate has, since there's nothing to copy from in-repo.
- **`server/uploads/` is gitignored** — don't expect uploaded files to survive a fresh
  clone or deploy without a volume/bucket.
- Designation/org-type option lists must be kept in sync by hand between
  `server/utils/constants.js` and `client/src/utils/designations.js`.
- Content model schemas are intentionally simple (`id`, `title`, `question`, `options`,
  `answer`, ...) with no relations — seed via the `/seed` POST endpoint or
  `scripts/seed-all.js`, never assume migrations exist.
- No automated test suite currently exists in this repo; verification for past features was
  done via throwaway Node scripts hitting the real dev databases directly (see git history)
  or by manually driving the UI. Confirm with the user before assuming Jest/Vitest/etc. are
  set up.
