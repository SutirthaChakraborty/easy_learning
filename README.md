# Learningo — User Manual

A guide for the people who *use* Learningo day to day: students, parents, organization
admins, and the platform super admin. For how the app is built, see
[design-guide.md](./design-guide.md) — this document is about what you can click and what
happens when you do.

## Contents

1. [Getting started](#1-getting-started)
2. [For Students](#2-for-students)
3. [For Parents](#3-for-parents)
4. [For Admins (Schools / Coaching Centres)](#4-for-admins-schools--coaching-centres)
5. [For Teachers](#5-for-teachers)
6. [For the Super Admin](#6-for-the-super-admin)
7. [Language support](#7-language-support)
8. [Contact & support](#8-contact--support)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Getting started

When you open the site, you land on a **role selection screen** with five cards:

| Card | Who it's for | Where it sends you |
|---|---|---|
| **Student** | Kids using the lessons | Student sign-in page |
| **Parent** | A parent/guardian who wants to add their kids and watch their progress, with no organization involved | Parent sign-in page |
| **Admin** | Anyone running or supervising a school or coaching centre | Admin sign-in page |
| **Teacher** | Teachers/tutors an Admin has already added, who need to manage their own batches | Teacher sign-in page |
| **Super Admin** | The single platform operator who approves organizations | Super Admin sign-in page |

Pick the card that matches your role and click **Sign In**. You'll also notice a subtle,
animated 3D background across every page — it's purely decorative and doesn't affect any
functionality (it automatically stays still if your device/browser has "reduce motion"
enabled).

---

## 2. For Students

### 2.1 Signing in

On the Student sign-in page you can either:

- **Continue with Google** — one click, no password to remember, or
- **Sign in with email and password** — use the toggle at the bottom of the card to switch
  between "Sign In" and "Sign Up" if you don't have an account yet.

Once signed in you're taken to the **Home** page.

### 2.2 Navigating the app

The top navigation bar (visible on every page except sign-in/dashboard-style full-screen
pages) gives you:

- **Home** — back to the main screen
- **About Us** — the Learningo story and mission
- **Games** — the Game Zone, home to the Camera Games (see §2.4)
- **Dashboard** — your personal progress page (see §2.5)
- **Contact Us** — reach the Learningo team with a question or issue
- A **language switcher** — change the app's language at any time (see §7)
- **Logout**

### 2.3 Learning modules

The Home page has a **Start/Continue Adventure** button and three **subject cards**:
**English**, **Mathematics**, and **Science**. Picking a subject card opens that
subject's page with four skill modules:

| Module | Skill | XP per round |
|---|---|---|
| **Listen** | Listening comprehension | 30 XP |
| **Read** | Reading comprehension | 20 XP |
| **Write** | Writing practice | 15 XP |
| **Speak** | Speaking practice | 10 XP |

Every module is played in **rounds of exactly 10 questions**, and each module has a
**Practice / Warrior** toggle:

- **Practice** — untimed, no pass/fail — just play and earn 1 star per correct answer.
- **Warrior** — timed per question, and the round is graded **Passed** (6 or more correct
  out of 10) or **Failed**. Answering fast earns bonus stars on top of the normal star per
  correct answer: within 10 seconds → +5 bonus stars, within 15 seconds → +4, within 20
  seconds → +3.

When you finish the 10th question, a **Round Complete** screen shows your result and saves
it to your dashboard automatically.

### 2.4 Games

The **Games** link in the navigation bar opens the **Game Zone** (`/games`), home to the
**Camera Games** — over sixty activities you play by moving. You see yourself on screen and
reach out to touch, trace, sort, freeze and copy. They need a camera and nothing else; no
controller, no touchscreen.

The games are grouped by what they practise rather than by theme:

| Group | What it works on |
| --- | --- |
| **Body & Reach** | reaching, aiming, using two hands, crossing the middle |
| **Look & Find** | spotting the right one, listening, reading, space words |
| **Stop & Think** | waiting, freezing, ignoring distractions, changing rules |
| **Remember** | holding things in mind, copying an order, missing items |
| **Letters & Numbers** | sounds, spelling, writing in the air, counting, money |
| **Move & Copy** | rhythm, imitation, tracing, drawing |
| **My Day** | washing, dressing, packing, sorting, staying safe |
| **Talk & Together** | following instructions, feelings, asking for help |

**Do "Set Up My Space" first.** It is five easy stretches, it takes under a minute, and it
tells the games how far this particular child can comfortably reach so every target lands
somewhere they can actually get to. It is a measurement rather than a game, so it is the
one activity with no levels of its own.

A few things worth knowing:

- **Five levels per game, walked one at a time.** Clearing a level opens the next. A
  child who keeps trying and lands close is moved on rather than left stuck.
- **Points for playing more and for playing better.** Turns taken, turns right, help not
  needed, and beating your own best on that game.
- **Speed is never the point.** A slow, correct, unaided answer earns full marks — and
  earns the same points as a fast one. There is no buzzer and no losing points.
- **Everything is adjustable mid-game** — press the cog. Bigger targets, extra time (up to
  four times as long), seated play, one hand only, calm visuals, high contrast, voice-only
  or text-only instructions, vibration strength.
- **The camera never leaves the device.** No video, photo or frame is recorded, saved or
  uploaded. Only the measurements are kept, and only if you leave that switch on.
- **Progress** (`/games/ar/insights`) shows what was understood, how much help was needed,
  and thinking time and moving time as separate numbers, plus a Journey tab with the level
  reached in each game and which games a child is stuck on — and a CSV export. It works
  offline. There is an Erase button that really erases.

Developers and therapists: see [docs/AR-GAMES.md](./docs/AR-GAMES.md) for the engine
architecture, the prompt-fading ladder, how levels and points are worked out, what is
measured and the stated limits.

### 2.5 Your Dashboard

The Dashboard is your personal progress hub. At the top, a **Level badge** shows your
current level and an XP progress bar toward the next one, alongside two buttons:

- **Results** — opens a "My Answers" view with **Practice** and **Warrior** tabs, so you
  can review past answers.
- **Progress Map** — opens a full board-game-style map of all 12 module slots (3 subjects ×
  4 skills), showing which are Mastered, In Progress, or Not Started, with stars earned in
  each.

Below that:

- **Stats cards** — Total XP, Sessions completed, Today's activity time, current Streak
  (days in a row), and total Achievements earned.
- **Performance chart** — a trend line of your XP over the last 30 days.
- **Activity heatmap** — a calendar-style grid (like a contribution graph) showing which
  days you were active and how much you did, colored from light to dark by activity level.
  You can switch between years if you've been using the app for a while.
- **Achievements** — a grid of badges (grouped as Learning, Streak, XP Milestones,
  Special) you've earned or have yet to unlock, each showing the date earned or the XP
  reward needed.
- **Round History** — a scrollable list of your completed rounds, each showing the
  module/subject, Practice or Passed/Failed (Warrior), and stars earned.

Nothing needs to be logged manually — playing a module round automatically updates
your dashboard.

---

## 3. For Parents

The **Parent** role is for a parent or guardian who just wants to add their own kids and
keep an eye on their progress — no organization, batch, or admin required.

### 3.1 Signing in

Parent sign-in is **Google-only** — click **Continue with Google** on the Parent login page.
There's a **Back to Role Selection** link if you picked the wrong card. There's no
self-registration form; signing in with Google the first time creates your parent account
automatically.

### 3.2 My Kids

The **My Kids** section is where you manage your children:

- **Add Kid** — enter their Name, Age, and Email. The email is used to link the kid to
  their own Learningo student account, if they have one.
- **Edit** (pencil) or **Remove** any kid you've added.
- **Performance** (chart icon) — opens that kid's progress:
  - If their email matches a student account with recorded activity, you see their full
    **Dashboard** (stats, heatmap, chart, achievements, round history — the same view
    described in §2.5).
  - If not, you see a simple summary panel instead (Total XP, Sessions, Minutes, Average
    Score, Achievements), which reads as empty/zero until they've started learning under
    that email.

### 3.3 Chatting with the Super Admin

The **Chat with Us** section is a private, threaded chat with the Super Admin for account
questions or issues — the same pattern Admins use (see §4.6). Unread messages show a badge
that updates automatically every ~25 seconds.

---

## 4. For Admins (Schools / Coaching Centres)

The **Admin** role is for anyone who wants to register and run a group of students under an
organization — a school or a coaching centre.

### 4.1 Signing in

Admin sign-in is **Google-only** — click **Continue with Google** on the Admin login page.
There's a **Back to Role Selection** link if you picked the wrong card.

### 4.2 Registering your organization

The first time you sign in, your dashboard's **Overview** section shows a **Set Up Your
Organization** prompt. Go to the **Organization** section and click **Register Now** to
fill in:

- Organization Name
- Type (school, coaching centre, etc.)
- Address
- Phone
- **Your Designation** — how you're declaring yourself (Principal, Father, Mother, etc.;
  choose "Other" to specify your own)
- An optional Organization Logo

Submitting sends your organization to the **Super Admin for approval**. Your Organization
section will show a status: **Pending**, **Approved**, or **Rejected**.

- If **rejected**, you'll see the reason and can click **Resubmit Registration** to correct
  and resend — as many times as needed. A full history of past rejections is kept and shown
  to you.
- Once **Approved**, you'll see "Approved — you can now manage your team," and the rest of
  the dashboard unlocks.
- You can go back and **edit your organization's details at any time**, even after
  approval (button label changes to "Edit Organization" once approved). Editing an already
  **approved** organization sends it back to the Super Admin as **Pending** for
  re-approval — you'll see a note explaining this before you submit. Editing while still
  **Pending** just updates the details in place.

### 4.3 Running your organization

Once approved, the sidebar gives you:

| Section | What you do there |
|---|---|
| **Overview** | Summary counts of your Tutors, Batches, Students, Parents |
| **Organization** | View/edit your org's registration details and status |
| **Tutors** | Add and edit teachers (Name, Email, Phone, Subject, Status) |
| **Batches** | Create class groups (Name, Academic Year/Term, max students, description); manage each batch's student roster, whole-batch teachers, and per-subject teacher/schedule assignments (see §4.4) |
| **Subjects** | Define the named subjects your organization teaches, for batch scheduling purposes (English, Maths, and Science are created for you automatically when you register) |
| **Students** | Add and edit students (Name, Email, Age, Grade/Class, Status) |
| **Parents** | Add parent/guardian records for your organization's students and link them (with consent tracking) — separate from the standalone Parent portal in §3 |
| **Question Review** | Approve or reject question sets your Teachers upload, and edit individual questions (see §4.5) |
| **Reports** | Search a Tutor or Student by name, then open their performance view for detailed learning stats |
| **Messages** | A direct chat with the Super Admin (see §4.6) |

Each list (Tutors, Batches, Subjects, Students, Parents) uses the same pattern: an **Add**
button opens a form, and existing records show in a searchable table. Tutors and Students
also have an **Edit** (pencil) action to update their details in place, alongside **View
Performance** and **Delete**. You can also update your own **Edit Profile** details
(designation, phone, profile photo) from the sidebar.

### 4.4 Managing a batch's teachers, subjects, and schedule

Opening a batch (from the **Batches** section) gives you three tabs:

- **Roster** — the students currently in this batch, with a capacity indicator if you set
  a maximum.
- **Teachers** — teachers assigned to the batch as a whole, in addition to any assigned to
  a specific subject below.
- **Subjects** — add one or more of your organization's Subjects to this batch. For each
  subject you can assign one or more teachers and build a **weekly schedule** (day, time
  slot) shown both per-subject and as a combined weekly grid for the whole batch.

A teacher only sees and can manage batches (and, within a batch, only the subjects) they've
actually been assigned to — see §5.

### 4.5 Reviewing questions submitted by Teachers

The **Question Review** section lists every question upload your Teachers have submitted,
with stats for Total/Pending/Approved/Rejected and a status filter. For each upload you can:

- **View Questions** — open the full list of questions in that upload, and edit any of
  them if needed (e.g. fix a typo before approving).
- **Approve** — the questions become visible to students in the batch(es) the teacher
  targeted.
- **Reject** — you're prompted for a reason, which the teacher sees against that upload.

Approving and rejecting are **reversible**, just like organization approval — you can
change your mind later. Students only ever see **approved** questions, and only ones
uploaded for their own batch (or the built-in question bank, if they aren't in any batch).

### 4.6 Messaging the Super Admin

The **Messages** section is a private, threaded chat between you and the Super Admin — use
it for approval questions, platform issues, or anything that doesn't fit the public Contact
Us form. Unread messages show a badge that updates automatically every ~25 seconds.

---

## 5. For Teachers

The **Teacher** role is for individual tutors/teachers who've already been added to an
organization by its Admin (in the Admin's **Tutors** section) and want to manage their own
batches directly, instead of going through the Admin for everything.

### 5.1 Signing in

Teacher sign-in is **Google-only**, on the Teacher login page — click **Continue with
Google**. There's no self-registration: your Admin must have already added you as a Tutor
using the same email address as your Google account. If no matching record is found,
you'll see a message asking you to have your Admin add you first, and you won't be able to
proceed until they do.

### 5.2 My Batches

The Teacher dashboard's **My Batches** section lists only the batches your Admin has
assigned you to (whether as a whole-batch teacher or for a specific subject). Opening a
batch lets you:

- View and manage its student roster (add/remove students).
- Edit the weekly schedule, but **only for subjects you personally teach** in that batch —
  subject and teacher assignments themselves stay Admin-only.

If you don't see a batch you expect, ask your Admin to add you to it.

### 5.3 Uploading questions

The **Upload Questions** section lets you submit new questions for your students to
practice, subject to your Admin's approval:

1. Pick a **Module** (Listen, Read, Write, Speak) and a **Subject** (English, Maths,
   Science).
2. Click **Download template** to get a spreadsheet (.xlsx) with the right columns for
   that module/subject.
3. Fill it in and upload it, choosing which of your batch(es) it should be visible to
   (required — you must pick at least one).
4. The upload appears in **My Uploads** with a **Pending** status. You can open it to
   review or edit the questions while it's still pending.

Your Admin reviews each upload and either **approves** it (so it becomes visible to
students in the batch(es) you selected) or **rejects** it with a reason. You cannot
approve your own questions.

---

## 6. For the Super Admin

There is exactly **one** Super Admin account for the whole platform (set up by whoever
deploys/operates Learningo). It signs in with an **email and password** on the Super Admin
login page — there's no self-registration or Google sign-in for this role.

The Super Admin dashboard sidebar has:

| Section | What you do there |
|---|---|
| **Overview** | Platform-wide summary; flags pending organizations awaiting review |
| **Organizations** | Approve or reject registered organizations; filter by All / Pending / Approved / Rejected |
| **Admin Chat** | Threaded chat with every organization's admin (mirrors each admin's Messages section) |
| **Parent Chat** | Threaded chat with every standalone Parent account (mirrors each parent's Chat with Us section, §3.3) |
| **Contact Messages** | Public messages submitted via the Contact Us form by anyone (students, parents, admins, teachers, other) |
| **Reports** | Open an approved organization to view its Tutors' and Students' performance data |
| **Settings** | Global key/value platform settings (add, view, and describe platform-wide configuration values) |

### 6.1 Reviewing organizations

Each organization card shows its name, type, admin email, address, and registration date.
From here you can:

- **Approve** — unlocks the org's dashboard for its admin, and lets you set a
  **subscription plan** for it.
- **Reject** — prompts you for a reason, which the admin sees and can act on.

Approving and rejecting are **fully reversible** — you can approve, later reject, then
approve again if circumstances change. Every rejection (past and present) stays visible in
that org's **rejection history**, so nothing is lost even after re-approval.

Once an org is approved, click **View Admin / Teachers / Students** to drill into its
people and their performance data.

### 6.2 Handling contact messages

The **Contact Messages** section lists everything submitted through the public Contact Us
form (see §8) — separate from the private Admin Chat and Parent Chat, since anyone can
submit one without being logged in. Filter by status (**Open / In Progress / Resolved**)
and use **Reply & Resolve** to respond to a message and close it out.

---

## 7. Language support

Learningo currently supports **14 languages**:

English, Spanish, Portuguese, French, Italian, German, Dutch, Russian, Turkish, Chinese,
Japanese, Korean, Indonesian, and Vietnamese.

Use the **language switcher** (globe icon) in the navigation bar to change the app's
language at any time — your choice is remembered on that device for next time.

---

## 8. Contact & support

Anyone — student, parent/guardian, organization admin, teacher/tutor, or other — can reach
the Learningo team via **Contact Us** in the navigation bar. Fill in who you are, your name,
email, organization (optional), a subject, and your message (with an optional image/PDF
attachment); it goes straight to the Super Admin's **Contact Messages** list. No account is
required.

If you're already an org **Admin** or a signed-in **Parent**, prefer the **Messages** /
**Chat with Us** section on your dashboard instead — it's a direct, private conversation
with the Super Admin rather than a one-off form.

---

## 9. Troubleshooting

**"Continue with Google" isn't working / nothing happens**
Your browser is likely blocking the sign-in popup. Allow popups for this site and try
again. If the popup closes immediately, it may have been closed accidentally — just retry.

**I registered my organization but don't see anything unlocked yet**
New organizations start as **Pending** until the Super Admin reviews them. Check the
Organization section for the current status; you'll be notified of the outcome there.

**My organization was rejected — what now?**
Open the Organization section, review the stated reason, fix the issue, and click
**Resubmit Registration**. You can resubmit as many times as needed.

**I edited my organization's details and now it says Pending again**
That's expected — editing an already-approved organization sends it back to the Super
Admin for a quick re-approval. Your dashboard stays accessible in the meantime.

**Signing in as a Teacher says "no account found"**
Your Admin needs to add you as a Tutor (Name, Email, Phone, Subject) under their
**Tutors** section first, using the same email as the Google account you're signing in
with. Ask them to add you, then try signing in again.

**I added a kid on my Parent account but their Performance shows no activity**
The Performance view links to a real student account by matching the email you entered for
that kid. Make sure it's the exact email your child uses to sign in as a Student (see §2.1)
and that they've completed at least one round — the full dashboard only appears once
there's recorded activity under that email.

**A student can't see any questions in a module**
If they belong to an organization (added by an Admin/Teacher as a Student), they only see
questions approved for their specific batch — not the general question bank. If their
batch hasn't had any questions uploaded and approved yet for that module/subject, they'll
see a message saying so instead of questions; check with their Teacher/Admin.

**I don't see my progress/stars updating**
Progress logs automatically when you complete a round of 10 questions in a module —
make sure you reach the "Round Complete" screen rather than navigating away mid-round.

**The page is in the wrong language**
Use the language switcher in the navigation bar; your selection is saved per device, so
you'll need to reset it again on a new device or browser.
