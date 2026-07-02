@echo off
setlocal EnableDelayedExpansion
cls

:: =============================================================================
::  Easy Learn — Project Setup Script (Windows Command Prompt)
::  Futuresight Analytics Limited
::
::  Usage:  Double-click setup.bat  OR  run from CMD:  setup.bat
:: =============================================================================

echo.
echo ================================================
echo   Easy Learn -- Project Setup (Windows CMD)
echo   Futuresight Analytics Limited
echo ================================================
echo.

:: ── Check Node.js ─────────────────────────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERR]  Node.js is not installed.
  echo        Download it from https://nodejs.org
  echo.
  pause
  exit /b 1
)

for /f "delims=" %%v in ('node -v') do set NODE_VER=%%v
for /f "delims=" %%v in ('npm -v')  do set NPM_VER=%%v

echo [ OK]  Node.js %NODE_VER% detected
echo [ OK]  npm %NPM_VER% detected
echo.

:: ── Root dependencies ─────────────────────────────────────────────────────────
echo [1/3] Installing root dependencies (concurrently)...
call npm install
if %errorlevel% neq 0 (
  echo [ERR]  Root install failed.
  pause & exit /b 1
)
echo [ OK]  Root dependencies installed.
echo.

:: ── Client dependencies ───────────────────────────────────────────────────────
echo [2/3] Installing client dependencies (React + Vite)...
call npm install --prefix client
if %errorlevel% neq 0 (
  echo [ERR]  Client install failed.
  pause & exit /b 1
)
echo [ OK]  Client dependencies installed.
echo.

:: ── Server dependencies ───────────────────────────────────────────────────────
echo [3/3] Installing server dependencies (Express + dotenv)...
call npm install --prefix server
if %errorlevel% neq 0 (
  echo [ERR]  Server install failed.
  pause & exit /b 1
)
echo [ OK]  Server dependencies installed.
echo.

:: ── Environment files ─────────────────────────────────────────────────────────
echo Checking environment files...

if not exist "server\.env" (
  copy "server\.env.example" "server\.env" >nul
  echo [ OK]  Created server\.env from .env.example
) else (
  echo [SKIP] server\.env already exists.
)

if not exist "client\.env" (
  copy "client\.env.example" "client\.env" >nul
  echo [ OK]  Created client\.env from .env.example
) else (
  echo [SKIP] client\.env already exists.
)

echo.
echo ================================================
echo   Setup complete!
echo ================================================
echo.
echo   npm run dev      -- start both client + server
echo   npm run client   -- React frontend  (port 3000)
echo   npm run server   -- Express API     (port 5000)
echo.
pause
endlocal
