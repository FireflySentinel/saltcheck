import { UNICODE_CONFUSABLES } from './mappings/unicode.js'

/**
 * Normalize input text for matching.
 * The same pipeline is applied to wordlist patterns at compile time,
 * so both sides of the match are normalized identically.
 *
 * Pipeline:
 * 1. Lowercase
 * 2. Collapse runs of 3+ identical characters to 1 (preserves double letters)
 * 3. Replace unicode confusables with Latin equivalents
 */
export function normalize(text: string): string {
  let result = text.toLowerCase()
  result = collapseRepeats(result)
  result = replaceConfusables(result)
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
 * Replace common unicode confusables with their Latin equivalents.
 * Scoped to: Cyrillic lookalikes, fullwidth ASCII characters.
 */
function replaceConfusables(text: string): string {
  let result = ''
  for (const char of text) {
    result += UNICODE_CONFUSABLES[char] ?? char
  }
  return result
}
