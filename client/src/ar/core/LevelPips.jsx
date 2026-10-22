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
import { useTranslation } from 'react-i18next'
import { FaLock, FaStar, FaCheck } from 'react-icons/fa'
import { LEVEL_META } from './journey'
import { tLevelName } from './arText'
import styles from './LevelPips.module.css'

export default function LevelPips({ pips, size = 'md', onPick = null, showNames = false }) {
  const { t } = useTranslation()
  const list = pips || []

  return (
    <div
      className={`${styles.path} ${styles[size]}`}
      role={onPick ? 'group' : undefined}
      aria-label={onPick ? t('ar.levelPips.chooseLevel', 'Choose a level') : t('ar.levelPips.levelProgress', 'Level progress')}
    >
      {list.map((p, i) => {
        const meta = LEVEL_META[p.n - 1] || LEVEL_META[0]
        const name = tLevelName(p.n, meta.name)
        const state = p.cleared ? 'cleared' : p.current ? 'current' : p.unlocked ? 'open' : 'locked'
        const title = p.unlocked
          ? t('ar.levelPips.levelUnlocked', 'Level {{n}} — {{name}}', { n: p.n, name }) +
            (p.cleared ? t('ar.levelPips.clearedSuffix', ' · cleared') : '')
          : t('ar.levelPips.levelLocked', 'Level {{n}} — opens when level {{prev}} is cleared', {
              n: p.n,
              prev: p.n - 1,
            })
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
                {name}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
