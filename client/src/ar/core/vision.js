/**
 * Lazy, shared MediaPipe landmarker instances.
 *
 * Creating a HandLandmarker costs ~1-2 s (WASM boot + 8 MB model), so we build
 * each task once per page load and hand the same instance to every game. Games
 * must never call `.close()`; `disposeVision()` exists for a hard teardown
 * (e.g. the user revokes camera permission).
 */
import { FilesetResolver, HandLandmarker, PoseLandmarker } from '@mediapipe/tasks-vision'
import { resolveVisionAssets } from './assets'

let filesetPromise = null
const taskPromises = { hand: null, pose: null }
let assetInfo = null

function getFileset() {
  if (!filesetPromise) {
    filesetPromise = (async () => {
      assetInfo = await resolveVisionAssets()
      return FilesetResolver.forVisionTasks(assetInfo.wasmPath)
    })()
  }
  return filesetPromise
}

/**
 * The GPU delegate is 3-5× faster but fails on some Android/Safari WebGL
 * stacks. Try GPU, fall back to CPU rather than leaving a child with a blank
 * screen.
 */
async function createWithFallback(create) {
  try {
    return { task: await create('GPU'), delegate: 'GPU' }
  } catch (gpuErr) {
    console.warn('[ar] GPU delegate unavailable, falling back to CPU:', gpuErr?.message || gpuErr)
    return { task: await create('CPU'), delegate: 'CPU' }
  }
}

export function getHandLandmarker({ numHands = 2 } = {}) {
  if (!taskPromises.hand) {
    taskPromises.hand = (async () => {
      const fileset = await getFileset()
      return createWithFallback((delegate) =>
        HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: assetInfo.modelUrl('hand'), delegate },
          runningMode: 'VIDEO',
          numHands,
          // Slightly permissive: children's hands are small and often partly
          // out of frame. Missing a real reach is worse than a brief false one.
          minHandDetectionConfidence: 0.4,
          minHandPresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        })
      )
    })().catch((err) => {
      taskPromises.hand = null
      throw err
    })
  }
  return taskPromises.hand
}

export function getPoseLandmarker() {
  if (!taskPromises.pose) {
    taskPromises.pose = (async () => {
      const fileset = await getFileset()
      return createWithFallback((delegate) =>
        PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: assetInfo.modelUrl('pose'), delegate },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputSegmentationMasks: false,
        })
      )
    })().catch((err) => {
      taskPromises.pose = null
      throw err
    })
  }
  return taskPromises.pose
}

/**
 * Warms the models while the child is still on the hub screen, so pressing Play
 * starts the game instead of a loading spinner.
 */
export function prewarmVision(kinds = ['hand']) {
  const jobs = []
  if (kinds.includes('hand')) jobs.push(getHandLandmarker().catch(() => null))
  if (kinds.includes('pose')) jobs.push(getPoseLandmarker().catch(() => null))
  return Promise.all(jobs)
}

export async function visionAssetInfo() {
  await getFileset()
  return assetInfo
}

export function disposeVision() {
  for (const key of Object.keys(taskPromises)) {
    const p = taskPromises[key]
    taskPromises[key] = null
    p?.then(({ task }) => task.close()).catch(() => {})
  }
  filesetPromise = null
}

// ── Landmark index maps ───────────────────────────────────────────────────────
export const HAND = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
}

export const POSE = {
  NOSE: 0,
  LEFT_EYE_INNER: 1, LEFT_EYE: 2, LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4, RIGHT_EYE: 5, RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7, RIGHT_EAR: 8,
  MOUTH_LEFT: 9, MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_PINKY: 17, RIGHT_PINKY: 18,
  LEFT_INDEX: 19, RIGHT_INDEX: 20,
  LEFT_THUMB: 21, RIGHT_THUMB: 22,
  LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
  LEFT_HEEL: 29, RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31, RIGHT_FOOT_INDEX: 32,
}

/** Bone pairs for drawing a hand skeleton. */
export const HAND_BONES = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
]

/** Bone pairs for drawing a body skeleton (torso + limbs, no face mesh). */
export const POSE_BONES = [
  [11, 12], [11, 23], [12, 24], [23, 24],
  [11, 13], [13, 15], [12, 14], [14, 16],
  [23, 25], [25, 27], [24, 26], [26, 28],
  [27, 31], [28, 32],
]
