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
**Admin**, who is in turn approved/managed by a single **Super Admin**. Admins can invite
**Teachers** (backed by the existing Tutor record) who log in independently to manage
their assigned batches and submit new questions for the admin to review.

## 2. Tech stack

| Layer | Stack |
|---|---|
| Client | React 19 + Vite, React Router 7, Redux Toolkit, react-i18next, Framer Motion, Recharts, Firebase Auth (Google popup) |
| Server | Node + Express 4, Mongoose 8, JWT (`jsonwebtoken`), `express-validator`, `multer` + Cloudinary (uploads), `bcryptjs`, `exceljs` (question-upload templates/parsing) |
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
  pages/teacher/     TeacherLogin, TeacherDashboard, TeacherBatchDetail, TeacherQuestionUpload
  components/        shared UI: Navbar, RoundComplete, ContactForm, LanguageSwitcher, Background3D, ...
  components/Admin/  admin+teacher shared UI: DataTable, Modal, StatCard, SearchBar, BatchDetail,
                     QuestionBatchDetailModal, ScheduleEditor, WeeklyScheduleGrid, MultiSelect(Modal)
  store/slices/       one Redux slice per content collection + dashboardSlice
  context/            AuthContext (student), AdminAuthContext (org admin + super admin + teacher — tri-role)
  firebase/auth.js    Firebase app init
  i18n/i18n.js        i18next setup
  utils/              warriorBonus, sounds, speechLang, questionLang, designations, authHeaders
  data/lessons.js     static lesson data used by Learn page

