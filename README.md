<div align="center">

<img src="https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=for-the-badge" />
<img src="https://img.shields.io/badge/Version-0.1.0-blue?style=for-the-badge" />
<img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" />
<img src="https://img.shields.io/badge/Platform-Web-orange?style=for-the-badge" />

<br /><br />

```
███████╗ █████╗ ███████╗██╗   ██╗    ██╗     ███████╗ █████╗ ██████╗ ███╗   ██╗
██╔════╝██╔══██╗██╔════╝╚██╗ ██╔╝    ██║     ██╔════╝██╔══██╗██╔══██╗████╗  ██║
█████╗  ███████║███████╗ ╚████╔╝     ██║     █████╗  ███████║██████╔╝██╔██╗ ██║
██╔══╝  ██╔══██║╚════██║  ╚██╔╝      ██║     ██╔══╝  ██╔══██║██╔══██╗██║╚██╗██║
███████╗██║  ██║███████║   ██║       ███████╗███████╗██║  ██║██║  ██║██║ ╚████║
╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝       ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝
```

# 🧠 Easy Learn — Gamified Learning for Every Mind

### *An inclusive, interactive learning platform built for dyslexic and learning-disabled children*

<br/>

> **"Every child deserves a learning experience that fits their mind — not the other way around."**

<br/>

---

</div>

## 🌟 About the Project

**Easy Learn** is an accessible, gamified web learning platform designed specifically for children with **dyslexia** and **other learning disabilities**. We believe that learning challenges should never limit a child's potential.

Through the power of:
- 🎮 **Gamification** — Points, badges, levels & rewards to keep kids engaged
- 🎨 **Accessible Design** — Dyslexia-friendly fonts, colors, and high contrast modes
- 🔊 **Multi-sensory Experience** — Audio cues, visual animations, and interactive exercises
- 📱 **Responsive Interface** — Works seamlessly across desktops, tablets, and phones
- 🤖 **AI-assisted Personalization** — Adaptive difficulty tailored to each learner's pace

...we create an environment where **every child can thrive**.

---

## 🎯 Key Features

| Feature | Description | Status |
|---------|-------------|--------|
| 🎮 Gamified Modules | Interactive lessons with XP, badges & leaderboards | 🚧 In Progress |
| 📖 Dyslexia Mode | OpenDyslexic font, letter spacing, color overlays | 🚧 In Progress |
| 🔊 Text-to-Speech | Read-aloud support with highlighted words | 📋 Planned |
| 🧩 Mini-Games | Word puzzles, pattern recognition, memory games | 📋 Planned |
| 📊 Progress Dashboard | Real-time parent/teacher reports | 📋 Planned |
| 🌍 Multi-Language | Support for multiple languages | 🔮 Future |
| 🤖 AI Tutor | Adaptive learning paths using AI | 🔮 Future |

---

## 🏗️ Project Architecture

This is a **full-stack monorepo** with a React + Vite frontend and a Node.js + Express backend, plus the original vanilla prototype files.

```
easy_learning/                     ← Monorepo root
│
├── 📁 client/                     ← React + Vite frontend (port 3000)
│   ├── index.html
│   ├── vite.config.js             # Vite config — proxies /api → server
│   ├── package.json
│   ├── .env.example               # Copy to .env and customise
│   └── 📁 src/
│       ├── main.jsx               # App entry point
│       ├── App.jsx                # Root component + router
│       ├── index.css              # Global styles / design tokens
│       ├── 📁 components/         # Reusable UI components (Navbar, etc.)
│       ├── 📁 pages/              # Route-level page components
│       ├── 📁 hooks/              # Custom React hooks (useFetch, etc.)
│       ├── 📁 services/           # Axios API helpers
│       ├── 📁 utils/              # Pure utility functions
│       └── 📁 assets/             # Images, SVGs, icons
│
├── 📁 server/                     ← Node.js + Express API (port 5000)
│   ├── server.js                  # Entry point — starts HTTP server
│   ├── package.json
│   ├── .env.example               # Copy to .env with real secrets
│   └── 📁 src/
│       ├── app.js                 # Express app — middleware + routes
│       ├── 📁 routes/             # Route definitions (testRoutes.js, …)
│       ├── 📁 controllers/        # Request handlers (testController.js, …)
│       ├── 📁 models/             # DB models / schemas
│       ├── 📁 middleware/         # Global middleware (errorHandler, …)
│       └── 📁 config/             # App configuration (db.js, …)
│
├── 📁 assets/                     ← Shared static assets (legacy)
├── 📁 css/                        ← Vanilla CSS (legacy prototype)
├── 📁 js/                         ← Vanilla JS modules (legacy prototype)
├── 📁 docs/                       ← Project documentation
├── 📁 updates/                    ← Team progress reports
│
├── index.html                     ← Legacy vanilla prototype entry point
├── package.json                   ← Root — `concurrently` scripts
├── .gitignore
├── setup.sh                       ← Auto-install script (Linux / macOS)
├── setup.bat                      ← Auto-install script (Windows CMD)
├── setup.ps1                      ← Auto-install script (Windows PowerShell)
└── README.md                      ← You are here 📍
```

### API Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/test` | Health-check — confirms API is live |

