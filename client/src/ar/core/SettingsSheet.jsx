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
import {
  FaTimes, FaVolumeUp, FaHandPaper, FaEye, FaChartLine, FaUndo,
  FaCheck, FaMobileAlt, FaExclamationTriangle,
} from 'react-icons/fa'
import { getSettings, updateSettings, resetSettings, DEFAULT_SETTINGS } from './settings'
import { hapticCapabilities, haptic, sfx, unlockAudio } from './feedback'
import { speak } from './tts'
import { PROMPT_STAGES, PROMPT_INFO } from './adaptive'
import { resetProfile, loadProfile } from './profile'
import styles from './SettingsSheet.module.css'

/* Five small tabs rather than one long list: each pane has to fit a phone in
   landscape without scrolling, so no pane may hold more than six rows. */
const TABS = [
  { id: 'sound', label: 'Sound', icon: <FaVolumeUp /> },
  { id: 'vision', label: 'Vision', icon: <FaEye /> },
  { id: 'body', label: 'Body', icon: <FaHandPaper /> },
  { id: 'help', label: 'Help', icon: <FaCheck /> },
  { id: 'data', label: 'Data', icon: <FaChartLine /> },
]

export default function SettingsSheet({ onClose, getTracker, inGame = false }) {
  const [s, setS] = useState(getSettings())
  const [tab, setTab] = useState('sound')
  const [confirmWipe, setConfirmWipe] = useState(false)
  const caps = hapticCapabilities()

  const set = (patch) => setS(updateSettings(patch))

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="AR game settings">
        <header className={styles.head}>
          <h2>Play settings</h2>
          <button className={styles.close} onClick={onClose} aria-label="Close settings">
            <FaTimes />
          </button>
        </header>

        <nav className={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`${styles.tab} ${tab === t.id ? styles.tabOn : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.body}>
          {tab === 'sound' && (
            <>
              <Slider
                label="Sound"
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
                label="Spoken instructions"
                hint="Reads every prompt aloud"
                on={s.speech}
                onChange={(v) => {
                  set({ speech: v })
                  if (v) speak('Hello')
                }}
              />
              <Slider
                label="Speaking speed"
                value={s.speechRate}
                min={0.5}
                max={1.2}
                step={0.05}
                fmt={(v) => `${v.toFixed(2)}×`}
                disabled={!s.speech}
                onChange={(v) => {
                  set({ speechRate: v })
                  speak('Touch the red circle')
                }}
              />
              <Choice
                label="Instructions given by"
                value={s.instruction}
                options={[
                  { v: 'both', l: 'Voice + text' },
                  { v: 'audio', l: 'Voice only' },
                  { v: 'visual', l: 'Text only' },
                ]}
                onChange={(v) => set({ instruction: v })}
              />
              <Toggle
                label="Vibration"
                hint={
                  caps.vibrate
                    ? 'This device has a vibration motor'
                    : caps.gamepad
                      ? 'Using the connected controller'
                      : 'No motor found — a deep sound pulse is used instead'
                }
                on={s.haptics}
                onChange={(v) => {
                  set({ haptics: v })
                  if (v) haptic('correct', { force: true })
                }}
              />
              <Slider
                label="Vibration strength"
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
                label="Calm visuals"
                hint="No particles, no pulsing, no screen flashes"
                on={s.reducedMotion}
                onChange={(v) => set({ reducedMotion: v })}
              />
              <Toggle
                label="High contrast"
                hint="Stronger outlines and a darker background behind targets"
                on={s.highContrast}
                onChange={(v) => set({ highContrast: v })}
              />
              <Choice
                label="On-screen detail"
                value={s.visualClutter}
                options={[
                  { v: 'normal', l: 'Normal' },
                  { v: 'minimal', l: 'Minimal' },
                ]}
                onChange={(v) => set({ visualClutter: v })}
              />
              <Toggle
                label="Always show text"
                hint="Keeps the written prompt on screen alongside the voice"
                on={s.captions}
                onChange={(v) => set({ captions: v })}
              />
              <Toggle
                label="Mirror the picture"
                hint="On = like a mirror, which is what almost every child expects"
                on={s.mirrorView}
                onChange={(v) => set({ mirrorView: v })}
              />
              <Toggle
                label="Show skeleton"
                hint="Draws the tracked hand and body outline"
                on={s.showSkeleton}
                onChange={(v) => set({ showSkeleton: v })}
              />
            </>
          )}

          {tab === 'body' && (
            <>
              <Toggle
                label="Seated play"
                hint="Keeps every target inside a seated reach"
                on={s.seated}
                onChange={(v) => set({ seated: v })}
              />
              <Choice
                label="Hands to use"
                value={s.singleHand}
                options={[
                  { v: 'both', l: 'Either / both' },
                  { v: 'left', l: 'Left only' },
                  { v: 'right', l: 'Right only' },
                ]}
                onChange={(v) => set({ singleHand: v })}
              />
              <Toggle
                label="Big targets"
                hint="Makes everything 45% larger"
                on={s.largeTargets}
                onChange={(v) => set({ largeTargets: v })}
              />
              <Slider
                label="Extra time"
                hint="Multiplies every response window. Speed is never the point."
                value={s.extraTimeX}
                min={1}
                max={4}
                step={0.25}
                fmt={(v) => (v === 1 ? 'Standard' : `${v.toFixed(2)}×`)}
                onChange={(v) => set({ extraTimeX: v })}
              />
              <Slider
                label="Touch hold time"
                hint="How long a fingertip rests on a target to choose it. Longer helps a shaky hand."
                value={s.dwellMs}
                min={80}
                max={900}
                step={20}
                fmt={(v) => `${Math.round(v)} ms`}
                onChange={(v) => set({ dwellMs: v })}
              />
              <Toggle
                label="Swap left / right hand"
                hint={
                  loadProfile().reach
                    ? `Reach set up ${new Date(loadProfile().reachCalibratedAt).toLocaleDateString()}. Turn this on if the game names the wrong hand.`
                    : 'Turn this on if the game names the wrong hand. Ask the child to raise their right hand to check.'
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
                label="Prompt level"
                hint="How much help the game gives. Adaptive fades it as the child succeeds without it."
                value={s.promptMode}
                options={[
                  { v: 'adaptive', l: 'Adaptive' },
                  ...PROMPT_STAGES.filter((p) => p !== 'G').map((p) => ({ v: p, l: p })),
                ]}
                onChange={(v) => set({ promptMode: v })}
              />
              <div className={styles.stageHelp}>
                {s.promptMode === 'adaptive' ? (
                  <>
                    <strong>Adaptive.</strong> Starts at demonstration and fades one stage
                    after five of six correct answers given without the prompt. Steps back
                    after two errors.
                  </>
                ) : (
                  <>
                    <strong>
                      {s.promptMode} — {PROMPT_INFO[s.promptMode]?.name}.
                    </strong>{' '}
                    {PROMPT_INFO[s.promptMode]?.help}
                  </>
                )}
              </div>
              <Choice
                label="Difficulty"
                hint="Adaptive moves one demand at a time — target size, then number of choices, then distractor similarity."
                value={s.difficultyMode}
                options={[
                  { v: 'adaptive', l: 'Adaptive' },
                  { v: 'fixed', l: 'Fixed' },
                ]}
                onChange={(v) => set({ difficultyMode: v })}
              />
              {s.difficultyMode === 'fixed' && (
                <Slider
                  label="Fixed level"
                  value={s.fixedLevel}
                  min={1}
                  max={5}
                  step={1}
                  fmt={(v) => `Level ${v}`}
                  onChange={(v) => set({ fixedLevel: v })}
                />
              )}
              <div className={styles.stageHelp}>
                <strong>Stage G — real-world transfer.</strong>{' '}
                {PROMPT_INFO.G.help} A high score here is not evidence the skill
                generalised; that has to be checked away from the screen.
              </div>
            </>
          )}

          {tab === 'data' && (
            <>
              <Toggle
                label="Record analysis data"
                hint="Trial-by-trial accuracy, thinking time, movement time and reach quality. Only numbers — never any video or image."
                on={s.telemetry}
                onChange={(v) =>
                  set({ telemetry: v, consentAt: v ? new Date().toISOString() : null })
                }
              />
              <Toggle
                label="Show live tracking numbers"
                hint="Frame rate, detection time and camera lag, for setting up a session"
                on={s.showMetrics}
                onChange={(v) => set({ showMetrics: v })}
              />
              <div className={styles.note}>
                <FaCheck />
                <span>
                  Camera frames are processed on this device only. No frame is stored or
                  uploaded, by us or by anyone else.
                </span>
              </div>
              {s.consentAt && (
                <div className={styles.note}>
                  <FaCheck />
                  <span>Data recording turned on {new Date(s.consentAt).toLocaleString()}</span>
                </div>
              )}
              {!confirmWipe ? (
                <button className={styles.danger} onClick={() => setConfirmWipe(true)}>
                  <FaExclamationTriangle /> Erase this child's profile and history
                </button>
              ) : (
                <div className={styles.confirmRow}>
                  <span>Erase the reach calibration, capability profile and every stored round?</span>
                  <div>
                    <button
                      className={styles.danger}
                      onClick={() => {
                        resetProfile()
                        try {
                          localStorage.removeItem('ar_sessions_v1')
                        } catch {
                          /* ignore */
                        }
                        setConfirmWipe(false)
                      }}
                    >
                      Erase
                    </button>
                    <button className={styles.cancel} onClick={() => setConfirmWipe(false)}>
                      Keep
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
            title="Back to the defaults"
          >
            <FaUndo /> Reset
          </button>
          <span className={styles.footNote}>
            {inGame ? 'Changes apply to the next turn' : 'Saved on this device'}
          </span>
          <button className={styles.done} onClick={onClose}>
            Done
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
