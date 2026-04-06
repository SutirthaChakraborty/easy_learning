#!/usr/bin/env bash
# =============================================================================
#  Easy Learn — Project Setup Script (Linux / macOS)
#  Futuresight Analytics Limited
#
#  Usage:  bash setup.sh
# =============================================================================

set -euo pipefail

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}${BOLD}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}${BOLD}[ OK ]${RESET}  $*"; }
warn()    { echo -e "${YELLOW}${BOLD}[WARN]${RESET}  $*"; }
error()   { echo -e "${RED}${BOLD}[ERR ]${RESET}  $*" >&2; exit 1; }

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}================================================${RESET}"
echo -e "${CYAN}${BOLD}   Easy Learn — Project Setup (Linux / macOS)  ${RESET}"
echo -e "${CYAN}${BOLD}   Futuresight Analytics Limited                ${RESET}"
echo -e "${CYAN}${BOLD}================================================${RESET}"
echo ""

# ── Prerequisite checks ───────────────────────────────────────────────────────
info "Checking prerequisites…"

if ! command -v node &>/dev/null; then
  error "Node.js is not installed. Download it from https://nodejs.org"
fi

NODE_VER=$(node -v)
NPM_VER=$(npm -v)

# Require Node.js >= 18
MAJOR=$(echo "$NODE_VER" | sed 's/v\([0-9]*\).*/\1/')
if [ "$MAJOR" -lt 18 ]; then
  error "Node.js $NODE_VER detected but >=18 is required. Please upgrade."
fi

success "Node.js $NODE_VER detected"
success "npm $NPM_VER detected"
echo ""

# ── Root dependencies ─────────────────────────────────────────────────────────
info "[1/3] Installing root dependencies (concurrently)…"
npm install
success "Root dependencies installed."
echo ""

# ── Client dependencies ───────────────────────────────────────────────────────
info "[2/3] Installing client dependencies (React + Vite)…"
npm install --prefix client
success "Client dependencies installed."
echo ""

# ── Server dependencies ───────────────────────────────────────────────────────
info "[3/3] Installing server dependencies (Express + dotenv)…"
npm install --prefix server
success "Server dependencies installed."
echo ""

# ── Environment files ─────────────────────────────────────────────────────────
info "Checking environment files…"

if [ ! -f "server/.env" ]; then
  cp server/.env.example server/.env
  success "Created server/.env from .env.example"
else
  warn "server/.env already exists — skipping."
fi

if [ ! -f "client/.env" ]; then
  cp client/.env.example client/.env
  success "Created client/.env from .env.example"
else
  warn "client/.env already exists — skipping."
fi

echo ""
echo -e "${GREEN}${BOLD}================================================${RESET}"
echo -e "${GREEN}${BOLD}   ✅  Setup complete!                          ${RESET}"
echo -e "${GREEN}${BOLD}================================================${RESET}"
echo ""
echo -e "  ${BOLD}npm run dev${RESET}     — start both client + server"
echo -e "  ${BOLD}npm run client${RESET}  — React frontend  →  http://localhost:3000"
echo -e "  ${BOLD}npm run server${RESET}  — Express API     →  http://localhost:5000"
echo ""
