import { normalize } from '../normalize.js'
import type { BoundaryMode, CompiledPattern, WordlistData } from './types.js'
import { TIER_WEIGHTS } from './types.js'
import enData from './en.json'
import esData from './es.json'
import zhCnData from './zh-cn.json'
import jaData from './ja.json'
import frData from './fr.json'
import ruData from './ru.json'
import deData from './de.json'
import enPositiveData from './positive/en.json'
import esPositiveData from './positive/es.json'
import zhCnPositiveData from './positive/zh-cn.json'
import jaPositiveData from './positive/ja.json'
import frPositiveData from './positive/fr.json'
import ruPositiveData from './positive/ru.json'
import dePositiveData from './positive/de.json'

const RAW_WORDLISTS: Record<string, WordlistData> = {
  en: enData as WordlistData,
  es: esData as WordlistData,
  'zh-cn': zhCnData as WordlistData,
  ja: jaData as WordlistData,
  fr: frData as WordlistData,
  ru: ruData as WordlistData,
  de: deData as WordlistData,
}

const RAW_POSITIVE_WORDLISTS: Record<string, WordlistData> = {
  en: enPositiveData as WordlistData,
  es: esPositiveData as WordlistData,
  'zh-cn': zhCnPositiveData as WordlistData,
  ja: jaPositiveData as WordlistData,
  fr: frPositiveData as WordlistData,
  ru: ruPositiveData as WordlistData,
  de: dePositiveData as WordlistData,
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
  return loadFromRegistry(RAW_WORDLISTS, 'neg', locale)
}

/**
 * Load and compile positive wordlist patterns for a locale.
 * Same behavior as loadWordlist but uses the positive pattern registry.
 *
 * @experimental
 */
export function loadPositiveWordlist(locale: string): CompiledPattern[] | null {
  return loadFromRegistry(RAW_POSITIVE_WORDLISTS, 'pos', locale)
}

function loadFromRegistry(
  registry: Record<string, WordlistData>,
  prefix: string,
  locale: string,
): CompiledPattern[] | null {
  const normalizedLocale = locale.toLowerCase()
  const cacheKey = `${prefix}:${normalizedLocale}`

  const cached = cache.get(cacheKey)
  if (cached !== undefined) {
    return cached
  }

  const data = registry[normalizedLocale]
  if (!data) {
    return null
  }

  try {
    const compiled = compilePatterns(data)
    cache.set(cacheKey, compiled)
    return compiled
  } catch (err) {
    console.error(`saltcheck: failed to compile wordlist for locale '${normalizedLocale}':`, err)
    const empty: CompiledPattern[] = []
    cache.set(cacheKey, empty)
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
 * Uses \b for pure ASCII patterns to prevent the Scunthorpe problem.
 * Falls back to whitespace/start/end anchors for patterns with non-ASCII
 * characters (accents, cedillas, umlauts) since \b only recognizes [a-zA-Z0-9_].
 */
function buildWordBoundaryPattern(escapedTerm: string, normalizedTerm: string): string {
  const isMultiToken = normalizedTerm.includes(' ')
  const hasNonAscii = /[^\x00-\x7F]/.test(normalizedTerm)

  if (hasNonAscii) {
    // \b doesn't work with accented characters (ç, é, ö, etc.)
    // Use whitespace/start/end anchors instead
    const inner = isMultiToken
      ? escapedTerm.replace(/ +/g, '\\s+')
      : escapedTerm
    return `(?<=\\s|^)${inner}(?=\\s|$)`
  }

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
 * Get all supported locale codes for positive detection.
 * @experimental
 */
export function getPositiveSupportedLocales(): string[] {
  return Object.keys(RAW_POSITIVE_WORDLISTS)
}

/**
 * Get all raw wordlist data (for testing/validation).
 */
export function getRawWordlists(): Record<string, WordlistData> {
  return RAW_WORDLISTS
}

/**
 * Get all raw positive wordlist data (for testing/validation).
 * @experimental
 */
export function getRawPositiveWordlists(): Record<string, WordlistData> {
  return RAW_POSITIVE_WORDLISTS
}
