import { describe, it, expect } from 'vitest'
import safe from 'safe-regex'
import { getRawWordlists, getRawPositiveWordlists } from '../src/wordlists/loader.js'
import { normalize } from '../src/normalize.js'

describe('regex safety (ReDoS prevention)', () => {
  const wordlists = getRawWordlists()

  function buildTestRegex(normalizedTerm: string): string {
    const isMultiToken = normalizedTerm.includes(' ')
    const hasNonAscii = /[^\x00-\x7F]/.test(normalizedTerm)
    const escapedTerm = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    if (hasNonAscii) {
      const inner = isMultiToken
        ? escapedTerm.replace(/ +/g, '\\s+')
        : escapedTerm
      return `(?<=\\s|^)${inner}(?=\\s|$)`
    }

    return isMultiToken
      ? `\\b${escapedTerm.replace(/ +/g, '\\s+')}\\b`
      : `\\b${escapedTerm}\\b`
  }

  for (const [locale, data] of Object.entries(wordlists)) {
    describe(`locale: ${locale}`, () => {
      for (const pattern of data.patterns) {
        it(`pattern "${pattern.term}" produces a safe regex`, () => {
          const normalizedTerm = normalize(pattern.term)
          const regexPattern = buildTestRegex(normalizedTerm)
          expect(safe(regexPattern)).toBe(true)
        })
      }
    })
  }

  // --- Positive wordlists ---

  const positiveWordlists = getRawPositiveWordlists()

  for (const [locale, data] of Object.entries(positiveWordlists)) {
    describe(`positive locale: ${locale}`, () => {
      for (const pattern of data.patterns) {
        it(`pattern "${pattern.term}" produces a safe regex`, () => {
          const normalizedTerm = normalize(pattern.term)
          const regexPattern = buildTestRegex(normalizedTerm)
          expect(safe(regexPattern)).toBe(true)
        })
      }
    })
  }

  it('catches an intentionally unsafe regex pattern', () => {
    // This pattern has catastrophic backtracking potential
    expect(safe('(a+)+b')).toBe(false)
  })
})