> Routes are added in `server/src/routes/` and wired into `server/src/app.js`.

---

## 👥 The Team

<div align="center">

| Role | Name | GitHub Branch | Responsibilities |
|------|------|---------------|-----------------|
| 🏆 **Project Owner** | **Sutirtha Chakraborty** | `features-sutirtha` | Product vision, project management, architecture decisions |
| 💻 **Developer** | **Parichay** | `features-parichay` | Frontend development, feature implementation, code quality |
| 🚀 **Company Owner** | **Raunak** | `features-raunak` | Strategic direction, business requirements, stakeholder management |

</div>

---

## 🏢 About the Company

<div align="center">

```
╔══════════════════════════════════════════════════════╗
║           🔭  FUTURESIGHT ANALYTICS LIMITED          ║
║                                                      ║
║       Data & AI Consultancy and Recruitment          ║
║            📍 Registered in Ireland                  ║
╚══════════════════════════════════════════════════════╝
```

</div>

**Futuresight Analytics Limited** is a premier **Data & AI consultancy and recruitment firm**, registered in Ireland. We partner with organizations to unlock the power of data-driven decision-making and AI innovation.

### 🌐 Our Offerings

| Service | Description |
|---------|-------------|
| 🔬 **Consultancy** | Data strategy, AI implementation, digital transformation |
| 🤝 **Recruitment** | Connecting top data & AI talent with leading organizations |

### 📞 Contact Us

| Channel | Details |
|---------|---------|
| 📧 **Email** | [talent@futuresightanalytics.eu](mailto:talent@futuresightanalytics.eu) |
| 📱 **Phone** | [+353 899 77 66 44](tel:+353899776644) |

---

## 🌿 Branch Strategy

We follow a **feature-branch workflow**:

```
main
├── features-sutirtha      ← Project owner's branch (architecture, PM tasks)
├── features-parichay      ← Developer's branch (feature development)
└── features-raunak        ← Company owner's branch (strategic features)
```

### Branch Guidelines

| Rule | Description |
|------|-------------|
| ✅ **Branch from `main`** | Always create feature branches off `main` |
| ✅ **Pull Requests** | All changes go through PRs with at least 1 reviewer |
| ✅ **Descriptive commits** | `feat:`, `fix:`, `docs:`, `chore:` prefixes |
| ✅ **No direct pushes to `main`** | All merges via reviewed PRs only |

### Commit Message Convention

```
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
style:    Formatting, missing semicolons, etc.
refactor: Code restructuring
test:     Adding or updating tests
chore:    Maintenance tasks
```

---

## 📅 Update Reports

We maintain **daily** and **weekly** progress reports in the `/updates` directory.

### 📋 Daily Standup Format
- Located at: `updates/daily/YYYY-MM-DD.md`
- Three key questions: *What did I do? What will I do? Any blockers?*

### 📊 Weekly Sprint Summary
- Located at: `updates/weekly/week-NN-YYYY.md`
- Covers: Goals, Achievements, Upcoming tasks, Team notes

> 📌 See the [Updates Directory](./updates/) for all reports.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js ≥ 18** — [nodejs.org](https://nodejs.org)
- **npm ≥ 9** (bundled with Node.js)
- [Git](https://git-scm.com/) for version control
- A code editor (we recommend [VS Code](https://code.visualstudio.com/))

### ⚡ One-Command Setup (Recommended)

The setup scripts install all dependencies for root, client, and server, and copy `.env.example` → `.env` automatically.

| OS | Command |
|----|---------|
| **Linux / macOS** | `bash setup.sh` |
| **Windows CMD** | `setup.bat` |
| **Windows PowerShell** | `powershell -ExecutionPolicy Bypass -File setup.ps1` |

### Manual Setup

```bash
# 1. Clone the repository
git clone https://github.com/SutirthaChakraborty/easy_learning.git
cd easy_learning

# 2. Install all dependencies (root + client + server)
npm run install:all

# 3. Copy environment files
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### Running the App

```bash
# Start BOTH client and server concurrently (recommended)
npm run dev

# Start only the React frontend  →  http://localhost:3000
npm run client

# Start only the Express API     →  http://localhost:5000
npm run server
```

The Vite dev server automatically proxies `/api/*` requests to the Express server, so you never have to worry about CORS during development.

---

## 🤝 Contributing

1. **Pick your branch** — Work on your assigned feature branch
2. **Make changes** — Follow the code style and accessibility guidelines
3. **Commit with convention** — Use the commit message format above
4. **Open a PR** — Request review before merging
5. **Update your report** — Add a daily update in `updates/daily/`

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [OpenDyslexic](https://opendyslexic.org/) — Dyslexia-friendly font
- [Web Content Accessibility Guidelines (WCAG 2.1)](https://www.w3.org/TR/WCAG21/) — Accessibility standards
- All the amazing educators, parents, and children who inspire this work 💛

---

<div align="center">

Made with ❤️ by the **Easy Learn** team at **Futuresight Analytics Limited**

*Registered in Ireland 🍀*

[![Futuresight Analytics](https://img.shields.io/badge/Futuresight%20Analytics-Data%20%26%20AI-blue?style=for-the-badge)](mailto:talent@futuresightanalytics.eu)

</div>
