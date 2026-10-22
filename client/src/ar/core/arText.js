/**
 * Translated lookups for AR Games display text that lives in plain data
 * (the game catalogue, groups, ranks, badges, prompt stages) rather than in a
 * component.
 *
 * Uses the i18next instance directly rather than the `useTranslation` hook,
 * because this text is produced by plain functions (journey.js, adaptive.js)
 * that are not components themselves. They are always called from inside a
 * render or an effect that is already subscribed to language changes
 * elsewhere, so the result is never stale.
 *
 * Every lookup falls back to the English catalogue value when a language is
 * missing the key, so an incomplete translation never shows a raw key.
 */
import i18n from '../../i18n/i18n'

const t = (key, defaultValue, vars) => i18n.t(key, { defaultValue, ...vars })

export const tGame = (id, field, fallback) => t(`ar.games.${id}.${field}`, fallback)
export const tGroup = (id, field, fallback) => t(`ar.groups.${id}.${field}`, fallback)
export const tDomain = (key, fallback) => t(`ar.domains.${key}`, fallback ?? key)
export const tLifeSkill = (key, fallback) => t(`ar.lifeSkills.${key}`, fallback ?? key)
export const tLevelName = (n, fallback) => t(`ar.levels.${n}`, fallback)
export const tRank = (id, fallback) => t(`ar.ranks.${id}`, fallback)
export const tBadge = (id, field, fallback) => t(`ar.badges.${id}.${field}`, fallback)
export const tPromptStage = (stage, field, fallback) => t(`ar.promptStages.${stage}.${field}`, fallback)
export const tDimension = (key, fallback) => t(`ar.dimensions.${key}`, fallback)
export const tHarderWord = (key, fallback) => t(`ar.levelChange.harderWords.${key}`, fallback)
export const tLevelChange = (key, fallback) => t(`ar.levelChange.${key}`, fallback)
export const tCommon = (key, fallback, vars) => t(`ar.common.${key}`, fallback, vars)
export const tPoints = (key, fallback, vars) => t(`ar.points.${key}`, fallback, vars)
export const tAdvice = (key, fallback, vars) => t(`ar.advice.${key}`, fallback, vars)
export const tRecommend = (key, fallback, vars) => t(`ar.hub.recommend.${key}`, fallback, vars)
export const tRecommendHelps = (key, fallback, vars) => t(`ar.recommend.${key}`, fallback, vars)
