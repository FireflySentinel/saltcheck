import { normalize } from './normalize.js'
import { loadWordlist, loadPositiveWordlist, getSupportedLocales, getPositiveSupportedLocales } from './wordlists/loader.js'
import type { CompiledPattern } from './wordlists/types.js'

/**
 * Score denominator for scored mode: represents ~3 severe matches.
 * score = min(1, sum(matched_weights) / SCORE_DENOMINATOR)
 */
const SCORE_DENOMINATOR = 3.0

export interface DetectionResult {
  /** True if any pattern matched (default) or score >= threshold (scored mode) */
  detected: boolean
  /** Canonical wordlist patterns that matched (not original text), sorted alphabetically */
  matches: string[]
  /** The locale used for detection */
  locale: string
  /** False when locale has no wordlist (detection was skipped) */
  localeSupported: boolean
  /** 0-1 severity score. Only meaningful when scored: true. Always 0 or 1 in default mode. */
  score: number
}

export interface DetectOptions {
  /** Locale code: 'en' | 'es' (default: 'en') */
  locale?: string
  /**
   * Enable severity scoring mode.
   * Default (false): any match = detected: true. Simple boolean, like Anthropic's production approach.
   * Scored (true): weighted severity scoring with threshold. Experimental.
   */
  scored?: boolean
  /** Score threshold for detected=true in scored mode. Ignored in default mode. 0-1 (default: 0.4) */
  threshold?: number
}

const NEUTRAL_RESULT = (locale: string, localeSupported: boolean): DetectionResult => ({
  detected: false,
  matches: [],
  locale,
  localeSupported,
  score: 0,
})

/**
 * Detect negative sentiment/frustration in a text string.
 *
 * Default mode: returns detected=true if ANY negative pattern matches.
 * This is the Anthropic battle-tested approach — simple boolean existence check.
 *
 * Scored mode (scored: true): returns a 0-1 severity score weighted by
 * pattern intensity tiers. Experimental, not yet validated in production.
 *
 * Never throws. Invalid input returns a neutral result.
 */
export function detectNegative(
  text: string,
  options?: DetectOptions,
): DetectionResult {
  const locale = options?.locale ?? 'en'
  const scored = options?.scored ?? false
  const threshold = options?.threshold ?? 0.4

  // Invalid input: return neutral result, never throw
  if (!text || typeof text !== 'string') {
    return NEUTRAL_RESULT(locale, true)
  }

  // Load wordlist for locale
  const patterns = loadWordlist(locale)

  if (patterns === null) {
    console.warn(`saltcheck: unsupported locale: '${locale}'`)
    return NEUTRAL_RESULT(locale, false)
  }

  if (patterns.length === 0) {
    return NEUTRAL_RESULT(locale, false)
  }

  // Normalize input using the same pipeline as patterns
  const normalizedText = normalize(text)

  // Match patterns against normalized text
  const matchedPatterns = findMatches(normalizedText, patterns)

  if (matchedPatterns.length === 0) {
    return NEUTRAL_RESULT(locale, true)
  }

  // Unique matched terms, sorted alphabetically for deterministic output
  const matches = matchedPatterns
    .map((p) => p.term)
    .sort()

  if (scored) {
    // Scored mode: weighted severity with threshold
    const totalWeight = matchedPatterns.reduce((sum, p) => sum + p.weight, 0)
    const rawScore = Math.min(1, totalWeight / SCORE_DENOMINATOR)
    // Round to 3 decimal places to avoid floating point comparison issues
    const score = Math.round(rawScore * 1000) / 1000

    return {
      detected: score >= threshold,
      score,
      matches,
      locale,
      localeSupported: true,
    }
  }

  // Default mode: any match = detected. Like Anthropic's matchesNegativeKeyword.
  return {
    detected: true,
    score: 1,
    matches,
    locale,
    localeSupported: true,
  }
}

/**
 * Find all unique pattern matches in the normalized text.
 * Each pattern contributes at most once (no double-counting duplicates).
 */
function findMatches(
  normalizedText: string,
  patterns: CompiledPattern[],
): CompiledPattern[] {
  const matched: CompiledPattern[] = []
  const seenTerms = new Set<string>()

  for (const pattern of patterns) {
    if (seenTerms.has(pattern.term)) continue

    // Reset regex lastIndex for global patterns
    pattern.regex.lastIndex = 0

    if (pattern.regex.test(normalizedText)) {
      matched.push(pattern)
      seenTerms.add(pattern.term)
    }
  }

  return matched
}

/**
 * Detect positive sentiment in a text string.
 *
 * Default mode: returns detected=true if ANY positive pattern matches.
 * Scored mode (scored: true): returns a 0-1 score weighted by pattern intensity.
 *
 * Never throws. Invalid input returns a neutral result.
 *
 * @experimental This API may change in future versions.
 */
export function detectPositive(
  text: string,
  options?: DetectOptions,
): DetectionResult {
  const locale = options?.locale ?? 'en'
  const scored = options?.scored ?? false
  const threshold = options?.threshold ?? 0.4

  if (!text || typeof text !== 'string') {
    return NEUTRAL_RESULT(locale, true)
  }

  const patterns = loadPositiveWordlist(locale)

  if (patterns === null) {
    console.warn(`saltcheck: unsupported locale for positive detection: '${locale}'`)
    return NEUTRAL_RESULT(locale, false)
  }

  if (patterns.length === 0) {
    return NEUTRAL_RESULT(locale, false)
  }

  const normalizedText = normalize(text)
  const matchedPatterns = findMatches(normalizedText, patterns)

  if (matchedPatterns.length === 0) {
    return NEUTRAL_RESULT(locale, true)
  }

  const matches = matchedPatterns
    .map((p) => p.term)
    .sort()

  if (scored) {
    const totalWeight = matchedPatterns.reduce((sum, p) => sum + p.weight, 0)
    const rawScore = Math.min(1, totalWeight / SCORE_DENOMINATOR)
    const score = Math.round(rawScore * 1000) / 1000

    return {
      detected: score >= threshold,
      score,
      matches,
      locale,
      localeSupported: true,
    }
  }

  return {
    detected: true,
    score: 1,
    matches,
    locale,
    localeSupported: true,
  }
}

// Re-export types and utilities
export type { DetectOptions as Options }
export { getSupportedLocales, getPositiveSupportedLocales } from './wordlists/loader.js'
export type { IntensityTier, WordlistPattern, WordlistData } from './wordlists/types.js'