server/
  routes/, controllers/, models/   one triplet per content type (see §5.1) plus admin/superadmin/teacher/auth/dashboard/contact
  models/admin/        Organization, OrgAdmin, Tutor, Student, Parent, Batch, Subject   (adminDb)
  models/superadmin/   Organization, GlobalSettings, ChatMessage, QuestionUploadBatch   (superAdminDb — see §4 gotcha)
  models/*.js (root)   default-DB content + activity models (StudentActivity, StudentRound, StudentAchievement, User, ContactMessage, ...)
  db/adminDb.js, db/superAdminDb.js   the two extra Mongoose connections
  middleware/          authMiddleware (student), adminAuth, superadminAuth, teacherAuth, upload (multer/Cloudinary), validate
  validators/          express-validator chains per form
  config/cloudinary.js Cloudinary SDK config (org-logo uploads only, see §5.4)
  utils/constants.js   DESIGNATION_OPTIONS / ORG_TYPE_OPTIONS / PHONE_REGEX (mirrored in client/src/utils/designations.js — keep in sync)
  utils/performance.js getPerformanceForEmail() — joins adminDb Student/Tutor to default-DB activity data
  utils/questionModels.js     the fixed MODULES × SUBJECTS registry (see §5.1) used by both public content routes and the teacher upload flow
  utils/questionVisibility.js buildQuestionVisibilityFilter() — batch-scoped visibility join for teacher-uploaded questions (see §5.1/§5.4)
  services/batchService.js
  data/*.json           seed content per subject/skill
  scripts/              seed-all.js, translate-content.js, migrate-subjects-from-legacy.js
```

## 4. The three-database architecture (read this twice)

The server holds **three separate MongoDB connections**, each with its own env var and
its own set of Mongoose models:

1. **Default connection** (`MONGODB_URI`, via `mongoose.connect` in `server.js`) — all
   learning content (Listen/Read/Write/Speak/Learn/games question banks) and all student
   activity (`StudentActivity`, `StudentRound`, `StudentAchievement`, `User`). Records here
   are keyed by the student's **email string**, not by an ObjectId relation.
2. **adminDb** (`ADMIN_MONGODB_URI`, `server/db/adminDb.js`) — org-side data:
   `Organization`, `OrgAdmin`, `Tutor`, `Student`, `Parent`, `Batch`, `Subject`. A `Tutor`
   doc is also the login identity for the **Teacher** role (see §5.4) — there is no
   separate Teacher model.
3. **superAdminDb** (`SUPERADMIN_MONGODB_URI`, `server/db/superAdminDb.js`) — the super
   admin's view: a **mirrored `Organization`** model (kept in sync manually — see below),
   `GlobalSettings`, `ContactMessage`, `ChatMessage`, and `QuestionUploadBatch`.
   **`QuestionUploadBatch` lives here for historical reasons even though only Admins and
   Teachers use it today** (super admin's question-review path was fully removed — see
   §5.4). Don't confuse it with the unrelated adminDb `Batch` model (a class/roster
   grouping) — same word, different collection, different database.

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

**These are no longer public reads.** `GET /` and `GET /:id` now sit behind the same
`dashboardAuth` middleware the dashboard uses (JWT or `user_session` cookie) and are
**batch-scoped per student**: `server/utils/questionVisibility.js`'s
`buildQuestionVisibilityFilter(email, module, subject)` joins the requesting student's
email → adminDb `Student.batchIds` → matching `QuestionUploadBatch` docs, and returns a
Mongo filter of `{uploadBatchId: null}` (developer/seed content) **or**
`{uploadBatchId: {$in: <ids>}}` (that student's batch's approved teacher uploads) — never
both. A student who belongs to an org (has a `Student` record at all) sees **only** their
batch's approved uploads, never seed content, even if nothing matches (see
`getAllQuestions`'s `noOrgQuestions` flag, surfaced to the frontend so it can render a
distinct empty state instead of falling back silently). A student with no `Student`
record sees seed/dev content only. Question docs themselves gained `status`
(`pending`/`approved`/`rejected`), `uploadBatchId`, and `submittedBy` fields for
teacher-submitted rows (`uploadBatchId: null` on all seed data).
**Known gap:** there's no client-side `ProtectedRoute`/login-gate on the 4 module pages,
so an anonymous visitor now gets a 401 that surfaces as the module's generic "server
error, retry" screen rather than a proper login prompt — `Dashboard.jsx`'s
`useAuth()`-based pattern (spinner while `user === undefined`, login prompt while
`user === null`) is the template to copy if this gets fixed.

Not every subject has every skill (e.g. Spelling/Memory/Puzzle are English-only games,
not per-subject modules). The 12 content modules and their subjects (`english`, `maths`,
`science`) are a **fixed registry** in `server/utils/questionModels.js` (`MODULES`,
`SUBJECTS`, `getQuestionModel()`) shared by the public routes above and the teacher
upload flow (§5.4/§7.1) — this is a different, unrelated concept from the admin
dashboard's **Subjects** section (§5.4), which lets an org define arbitrary named
subjects (e.g. "History") purely for batch scheduling/teacher assignment. Adding a
Subject there does **not** create a new question bank or module.

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
| Teacher | Firebase Google popup only — no self-registration; must match an existing `Tutor` by email | JWT (`TEACHER_JWT_SECRET`), stored client-side under `TEACHER_JWT_KEY` in `localStorage` | `middleware/teacherAuth.js` (requires `payload.role === 'teacher'`) |
| Super Admin | single hardcoded account from `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD` env vars | JWT (`SUPERADMIN_JWT_SECRET`) | `middleware/superadminAuth.js` |

There is exactly one super admin account (env-configured, not a DB row) — don't build
multi-super-admin assumptions into new code without checking with the team first.

**Teacher login is not self-registration.** `TeacherLogin.jsx` signs in via Firebase, then
`server/controllers/teacherAuthController.js` looks up a `Tutor` by email; if none exists
it 404s with "Ask your organization admin to add you first." On first successful login it
links the Firebase `uid` to that `Tutor` doc and flips `authStatus` from `unclaimed` →
`active`, then signs the JWT. `client/src/context/AdminAuthContext.jsx` is a tri-role
context now — it holds separate state/localStorage keys and
`teacherGoogleSignIn`/`teacherLogout` functions alongside the pre-existing admin/superadmin
ones, all exposed via one `useAdminAuth()` hook.

### 5.4 Admin / Super-Admin / Organization lifecycle

- Org registration (`POST /api/admin/org`) is **reversible**: `approveOrg`/`rejectOrg` in
  `superadminController.js` have no status guard, so an org can be approved → rejected →
  approved again freely. Rejections push `{reason, rejectedAt}` onto a
  `rejectionHistory[]` array (kept on both `Organization` copies) — full history is always
  preserved and shown to the super admin.
- **Resubmission / editing**: `registerOrg` now doubles as "edit organization" for **any**
  status, not just `rejected`. If the org is currently `approved` or `rejected`, editing
  resets it to `pending` (`needsResubmission = status === 'approved' || status === 'rejected'`)
  so the super admin re-reviews it; editing a still-`pending` org just updates in place
  without touching status. It does **not** push a new `rejectionHistory` entry on plain
  resubmission — that was already recorded when the org was rejected. (This was a real bug
  once — don't reintroduce it.) The admin UI's button label follows status: "Resubmit
  Registration" when `rejected`, "Edit Organization" otherwise.
- **Admin can edit Tutor and Student records in place**, not just create/delete them —
  `updateTutor`/`updateStudent` (+ matching validators) in `adminController.js`, wired as
  `PATCH /api/admin/tutors/:id` and `PATCH /api/admin/students/:id`, surfaced as an "Edit"
  pencil action next to each row in the Tutors/Students tables.
- File uploads: **org logos** go straight to **Cloudinary** (`server/config/cloudinary.js`,
  folder `org-logos`, via `multer-storage-cloudinary` — the controller reads the
  Cloudinary secure URL off `req.file.path`). **Avatars** and **contact attachments** still
  use local-disk `multer.diskStorage` under `server/uploads/{avatars,contact-attachments}/`
  (gitignored) and are served statically at `/uploads/*`; `fileUrl()` builds that absolute
  URL. **Question-upload spreadsheets** use `multer.memoryStorage()` (so the controller can
  validate the buffer before touching disk) and are then archived to
  `server/uploads/question-uploads/` for audit purposes. `handleUpload()` wraps multer
  errors as JSON 400s regardless of which storage backend is in play.
- **Teacher role and batch/subject/schedule model** (added alongside the above): a
  **Teacher is a `Tutor` record that has logged in** — see §5.3 for the auth flow. Once
  logged in, a Teacher only sees batches/students where they're actually assigned
  (`server/controllers/teacherController.js`, scoped by `orgId` + `tutorIds`/
  `directTutorIds`/subject-level `teacherIds`):
  - `Batch` now has a nested `subjects: [{ subject, teacherIds[], schedule[] }]` array
    (migrated from a legacy single-subject-string shape via
    `scripts/migrate-subjects-from-legacy.js`) plus a `directTutorIds[]` for teachers
    assigned to the whole batch. A teacher may only edit the weekly schedule for a subject
    **they personally teach** within a batch (403 otherwise); admins can assign/remove
    teachers and subjects freely via `client/src/components/Admin/BatchDetail.jsx`
    (roster / teachers / subjects tabs, using `ScheduleEditor` + `WeeklyScheduleGrid`).
  - `Subject` (adminDb) is a per-org, admin-managed list of arbitrary subject names used
    only for this batch/schedule bookkeeping — **not** the same thing as the fixed
    `english`/`maths`/`science` subjects in `questionModels.js` (§5.1). English, Maths,
    Science are auto-created as `Subject` docs when an org registers.
  - **Question upload/review workflow**: a Teacher picks a module + one of the 3 content
    subjects, downloads an `.xlsx` template (`GET /api/teacher/questions/template`),
    uploads the filled sheet along with which of their batch(es) it should be visible to.
    `teacherQuestionController.uploadQuestions` parses it with `exceljs` (validates rows,
    max 500/upload, rejects any batch the teacher isn't assigned to), creates a
    `QuestionUploadBatch` doc (`status: 'pending'`) and inserts the question docs with
    `status: 'pending', submittedBy: teacher.id`. Teachers can view/edit only their own
    pending uploads; they cannot approve them.
  - **Admin approves/rejects** via the "Question Review" dashboard section
    (`server/controllers/adminQuestionController.js`, routes under
    `/api/admin/questions/*`, all scoped to the admin's own `orgId`). Approve/reject is
    reversible (no status guard, same design as org approve/reject) and cascades onto
    every question doc in that upload batch via `updateMany({uploadBatchId}, ...)`.
    Rejections push to a `rejectionHistory[]`. Admin can also edit individual question
    fields post-submission (`PATCH /api/admin/questions/:module/:subject/:id`, any field
    except `_id, __v, status, submittedBy, uploadBatchId, createdAt, updatedAt,
    translations, id`) via the shared `QuestionBatchDetailModal` component — the same
    component the Teacher dashboard reuses for its own (view/edit-only) uploads list.
  - **Super Admin has no question-review capability** — that path existed briefly and was
    fully removed once approval authority moved to the org admin; don't reintroduce a
    superadmin question-review route/section.
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
TEACHER_JWT_SECRET= / TEACHER_JWT_EXPIRES_IN=
SUPER_ADMIN_EMAIL= / SUPER_ADMIN_PASSWORD=
CLOUDINARY_CLOUD_NAME= / CLOUDINARY_API_KEY= / CLOUDINARY_API_SECRET=   org-logo uploads only
CLIENT_URL=               comma-separated allowed CORS origins
PORT=                     defaults to 5000
```

Client (`client/.env`, see `client/.env.example`): `VITE_FIREBASE_*` keys and
`VITE_API_BASE_URL`.

## 6. Frontend patterns

### 6.1 Routing (`client/src/App.jsx`)

Flat route table, no nested layouts beyond a conditional Navbar
(`hideNavbar` list for login/dashboard-style full-bleed pages, which now also includes
`/teacher-login` and `/teacher-dashboard`). Notable dynamic routes:
`/subject/:subject`, `/module/:skill/:subject` (skill ∈ listen/read/write/speak),
`/games/:gameName`. `RoleSelect.jsx` (mounted at `/`) has **four** role cards — Student,
Admin/Parents, Teacher, Super Admin — routing to `/login`, `/admin-login`,
`/teacher-login`, `/superadmin-login` respectively.

### 6.2 Redux slices

One slice per backend content collection (`client/src/store/slices/*Slice.js`), registered
1:1 in `store/store.js`. Each module/game page dispatches its own slice's fetch thunk on
mount. All 12 content slices now send an auth header (via the shared
`client/src/utils/authHeaders.js`, reading `jwt_token`/`firebase_jwt` from `localStorage` —
the same pattern `dashboardSlice.js` already had its own private copy of) since their
routes require login (§5.1), and their thunks return `{data, noOrgQuestions}` so the
module pages can render the batch-scoped empty state. `dashboardSlice.js` is the exception
otherwise — it aggregates thunks for stats, activity, achievements, performance, module
stars, session logging, and round logging/history, and is used across many pages
(Dashboard, SubjectPage's star display, every module/game).

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
  `client/public/locales/{lang}/translation.json`. **14 languages supported** (defined in
  `LanguageSwitcher.jsx`'s `LANGUAGES` const and matching the 14 folders on disk): `en, es,
  pt, fr, it, de, nl, ru, tr, zh, ja, ko, id, vi` (English, Spanish, Portuguese, French,
  Italian, German, Dutch, Russian, Turkish, Chinese, Japanese, Korean, Indonesian,
  Vietnamese). The `dir="rtl"` mechanism exists (`i18n.js`'s `RTL_LANGUAGES` const,
  currently `['he']`) but **no RTL language is actually shipped** — there's no
  `client/public/locales/he/` (or `ar`/`ur`) folder and none of the 14 supported codes are
  in `RTL_LANGUAGES`, so `dir` is always `ltr` in practice today. Selected language
  persists in `localStorage` under `i18nextLng`.
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
matching cookie/JWT. `context/AdminAuthContext.jsx` is a **tri-role** JWT-only context —
org admin, super admin, and teacher each get their own state/localStorage key and
sign-in/logout functions on the one context, all exposed via `useAdminAuth()`. Super admin
auth is handled inline in `SuperAdminLogin.jsx` + its own JWT in `localStorage` (no
separate context — it's a single-screen dashboard flow); the same is true of Teacher, whose
sign-in lives in `TeacherLogin.jsx` but stores/reads its JWT through `AdminAuthContext`.

### 6.6 Background3D

`components/Background3D/Background3D.jsx` is a **global, fixed, full-viewport decorative
layer** — mounted unconditionally in `App.jsx`'s `AppLayout`, so it renders behind every
route (role select, all logins, student pages, all three panel dashboards). It's **pure
CSS 3D transforms, not three.js/WebGL**: a handful of absolutely-positioned "brick" divs
tilt via a `mousemove`/`touchmove`/`deviceorientation`-driven `requestAnimationFrame` loop
that lerps a `rotateX/rotateY` transform on the container. It's `aria-hidden` and
`pointer-events: none`, and early-returns (no animation loop at all) when
`prefers-reduced-motion: reduce` is set. Several page-level CSS modules (Hero, Dashboard,
GamesPage, Learn, Login, SubjectPage, AdminDashboard, the game/module pages,
SuperAdminDashboard) were adjusted alongside it so their own backgrounds stay transparent
enough for this layer to show through — if you touch page background/backdrop styles,
check whether that adjustment still holds.

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
8. If teachers should be able to submit questions for it via the upload flow (§5.4), also
   add it to `server/utils/questionModels.js`'s `MODULES`/`SUBJECTS`/`questionModels` map
   and drop a matching `.xlsx` template in the teacher template directory — the upload
   flow and public content routes both read from this one registry, so a module missing
   here won't appear in the Teacher's module/subject dropdowns even if its own
   route/controller/model exist.

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
  `answer`, ...) with no relations, plus the teacher-upload fields (`status`,
  `uploadBatchId`, `submittedBy`) — seed via the `/seed` POST endpoint or
  `scripts/seed-all.js`, never assume migrations exist (`migrate-subjects-from-legacy.js`
  is the one exception, a one-off for the `Batch.subjects[]` shape change).
- **Cloudinary is only wired up for org-logo uploads** — don't assume avatars, contact
  attachments, or question spreadsheets are on Cloudinary too; they're still local disk
  under `server/uploads/` (§5.4).
- **`QuestionUploadBatch` (superAdminDb) vs `Batch` (adminDb)** are unrelated models that
  happen to share a name fragment — the former is a question-upload/review event, the
  latter is a class/roster grouping. Don't conflate them.
- No automated test suite currently exists in this repo; verification for past features was
  done via throwaway Node scripts hitting the real dev databases directly (see git history)
  or by manually driving the UI. Confirm with the user before assuming Jest/Vitest/etc. are
  set up.
