/**
 * Route wrapper: /games/ar/:gameId → the catalogue entry → ARStage.
 *
 * Keeps the stage ignorant of routing, and gives "Next game" something sensible
 * to mean (the next game in the same group, wrapping round).
 */
import { useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FaArrowLeft } from 'react-icons/fa'
import ARStage from '../core/ARStage'
import { getGame, gamesInGroup } from '../catalog/games'
import styles from './ARGame.module.css'

export default function ARGame() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const game = getGame(gameId)

  const nextGameId = useMemo(() => {
    if (!game) return null
    const siblings = gamesInGroup(game.group)
    const i = siblings.findIndex((g) => g.id === game.id)
    if (i < 0 || siblings.length < 2) return null
    return siblings[(i + 1) % siblings.length].id
  }, [game])

  const exit = useCallback(() => navigate('/games/ar'), [navigate])
  const goNext = useCallback(() => {
    if (nextGameId) navigate(`/games/ar/${nextGameId}`)
    else exit()
  }, [navigate, nextGameId, exit])

  if (!game) {
    return (
      <div className={styles.missing}>
        <span className={styles.missingIcon}>🎮</span>
        <h1>That game is not here</h1>
        <p>
          The link points at <code>{gameId}</code>, which is not in the catalogue.
        </p>
        <button onClick={exit}>
          <FaArrowLeft /> Back to camera games
        </button>
      </div>
    )
  }

  // `key` forces a full remount when the game changes, so no tracker, clock or
  // telemetry session can ever leak from one game into the next.
  return <ARStage key={game.id} game={game} onExit={exit} onNext={nextGameId ? goNext : null} />
}
