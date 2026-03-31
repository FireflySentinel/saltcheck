import { normalize } from '../normalize.js'
import type { BoundaryMode, CompiledPattern, WordlistData } from './types.js'
import { TIER_WEIGHTS } from './types.js'
import enData from './en.json'
import esData from './es.json'
import zhCnData from './zh-cn.json'

const RAW_WORDLISTS: Record<string, WordlistData> = {
  en: enData as WordlistData,
  es: esData as WordlistData,
  'zh-cn': zhCnData as WordlistData,
}

const cache = new Map<string, CompiledPattern[]>()

/**
 * Load and compile wordlist patterns for a locale.
 * Patterns are normalized using the same pipeline as input text,
 * then compiled to RegExp objects. Results are cached in a Map.
 *
 * Returns null if the locale is not supported.
 * Returns empty array if the wordlist fails to parse.
 */
export function loadWordlist(locale: string): CompiledPattern[] | null {
  const normalizedLocale = locale.toLowerCase()

  const cached = cache.get(normalizedLocale)
  if (cached !== undefined) {
    return cached
  }

  const data = RAW_WORDLISTS[normalizedLocale]
  if (!data) {
    return null
  }

  try {
    const compiled = compilePatterns(data)
    cache.set(normalizedLocale, compiled)
    return compiled
  } catch (err) {
    console.error(`saltcheck: failed to compile wordlist for locale '${normalizedLocale}':`, err)
    const empty: CompiledPattern[] = []
    cache.set(normalizedLocale, empty)
    return empty
  }
}

function compilePatterns(data: WordlistData): CompiledPattern[] {
  const boundary: BoundaryMode = data.boundary ?? 'word'

  return data.patterns.map((pattern) => {
    const normalizedTerm = normalize(pattern.term)
    const escapedTerm = escapeRegex(normalizedTerm)

    const regexPattern = boundary === 'substring'
      ? buildSubstringPattern(escapedTerm)
      : buildWordBoundaryPattern(escapedTerm, normalizedTerm)

    return {
      term: pattern.term,
      tier: pattern.tier,
      weight: TIER_WEIGHTS[pattern.tier],
      regex: new RegExp(regexPattern, 'gi'),
    }
  })
}

/**
 * Word boundary matching for Latin scripts.
 * Uses \b to prevent Scunthorpe problem.
 */
function buildWordBoundaryPattern(escapedTerm: string, normalizedTerm: string): string {
  const isMultiToken = normalizedTerm.includes(' ')
  return isMultiToken
    ? `\\b${escapedTerm.replace(/ +/g, '\\s+')}\\b`
    : `\\b${escapedTerm}\\b`
}

/**
 * Substring matching for CJK scripts.
 * No word boundaries needed — Chinese characters don't have the Scunthorpe problem
 * at the multi-character phrase level. Single ambiguous characters are excluded
 * from wordlists by convention.
 */
function buildSubstringPattern(escapedTerm: string): string {
  return escapedTerm
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Get all supported locale codes.
 */
export function getSupportedLocales(): string[] {
  return Object.keys(RAW_WORDLISTS)
}

/**
 * Get all raw wordlist data (for testing/validation).
 */
export function getRawWordlists(): Record<string, WordlistData> {
  return RAW_WORDLISTS
}
