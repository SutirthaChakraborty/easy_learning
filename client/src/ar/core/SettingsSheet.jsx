/**
 * The sensory / motor / clinical settings sheet.
 *
 * Reachable from the hub and from inside any game (including while paused), and
 * every change applies immediately — a therapist who sees a child struggling
 * with target size should be able to fix it in two taps without restarting.
 *
 * Grouped in tabs rather than one long list, because the sheet must never
 * scroll on a phone in landscape.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FaTimes, FaVolumeUp, FaHandPaper, FaEye, FaChartLine, FaUndo,
  FaCheck, FaMobileAlt, FaExclamationTriangle,
} from 'react-icons/fa'
import { getSettings, updateSettings, resetSettings, DEFAULT_SETTINGS } from './settings'
import { hapticCapabilities, haptic, sfx, unlockAudio } from './feedback'
import { speak } from './tts'
import { PROMPT_STAGES, promptName, promptHelp } from './adaptive'
import { LEVELS, LEVEL_META, clampLevel, resetJourney } from './journey'
import { resetProfile, loadProfile } from './profile'
import { tLevelName } from './arText'
import styles from './SettingsSheet.module.css'

/* Five small tabs rather than one long list: each pane has to fit a phone in
   landscape without scrolling, so no pane may hold more than six rows. */
const TAB_IDS = ['sound', 'vision', 'body', 'help', 'data']
const TAB_ICONS = {
  sound: <FaVolumeUp />,
  vision: <FaEye />,
  body: <FaHandPaper />,
  help: <FaCheck />,
  data: <FaChartLine />,
}
const TAB_FALLBACKS = { sound: 'Sound', vision: 'Vision', body: 'Body', help: 'Help', data: 'Data' }

