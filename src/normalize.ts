/**
 * Normalize input text for matching.
 * The same pipeline is applied to wordlist patterns at compile time,
 * so both sides of the match are normalized identically.
 *
 * Pipeline:
 * 1. Lowercase
 * 2. Collapse runs of 3+ identical characters to 1 (preserves double letters)
 * 3. Strip apostrophes (handles French contractions like n'importe, j'adore)
 */
export function normalize(text: string): string {
  let result = text.toLowerCase()
  result = collapseRepeats(result)
  result = stripApostrophes(result)
  return result
}

/**
 * Collapse runs of 3 or more identical characters to a single character.
 * "fuuuuck" → "fuck", "soooo" → "so"
 * Preserves runs of exactly 2: "coffee" → "coffee", "happy" → "happy"
 */
function collapseRepeats(text: string): string {
  return text.replace(/(.)\1{2,}/g, '$1')
}

/**
 * Strip straight and curly apostrophes.
 * Handles French contractions (n'importe → n importe, j'adore → j adore)
 * and English contractions without affecting matching.
 */
function stripApostrophes(text: string): string {
  return text.replace(/['\u2019]/g, '')
}
