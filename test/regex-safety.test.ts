import { describe, it, expect } from 'vitest'
import safe from 'safe-regex'
import { getRawWordlists } from '../src/wordlists/loader.js'
import { normalize } from '../src/normalize.js'

describe('regex safety (ReDoS prevention)', () => {
  const wordlists = getRawWordlists()

  for (const [locale, data] of Object.entries(wordlists)) {
    describe(`locale: ${locale}`, () => {
      for (const pattern of data.patterns) {
        it(`pattern "${pattern.term}" produces a safe regex`, () => {
          const normalizedTerm = normalize(pattern.term)
          const isMultiToken = normalizedTerm.includes(' ')
          const escapedTerm = normalizedTerm.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&',
          )

          const regexPattern = isMultiToken
            ? `\\b${escapedTerm.replace(/ +/g, '\\s+')}\\b`
            : `\\b${escapedTerm}\\b`

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