export default function SettingsSheet({ onClose, getTracker, inGame = false }) {
  const { t } = useTranslation()
  const [s, setS] = useState(getSettings())
  const [tab, setTab] = useState('sound')
  const [confirmWipe, setConfirmWipe] = useState(false)
  const caps = hapticCapabilities()

  const set = (patch) => setS(updateSettings(patch))

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t('ar.settings.dialogAriaLabel', 'AR game settings')}>
        <header className={styles.head}>
          <h2>{t('ar.settings.title', 'Play settings')}</h2>
          <button className={styles.close} onClick={onClose} aria-label={t('ar.settings.closeAriaLabel', 'Close settings')}>
            <FaTimes />
          </button>
        </header>

        <nav className={styles.tabs}>
          {TAB_IDS.map((id) => (
            <button
              key={id}
              className={`${styles.tab} ${tab === id ? styles.tabOn : ''}`}
              onClick={() => setTab(id)}
            >
              {TAB_ICONS[id]}
              <span>{t(`ar.settings.tabs.${id}`, TAB_FALLBACKS[id])}</span>
            </button>
          ))}
        </nav>

        <div className={styles.body}>
          {tab === 'sound' && (
            <>
              <Slider
                label={t('ar.settings.sound.volume', 'Sound')}
                value={s.volume}
                min={0}
                max={1}
                step={0.05}
                fmt={(v) => `${Math.round(v * 100)}%`}
                onChange={(v) => {
                  set({ volume: v })
                  unlockAudio()
                  sfx.tick()
                }}
              />
              <Toggle
                label={t('ar.settings.sound.speech', 'Spoken instructions')}
                hint={t('ar.settings.sound.speechHint', 'Reads every prompt aloud')}
                on={s.speech}
                onChange={(v) => {
                  set({ speech: v })
                  if (v) speak(t('ar.settings.sound.speechTestHello', 'Hello'))
                }}
              />
              <Slider
                label={t('ar.settings.sound.speechRate', 'Speaking speed')}
                value={s.speechRate}
                min={0.5}
                max={1.2}
                step={0.05}
                fmt={(v) => `${v.toFixed(2)}×`}
                disabled={!s.speech}
                onChange={(v) => {
                  set({ speechRate: v })
                  speak(t('ar.settings.sound.speechRateTest', 'Touch the red circle'))
                }}
              />
              <Choice
                label={t('ar.settings.sound.instruction', 'Instructions given by')}
                value={s.instruction}
                options={[
                  { v: 'both', l: t('ar.settings.sound.instructionBoth', 'Voice + text') },
                  { v: 'audio', l: t('ar.settings.sound.instructionAudio', 'Voice only') },
                  { v: 'visual', l: t('ar.settings.sound.instructionVisual', 'Text only') },
                ]}
                onChange={(v) => set({ instruction: v })}
              />
              <Toggle
                label={t('ar.settings.sound.haptics', 'Vibration')}
                hint={
                  caps.vibrate
                    ? t('ar.settings.sound.hapticsHintVibrate', 'This device has a vibration motor')
                    : caps.gamepad
                      ? t('ar.settings.sound.hapticsHintGamepad', 'Using the connected controller')
                      : t('ar.settings.sound.hapticsHintNone', 'No motor found — a deep sound pulse is used instead')
                }
                on={s.haptics}
                onChange={(v) => {
                  set({ haptics: v })
                  if (v) haptic('correct', { force: true })
                }}
              />
              <Slider
                label={t('ar.settings.sound.hapticIntensity', 'Vibration strength')}
                value={s.hapticIntensity}
                min={0.3}
                max={2}
                step={0.1}
                fmt={(v) => `${v.toFixed(1)}×`}
                disabled={!s.haptics}
                onChange={(v) => {
                  set({ hapticIntensity: v })
                  haptic('tap', { force: true })
                }}
              />
            </>
          )}

          {tab === 'vision' && (
            <>
              <Toggle
                label={t('ar.settings.vision.reducedMotion', 'Calm visuals')}
                hint={t('ar.settings.vision.reducedMotionHint', 'No particles, no pulsing, no screen flashes')}
                on={s.reducedMotion}
                onChange={(v) => set({ reducedMotion: v })}
              />
              <Toggle
                label={t('ar.settings.vision.highContrast', 'High contrast')}
                hint={t('ar.settings.vision.highContrastHint', 'Stronger outlines and a darker background behind targets')}
                on={s.highContrast}
                onChange={(v) => set({ highContrast: v })}
              />
              <Choice
                label={t('ar.settings.vision.visualClutter', 'On-screen detail')}
                value={s.visualClutter}
                options={[
                  { v: 'normal', l: t('ar.settings.vision.visualClutterNormal', 'Normal') },
                  { v: 'minimal', l: t('ar.settings.vision.visualClutterMinimal', 'Minimal') },
                ]}
                onChange={(v) => set({ visualClutter: v })}
              />
              <Toggle
                label={t('ar.settings.vision.captions', 'Always show text')}
                hint={t('ar.settings.vision.captionsHint', 'Keeps the written prompt on screen alongside the voice')}
                on={s.captions}
                onChange={(v) => set({ captions: v })}
              />
              <Toggle
                label={t('ar.settings.vision.mirrorView', 'Mirror the picture')}
                hint={t('ar.settings.vision.mirrorViewHint', 'On = like a mirror, which is what almost every child expects')}
                on={s.mirrorView}
                onChange={(v) => set({ mirrorView: v })}
              />
              <Toggle
                label={t('ar.settings.vision.showSkeleton', 'Show skeleton')}
                hint={t('ar.settings.vision.showSkeletonHint', 'Draws the tracked hand and body outline')}
                on={s.showSkeleton}
                onChange={(v) => set({ showSkeleton: v })}
              />
            </>
          )}

          {tab === 'body' && (
            <>
              <Toggle
                label={t('ar.settings.body.seated', 'Seated play')}
                hint={t('ar.settings.body.seatedHint', 'Keeps every target inside a seated reach')}
                on={s.seated}
                onChange={(v) => set({ seated: v })}
              />
              <Choice
                label={t('ar.settings.body.singleHand', 'Hands to use')}
                value={s.singleHand}
                options={[
                  { v: 'both', l: t('ar.settings.body.singleHandBoth', 'Either / both') },
                  { v: 'left', l: t('ar.settings.body.singleHandLeft', 'Left only') },
                  { v: 'right', l: t('ar.settings.body.singleHandRight', 'Right only') },
                ]}
                onChange={(v) => set({ singleHand: v })}
              />
              <Toggle
                label={t('ar.settings.body.largeTargets', 'Big targets')}
                hint={t('ar.settings.body.largeTargetsHint', 'Makes everything 45% larger')}
                on={s.largeTargets}
                onChange={(v) => set({ largeTargets: v })}
              />
              <Slider
                label={t('ar.settings.body.extraTime', 'Extra time')}
                hint={t('ar.settings.body.extraTimeHint', 'Multiplies every response window. Speed is never the point.')}
                value={s.extraTimeX}
                min={1}
                max={4}
                step={0.25}
                fmt={(v) => (v === 1 ? t('ar.settings.body.extraTimeStandard', 'Standard') : `${v.toFixed(2)}×`)}
                onChange={(v) => set({ extraTimeX: v })}
              />
              <Slider
                label={t('ar.settings.body.dwellMs', 'Touch hold time')}
                hint={t('ar.settings.body.dwellMsHint', 'How long a fingertip rests on a target to choose it. Longer helps a shaky hand.')}
                value={s.dwellMs}
                min={80}
                max={900}
                step={20}
                fmt={(v) => `${Math.round(v)} ms`}
                onChange={(v) => set({ dwellMs: v })}
              />
              <Toggle
                label={t('ar.settings.body.handSwap', 'Swap left / right hand')}
                hint={
                  loadProfile().reach
                    ? t('ar.settings.body.handSwapHintWithDate', 'Reach set up {{date}}. Turn this on if the game names the wrong hand.', {
                        date: new Date(loadProfile().reachCalibratedAt).toLocaleDateString(),
                      })
                    : t(
                        'ar.settings.body.handSwapHintNoDate',
                        'Turn this on if the game names the wrong hand. Ask the child to raise their right hand to check.'
                      )
                }
                on={s.handSwap}
                onChange={(v) => {
                  set({ handSwap: v })
                  getTracker?.()?.setHandSwap(v)
                }}
              />
            </>
          )}

          {tab === 'help' && (
            <>
              <Choice
                label={t('ar.settings.help.promptMode', 'Prompt level')}
                hint={t('ar.settings.help.promptModeHint', 'How much help the game gives. Adaptive fades it as the child succeeds without it.')}
                value={s.promptMode}
                options={[
                  { v: 'adaptive', l: t('ar.settings.help.promptModeAdaptive', 'Adaptive') },
                  ...PROMPT_STAGES.filter((p) => p !== 'G').map((p) => ({ v: p, l: p })),
                ]}
                onChange={(v) => set({ promptMode: v })}
              />
              <div className={styles.stageHelp}>
                {s.promptMode === 'adaptive' ? (
                  <>
                    <strong>{t('ar.settings.help.adaptiveStageHelpTitle', 'Adaptive.')}</strong>{' '}
                    {t(
                      'ar.settings.help.adaptiveStageHelpBody',
                      'Starts at demonstration and fades one stage after five of six correct answers given without the prompt. Steps back after two errors.'
                    )}
                  </>
                ) : (
                  <>
                    <strong>
                      {s.promptMode} — {promptName(s.promptMode)}.
                    </strong>{' '}
                    {promptHelp(s.promptMode)}
                  </>
                )}
              </div>
              <Choice
                label={t('ar.settings.help.difficultyMode', 'Difficulty')}
                hint={t(
                  'ar.settings.help.difficultyModeHint',
                  'Adaptive moves one demand at a time — target size, then number of choices, then distractor similarity. Fixed holds one journey level instead.'
                )}
                value={s.difficultyMode}
                options={[
                  { v: 'adaptive', l: t('ar.settings.help.difficultyModeAdaptive', 'Adaptive') },
                  { v: 'fixed', l: t('ar.settings.help.difficultyModeFixed', 'Fixed') },
                ]}
                onChange={(v) => set({ difficultyMode: v })}
              />
              {s.difficultyMode === 'fixed' && (
                <Slider
                  label={t('ar.settings.help.fixedLevel', 'Held at journey level')}
                  // The round is played AND judged at this level — the level
                  // picker in the game is overridden while this is on. Saying
                  // so matters: a clear earned here is written to the child's
                  // journey exactly like one they chose for themselves.
                  hint={t('ar.settings.help.fixedLevelHint', 'Plays and scores every round at this level, whichever the child picks. A pass is recorded as a real clear.')}
                  value={s.fixedLevel}
                  min={1}
                  max={LEVELS}
                  step={1}
                  fmt={(v) => {
                    // A settings blob written by an older build can hold a level
                    // outside 1..5, and the slider hands its stored value straight
                    // to fmt without clamping it.
                    const meta = LEVEL_META[clampLevel(v) - 1]
                    const MetaIcon = meta.icon
                    // `fmt`'s return value is rendered directly as a React child
                    // (`{fmt(value)}`), so a fragment works exactly like a string.
                    return (
                      <>
                        <MetaIcon /> {meta.n} · {tLevelName(meta.n, meta.name)}
                      </>
                    )
                  }}
                  onChange={(v) => set({ fixedLevel: v })}
                />
              )}
              <Toggle
                // Adult framing in the LABEL, not only the hint: at 520 px the
                // hint is hidden and the label is all that survives, and
                // "open all levels" alone reads like a feature for the child
                // rather than an override of their reward.
                label={t('ar.settings.help.unlockAll', 'Unlock all levels (adult)')}
                hint={t('ar.settings.help.unlockAllHint', 'For a child already past level 1, or to probe one level. Clearing still has to be earned.')}
                on={s.journeyUnlockAll}
                onChange={(v) => set({ journeyUnlockAll: v })}
              />
              <div className={`${styles.stageHelp} ${styles.optional}`}>
                <strong>{t('ar.settings.help.stageGTitle', 'Stage G — real-world transfer.')}</strong>{' '}
                {promptHelp('G')} {t('ar.settings.help.stageGSuffix', 'A high score here is not evidence the skill generalised; that has to be checked away from the screen.')}
              </div>
            </>
          )}

          {tab === 'data' && (
            <>
              <Toggle
                label={t('ar.settings.data.telemetry', 'Record analysis data')}
                hint={t(
                  'ar.settings.data.telemetryHint',
                  'Trial-by-trial accuracy, thinking time, movement time and reach quality. Only numbers — never any video or image.'
                )}
                on={s.telemetry}
                onChange={(v) =>
                  set({ telemetry: v, consentAt: v ? new Date().toISOString() : null })
                }
              />
              <Toggle
                label={t('ar.settings.data.showMetrics', 'Show live tracking numbers')}
                hint={t('ar.settings.data.showMetricsHint', 'Frame rate, detection time and camera lag, for setting up a session')}
                on={s.showMetrics}
                onChange={(v) => set({ showMetrics: v })}
              />
              <div className={styles.note}>
                <FaCheck />
                <span>
                  {t(
                    'ar.settings.data.cameraNote',
                    'Camera frames are processed on this device only. No frame is stored or uploaded, by us or by anyone else.'
                  )}
                </span>
              </div>
              {s.consentAt && (
                <div className={styles.note}>
                  <FaCheck />
                  <span>{t('ar.settings.data.recordingOnSince', 'Data recording turned on {{date}}', { date: new Date(s.consentAt).toLocaleString() })}</span>
                </div>
              )}
              {!confirmWipe ? (
                <button className={styles.danger} onClick={() => setConfirmWipe(true)}>
                  <FaExclamationTriangle /> {t('ar.settings.data.eraseProfile', "Erase this child's profile and history")}
                </button>
              ) : (
                <div className={styles.confirmRow}>
                  <span>
                    {t(
                      'ar.settings.data.eraseConfirm',
                      'Erase the reach calibration, capability profile, level progress, points and every stored round?'
                    )}
                  </span>
                  <div>
                    <button
                      className={styles.danger}
                      onClick={() => {
                        resetProfile()
                        // The stored journey lives inside the profile, so the line
                        // above already blanks the levels, points and badges. This
                        // call is for the *ambient* level: the sheet opens mid-round
                        // too, and an uncleared active level would let the round in
                        // progress record a clear — with the lower levels backfilled
                        // behind it — against the child who was just erased.
                        resetJourney()
                        try {
                          localStorage.removeItem('ar_sessions_v1')
                        } catch {
                          /* ignore */
                        }
                        setConfirmWipe(false)
                      }}
                    >
                      {t('ar.settings.data.erase', 'Erase')}
                    </button>
                    <button className={styles.cancel} onClick={() => setConfirmWipe(false)}>
                      {t('ar.settings.data.keep', 'Keep')}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <footer className={styles.foot}>
          <button
            className={styles.reset}
            onClick={() => setS(resetSettings())}
            title={t('ar.settings.resetTitle', 'Back to the defaults')}
          >
            <FaUndo /> {t('ar.settings.reset', 'Reset')}
          </button>
          <span className={styles.footNote}>
            {inGame ? t('ar.settings.footNoteInGame', 'Changes apply to the next turn') : t('ar.settings.footNoteSaved', 'Saved on this device')}
          </span>
          <button className={styles.done} onClick={onClose}>
            {t('ar.settings.done', 'Done')}
          </button>
        </footer>
      </div>
    </div>
  )
}

function Toggle({ label, hint, on, onChange }) {
  return (
    <label className={styles.row}>
      <span className={styles.rowText}>
        <span className={styles.rowLabel}>{label}</span>
        {hint && <span className={styles.rowHint}>{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        className={`${styles.switch} ${on ? styles.switchOn : ''}`}
        onClick={() => onChange(!on)}
      >
        <span className={styles.knob} />
      </button>
    </label>
  )
}

function Slider({ label, hint, value, min, max, step, fmt, onChange, disabled }) {
  return (
    <label className={`${styles.row} ${disabled ? styles.rowOff : ''}`}>
      <span className={styles.rowText}>
        <span className={styles.rowLabel}>
          {label} <em>{fmt ? fmt(value) : value}</em>
        </span>
        {hint && <span className={styles.rowHint}>{hint}</span>}
      </span>
      <input
        type="range"
        className={styles.range}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

function Choice({ label, hint, value, options, onChange }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowText}>
        <span className={styles.rowLabel}>{label}</span>
        {hint && <span className={styles.rowHint}>{hint}</span>}
      </span>
      <div className={styles.segments}>
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            className={`${styles.segment} ${value === o.v ? styles.segmentOn : ''}`}
            onClick={() => onChange(o.v)}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  )
}

export { DEFAULT_SETTINGS }
