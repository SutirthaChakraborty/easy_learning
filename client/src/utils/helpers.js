/**
 * General-purpose utilities for the Easy Learn client.
 * Keep functions pure and side-effect free.
 */

/**
 * Capitalise the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
export function capitalise(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format a date value to a localised, human-readable string.
 * @param {Date|string|number} date
 * @returns {string}  e.g. "24 March 2026"
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Truncate a string to a max length, appending an ellipsis if needed.
 * @param {string} str
 * @param {number} [maxLength=80]
 * @returns {string}
 */
export function truncate(str, maxLength = 80) {
  if (!str || str.length <= maxLength) return str;
  return `${str.slice(0, maxLength).trimEnd()}…`;
}

/**
 * Clamp a number between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
