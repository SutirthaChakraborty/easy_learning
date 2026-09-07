/**
 * The five-stop level path, drawn as a row of pips joined by a trail.
 *
 * Used on the hub tile, the game intro and the results screen, so a child sees
 * the same shape in all three places and learns to read it once. The pips are
 * the level picker as well as the display — a separate "choose a level" screen
 * would be one more thing to navigate, and this population does better with
 * fewer screens and bigger targets.
 *
 * A locked pip is dimmed and shows a lock rather than being hidden: seeing that
 * there is more to come is the point of a journey.
 */
import { FaLock, FaStar, FaCheck } from 'react-icons/fa'
import { LEVEL_META } from './journey'
import styles from './LevelPips.module.css'

export default function LevelPips({ pips, size = 'md', onPick = null, showNames = false }) {
  const list = pips || []

  return (
    <div
      className={`${styles.path} ${styles[size]}`}
      role={onPick ? 'group' : undefined}
      aria-label={onPick ? 'Choose a level' : 'Level progress'}
    >
      {list.map((p, i) => {
        const meta = LEVEL_META[p.n - 1] || LEVEL_META[0]
        const state = p.cleared ? 'cleared' : p.current ? 'current' : p.unlocked ? 'open' : 'locked'
        const title = p.unlocked
          ? `Level ${p.n} — ${meta.name}${p.cleared ? ' · cleared' : ''}`
          : `Level ${p.n} — opens when level ${p.n - 1} is cleared`
        const face =
          state === 'locked' ? (
            <FaLock className={styles.glyph} />
          ) : p.cleared ? (
            p.stars >= 3 ? <FaStar className={styles.glyph} /> : <FaCheck className={styles.glyph} />
          ) : (
            <span className={styles.num}>{p.n}</span>
          )
        const cls = `${styles.pip} ${styles[state]}`
        const style = { '--pip': meta.color }

        return (
          <div className={styles.step} key={p.n}>
            {i > 0 && (
              <span
                className={`${styles.trail} ${list[i - 1].cleared ? styles.trailOn : ''}`}
                aria-hidden
              />
            )}
            {onPick && p.unlocked ? (
              <button
                type="button"
                className={cls}
                style={style}
                onClick={(e) => {
                  // The pips often sit inside a tile that is itself a button.
                  e.stopPropagation()
                  onPick(p.n)
                }}
                title={title}
                aria-label={title}
                aria-current={p.current ? 'step' : undefined}
              >
                {face}
              </button>
            ) : (
              <span className={cls} style={style} title={title} aria-label={title}>
                {face}
              </span>
            )}
            {showNames && (
              <span className={`${styles.name} ${p.unlocked ? '' : styles.nameOff}`}>
                {meta.name}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
