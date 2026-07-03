# Learningo — User Manual

A guide for the people who *use* Learningo day to day: students, parents, organization
admins, and the platform super admin. For how the app is built, see
[design-guide.md](./design-guide.md) — this document is about what you can click and what
happens when you do.

## Contents

1. [Getting started](#1-getting-started)
2. [For Students](#2-for-students)
3. [For Admins (Schools / Coaching Centres / Parents)](#3-for-admins-schools--coaching-centres--parents)
4. [For the Super Admin](#4-for-the-super-admin)
5. [Language support](#5-language-support)
6. [Contact & support](#6-contact--support)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Getting started

When you open the site, you land on a **role selection screen** with three cards:

| Card | Who it's for | Where it sends you |
|---|---|---|
| **Student** | Kids using the lessons and games | Student sign-in page |
| **Admin / Parents** | Anyone running or supervising a school, coaching centre, or home-school group | Admin sign-in page |
| **Super Admin** | The single platform operator who approves organizations | Super Admin sign-in page |

Pick the card that matches your role and click **Sign In**.

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
- **Dashboard** — your personal progress page (see §2.5)
- **Contact Us** — reach the Learningo team with a question or issue
- A **language switcher** — change the app's language at any time (see §5)
- **Logout**

### 2.3 Learning modules

From Home, pick a **subject** — **English**, **Maths**, or **Science**. Each subject has
four skill modules:

| Module | Skill | XP per round |
|---|---|---|
| **Listen** | Listening comprehension | 30 XP |
| **Read** | Reading comprehension | 20 XP |
| **Write** | Writing practice | 15 XP |
| **Speak** | Speaking practice | 10 XP |

Every module is played in **rounds of exactly 10 questions**. You earn **1 star per correct
answer**. There's also a **Warrior Mode**: if you get at least 6 of 10 correct, answering
quickly earns bonus stars — answer within 10 seconds for +5 bonus stars, within 15 seconds
for +4, within 20 seconds for +3. When you finish the 10th question, a **Round Complete**
screen shows your result and saves it to your dashboard automatically.

### 2.4 Games

From the **Games** page you can play three standalone games (English only, not tied to a
specific subject module):

- **Spelling Game** (Easy)
- **Memory Match** (Medium)
- **Word Puzzle** (Hard)

Each game shows up to 3 stars based on your best performance, just like the subject
modules.

### 2.5 Your Dashboard

The Dashboard is your personal progress hub. It shows:

- **Stats cards** — Total XP, Sessions completed, Today's activity time, current Streak
  (days in a row), and total Achievements earned.
- **Activity heatmap** — a calendar-style grid (like a contribution graph) showing which
  days you were active and how much you did, colored from light to dark by activity level.
  You can switch between years if you've been using the app for a while.
- **Progress chart** — a trend line of your activity over time.
- **Achievements** — a grid of badges you've earned (and locked ones you haven't yet), each
  showing the date earned or the XP reward for unlocking it.

Nothing needs to be logged manually — playing a module or game round automatically updates
your dashboard.

---

## 3. For Admins (Schools / Coaching Centres / Parents)

The **Admin** role is for anyone who wants to register and run a group of students under an
organization — a school, a coaching centre, or even a single parent/family group.

### 3.1 Signing in

Admin sign-in is **Google-only** — click **Continue with Google** on the Admin login page.
There's a **Back to Role Selection** link if you picked the wrong card.

### 3.2 Registering your organization

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

### 3.3 Running your organization

Once approved, the sidebar gives you:

| Section | What you do there |
|---|---|
| **Overview** | Summary counts of your Tutors, Batches, Students, Parents |
| **Organization** | View/edit your org's registration details and status |
| **Tutors** | Add teachers (Name, Email, Phone, Subject) |
| **Batches** | Create class groups (Name, Subject, Description) and assign tutors/students to them |
| **Students** | Add students (Name, Email, Age, Grade/Class) |
| **Parents** | Add parent/guardian records and link them to students (with consent tracking) |
| **Reports** | Search a Tutor or Student by name, then open their performance view for detailed learning stats |
| **Messages** | A direct chat with the Super Admin (see §3.4) |

Each list (Tutors, Batches, Students, Parents) uses the same pattern: an **Add** button
opens a form, and existing records show in a searchable table.

### 3.4 Messaging the Super Admin

The **Messages** section is a private, threaded chat between you and the Super Admin — use
it for approval questions, platform issues, or anything that doesn't fit the public Contact
Us form. Unread messages show a badge that updates automatically every ~25 seconds.

---

## 4. For the Super Admin

There is exactly **one** Super Admin account for the whole platform (set up by whoever
deploys/operates Learningo). It signs in with an **email and password** on the Super Admin
login page — there's no self-registration or Google sign-in for this role.

The Super Admin dashboard sidebar has:

| Section | What you do there |
|---|---|
| **Overview** | Platform-wide summary; flags pending organizations awaiting review |
| **Organizations** | Approve or reject registered organizations; filter by All / Pending / Approved / Rejected |
| **Admin Chat** | Threaded chat with every organization's admin (mirrors each admin's Messages section) |
| **Contact Messages** | Public messages submitted via the Contact Us form by anyone (students, admins, teachers, parents, other) |
| **Reports** | Open an approved organization to view its Tutors' and Students' performance data |
| **Settings** | Global key/value platform settings (add, view, and describe platform-wide configuration values) |

### 4.1 Reviewing organizations

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

### 4.2 Handling contact messages

The **Contact Messages** section lists everything submitted through the public Contact Us
form (see §6) — separate from the private Admin Chat, since anyone can submit one without
being logged in as an org admin.

---

## 5. Language support

Learningo currently supports **21 languages**:

English, Hindi, Bengali, Marathi, Tamil, Telugu, Urdu, Spanish, Portuguese, French,
Italian, German, Dutch, Russian, Turkish, Arabic, Chinese, Japanese, Korean, Indonesian,
and Vietnamese.

Use the **language switcher** in the navigation bar to change the app's language at any
time — your choice is remembered on that device for next time. Arabic and Urdu
automatically switch the whole page to right-to-left layout.

---

## 6. Contact & support

Anyone — student, admin, teacher, parent, or a visitor who hasn't signed in — can reach the
Learningo team via **Contact Us** in the navigation bar. Fill in your name, email, a
subject, and your message (with an optional attachment); it goes straight to the Super
Admin's **Contact Messages** list. No account is required.

If you're already an org **Admin**, prefer the **Messages** section on your dashboard for
anything related to your organization's approval or account — it's a direct, private
conversation with the Super Admin rather than a one-off form.

---

## 7. Troubleshooting

**"Continue with Google" isn't working / nothing happens**
Your browser is likely blocking the sign-in popup. Allow popups for this site and try
again. If the popup closes immediately, it may have been closed accidentally — just retry.

**I registered my organization but don't see anything unlocked yet**
New organizations start as **Pending** until the Super Admin reviews them. Check the
Organization section for the current status; you'll be notified of the outcome there.

**My organization was rejected — what now?**
Open the Organization section, review the stated reason, fix the issue, and click
**Resubmit Registration**. You can resubmit as many times as needed.

**I don't see my progress/stars updating**
Progress logs automatically when you complete a round of 10 questions in a module or game —
make sure you reach the "Round Complete" screen rather than navigating away mid-round.

**The page is in the wrong language**
Use the language switcher in the navigation bar; your selection is saved per device, so
you'll need to reset it again on a new device or browser.
