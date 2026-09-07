#!/usr/bin/env node
/**
 * Vendors the MediaPipe Tasks-Vision runtime into `public/mediapipe/` so the AR
 * games load their WASM + models from our own origin.
 *
 * Why bother instead of just pointing at a CDN:
 *   - the WASM binary and the .task models are ~15 MB; served locally they are
 *     cached by the dev server / CDN in front of the built app and the first
 *     camera frame arrives seconds sooner,
 *   - the games keep working on a school network that blocks jsdelivr /
 *     storage.googleapis.com,
 *   - no third party sees a request the moment a child opens a game.
 *
 * Runs from `predev` / `prebuild`. Nothing here is fatal: if the download fails
 * the script exits 0 and `src/ar/core/assets.js` falls back to the public CDN at
 * runtime.
 */
import { createWriteStream } from 'node:fs'
import { mkdir, copyFile, stat, readdir, rm } from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const CLIENT = resolve(HERE, '..')
const WASM_SRC = join(CLIENT, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm')
const OUT = join(CLIENT, 'public', 'mediapipe')
const WASM_OUT = join(OUT, 'wasm')
const MODEL_OUT = join(OUT, 'models')

const MODELS = [
  {
    file: 'hand_landmarker.task',
    url: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
    minBytes: 1_000_000,
  },
  {
    file: 'pose_landmarker_lite.task',
    url: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
    minBytes: 1_000_000,
  },
]

const log = (...a) => console.log('[mediapipe]', ...a)

async function sizeOf(path) {
  try {
    return (await stat(path)).size
  } catch {
    return -1
  }
}

async function vendorWasm() {
  const files = await readdir(WASM_SRC).catch(() => null)
  if (!files) {
    log('WASM not found in node_modules — run `npm install` first. Falling back to CDN at runtime.')
    return false
  }
  await mkdir(WASM_OUT, { recursive: true })
  let copied = 0
  for (const f of files) {
    const src = join(WASM_SRC, f)
    const dest = join(WASM_OUT, f)
    const [srcSize, destSize] = await Promise.all([sizeOf(src), sizeOf(dest)])
    if (srcSize === destSize) continue
    await copyFile(src, dest)
    copied++
  }
  log(copied ? `vendored ${copied} WASM file(s) → public/mediapipe/wasm` : 'WASM already up to date')
  return true
}

async function fetchModel({ file, url, minBytes }) {
  const dest = join(MODEL_OUT, file)
  const existing = await sizeOf(dest)
  if (existing >= minBytes) {
    log(`${file} already present (${(existing / 1e6).toFixed(1)} MB)`)
    return true
  }
  const tmp = `${dest}.part`
  try {
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), 90_000)
    const res = await fetch(url, { signal: ac.signal })
    clearTimeout(timer)
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
    await mkdir(MODEL_OUT, { recursive: true })
    await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp))
    const got = await sizeOf(tmp)
    if (got < minBytes) throw new Error(`truncated download (${got} bytes)`)
    await rm(dest, { force: true })
    await copyFile(tmp, dest)
    await rm(tmp, { force: true })
    log(`downloaded ${file} (${(got / 1e6).toFixed(1)} MB)`)
    return true
  } catch (err) {
    await rm(tmp, { force: true }).catch(() => {})
    log(`could not download ${file}: ${err.message} — runtime will use the Google CDN instead`)
    return false
  }
}

async function main() {
  await mkdir(OUT, { recursive: true })
  await vendorWasm()
  const results = await Promise.all(MODELS.map(fetchModel))
  if (results.every(Boolean)) log('AR assets ready (fully offline-capable)')
  else log('AR assets partially vendored — the games still run via CDN fallback')
}

main().catch((err) => {
  log('setup skipped:', err?.message || err)
  process.exit(0)
})
