/**
 * Where the MediaPipe WASM runtime and the .task models come from.
 *
 * `client/scripts/setup-mediapipe.mjs` vendors both into `public/mediapipe/`
 * (run automatically by `npm run dev` / `npm run build`). We probe that copy
 * once and fall back to the public CDNs if it is missing, so a fresh clone that
 * skipped the setup script still plays.
 */

const LOCAL_WASM = '/mediapipe/wasm'
const LOCAL_MODELS = '/mediapipe/models'

const CDN_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const CDN_MODELS = {
  hand: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  pose: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
}

const LOCAL_MODEL_FILES = {
  hand: 'hand_landmarker.task',
  pose: 'pose_landmarker_lite.task',
}

// Allow an operator to pin these (air-gapped deployment, private mirror).
const ENV_WASM = import.meta.env?.VITE_MEDIAPIPE_WASM_URL
const ENV_MODELS = import.meta.env?.VITE_MEDIAPIPE_MODEL_BASE

let probe = null

/** HEAD-probes a URL. Returns false on any network/CORS failure rather than throwing. */
async function exists(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'force-cache' })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Resolves once per page load and memoises the answer.
 * @returns {Promise<{wasmPath: string, modelUrl: (k: 'hand'|'pose') => string, local: boolean}>}
 */
export function resolveVisionAssets() {
  if (probe) return probe

  probe = (async () => {
    if (ENV_WASM || ENV_MODELS) {
      const base = (ENV_MODELS || LOCAL_MODELS).replace(/\/$/, '')
      return {
        wasmPath: (ENV_WASM || CDN_WASM).replace(/\/$/, ''),
        modelUrl: (k) => `${base}/${LOCAL_MODEL_FILES[k]}`,
        local: Boolean(ENV_MODELS),
      }
    }

    const [hasWasm, hasHand, hasPose] = await Promise.all([
      exists(`${LOCAL_WASM}/vision_wasm_internal.js`),
      exists(`${LOCAL_MODELS}/${LOCAL_MODEL_FILES.hand}`),
      exists(`${LOCAL_MODELS}/${LOCAL_MODEL_FILES.pose}`),
    ])

    const wasmPath = hasWasm ? LOCAL_WASM : CDN_WASM
    const localModel = { hand: hasHand, pose: hasPose }

    return {
      wasmPath,
      modelUrl: (k) =>
        localModel[k] ? `${LOCAL_MODELS}/${LOCAL_MODEL_FILES[k]}` : CDN_MODELS[k],
      local: hasWasm && hasHand && hasPose,
    }
  })()

  return probe
}
