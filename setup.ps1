#Requires -Version 5.1
<#
.SYNOPSIS
    Easy Learn — Project Setup Script (Windows PowerShell)
    Futuresight Analytics Limited

.DESCRIPTION
    Installs all dependencies for root, client, and server.
    Copies .env.example files to .env if they don't already exist.

.EXAMPLE
    # Run from the project root:
    powershell -ExecutionPolicy Bypass -File setup.ps1
#>

$ErrorActionPreference = 'Stop'

# ── Colour helpers ────────────────────────────────────────────────────────────
function Write-Info    { param($msg) Write-Host "  [INFO]  $msg" -ForegroundColor Cyan   }
function Write-Ok      { param($msg) Write-Host "  [ OK ]  $msg" -ForegroundColor Green  }
function Write-Warn    { param($msg) Write-Host "  [WARN]  $msg" -ForegroundColor Yellow }
function Write-Err     { param($msg) Write-Host "  [ERR ]  $msg" -ForegroundColor Red; exit 1 }

# ── Banner ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ================================================" -ForegroundColor Cyan
Write-Host "   Easy Learn — Project Setup (Windows PowerShell)" -ForegroundColor Cyan
Write-Host "   Futuresight Analytics Limited"                   -ForegroundColor Cyan
Write-Host "  ================================================" -ForegroundColor Cyan
Write-Host ""

# ── Prerequisite checks ───────────────────────────────────────────────────────
Write-Info "Checking prerequisites…"

# Node.js
try {
  $nodeVersion = (node -v 2>&1).ToString().Trim()
} catch {
  Write-Err "Node.js is not installed. Download from https://nodejs.org"
}

# Require Node >= 18
$nodeMajor = [int]($nodeVersion -replace 'v(\d+).*', '$1')
if ($nodeMajor -lt 18) {
  Write-Err "Node.js $nodeVersion detected but >=18 is required. Please upgrade."
}

# npm
try {
  $npmVersion = (npm -v 2>&1).ToString().Trim()
} catch {
  Write-Err "npm is not found. It should come bundled with Node.js."
}

Write-Ok "Node.js $nodeVersion detected"
Write-Ok "npm $npmVersion detected"
Write-Host ""

# ── Helper: run npm install with error handling ────────────────────────────────
function Invoke-NpmInstall {
  param([string]$label, [string]$prefix = '')

  Write-Info "$label"

  if ($prefix -ne '') {
    npm install --prefix $prefix
  } else {
    npm install
  }

  if ($LASTEXITCODE -ne 0) {
    Write-Err "$label failed (exit code $LASTEXITCODE)."
  }

  Write-Ok "$label — done."
  Write-Host ""
}

# ── Install dependencies ──────────────────────────────────────────────────────
Invoke-NpmInstall "[1/3] Installing root dependencies (concurrently)…"
Invoke-NpmInstall "[2/3] Installing client dependencies (React + Vite)…" -prefix "client"
Invoke-NpmInstall "[3/3] Installing server dependencies (Express + dotenv)…" -prefix "server"

# ── Environment files ─────────────────────────────────────────────────────────
Write-Info "Checking environment files…"

if (-not (Test-Path "server\.env")) {
  Copy-Item "server\.env.example" "server\.env"
  Write-Ok "Created server\.env from .env.example"
} else {
  Write-Warn "server\.env already exists — skipping."
}

if (-not (Test-Path "client\.env")) {
  Copy-Item "client\.env.example" "client\.env"
  Write-Ok "Created client\.env from .env.example"
} else {
  Write-Warn "client\.env already exists — skipping."
}

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ================================================" -ForegroundColor Green
Write-Host "   ✅  Setup complete!                           " -ForegroundColor Green
Write-Host "  ================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  npm run dev      — start both client + server" -ForegroundColor White
Write-Host "  npm run client   — React frontend  →  http://localhost:3000" -ForegroundColor White
Write-Host "  npm run server   — Express API     →  http://localhost:5000" -ForegroundColor White
Write-Host ""
