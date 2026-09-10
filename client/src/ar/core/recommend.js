/**
 * Turns a GET /api/ar/insights payload into a plain-language "how things are
 * going" summary for an adult: which tasks the child is doing well on, which
 * need more practice, and a short list of catalogue games worth trying next.
 *
 * Kept deliberately simple and consistent with docs/AR-GAMES.md §1 — accuracy
 * and time are reported side by side and never folded into one score, and
 * nothing here is framed as pass/fail. "Needs more practice" is a place to
 * spend the next session, not a verdict on the child.
 */
import { GAMES } from '../catalog/games'
import { DOMAIN_LABELS } from '../catalog/groups'

// Fewer trials than this and a percentage is noise, not a signal.
const MIN_TRIALS = 3
// A domain/game at or above this accuracy is already going well, so it is
// skipped when picking what to suggest next.
const STRONG_ACCURACY = 80

/**
 * Per-game accuracy and time, split into what is going well and what would
 * benefit from more practice. Both lists are ranked by accuracy alone, exactly
 * as the insights screen's "weakest first" panel is.
 */
export function gameStrengthsAndGrowth(insights, n = 3) {
  const games = (insights?.perGame || []).filter(
    (g) => g.trials >= MIN_TRIALS && g.accuracyPct != null
  )
  const byAccuracyDesc = [...games].sort((a, b) => b.accuracyPct - a.accuracyPct)

  // With few games played, a naive top-n/bottom-n would show the same
  // middling game in both lists. Splitting into two non-overlapping halves
  // means a game only ever appears once, and a genuinely middling one (like
  // the sole game in a 3-game history that isn't clearly the best or worst)
  // appears in neither, which is the honest answer.
  const half = Math.min(n, Math.floor(games.length / 2))

  return {
    strengths: byAccuracyDesc.slice(0, half),
    growth: half ? byAccuracyDesc.slice(-half).reverse() : [],
  }
}

/** The functional domains this child is finding hardest right now. */
export function weakestDomains(insights, n = 3) {
  return (insights?.perDomain || [])
    .filter((d) => d.trials >= MIN_TRIALS && d.accuracyPct != null)
    .sort((a, b) => a.accuracyPct - b.accuracyPct)
    .slice(0, n)
    .map((d) => ({ ...d, label: DOMAIN_LABELS[d.domain] || d.domain }))
}

/**
 * Up to `limit` catalogue games that exercise the domains a child is finding
 * hardest. Games already played to a strong accuracy are skipped so a
 * suggestion always points at real headroom, and unplayed games in that domain
 * are offered ahead of ones already attempted, so the list reads as "try this
 * next" rather than "do the thing you struggled with again."
 */
export function suggestNextGames(insights, limit = 4) {
  const weak = weakestDomains(insights, 3)
  if (!weak.length) return []

  const accuracyByGame = new Map((insights?.perGame || []).map((g) => [g.gameId, g.accuracyPct]))
  const seen = new Set()
  const picks = []

  for (const domain of weak) {
    const candidates = GAMES.filter((g) => g.domains?.includes(domain.domain) && !seen.has(g.id)).sort(
      (a, b) => (accuracyByGame.get(a.id) ?? -1) - (accuracyByGame.get(b.id) ?? -1)
    )

    for (const game of candidates) {
      if (picks.length >= limit) break
      const acc = accuracyByGame.get(game.id)
      if (acc != null && acc >= STRONG_ACCURACY) continue
      seen.add(game.id)
      picks.push({
        gameId: game.id,
        title: game.title,
        icon: game.icon,
        reason: `Helps with ${domain.label}`,
      })
    }
    if (picks.length >= limit) break
  }

  return picks
}
