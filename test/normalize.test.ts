import { describe, it, expect } from 'vitest'
import { normalize } from '../src/normalize.js'

describe('normalize', () => {
  // --- Lowercase ---

  describe('lowercase', () => {
    it('converts to lowercase', () => {
      expect(normalize('HELLO WORLD')).toBe('hello world')
    })

    it('handles mixed case', () => {
      expect(normalize('FuCk ThIs')).toBe('fuck this')
    })
  })

  // --- Repeat collapse ---

  describe('repeat collapse', () => {
    it('collapses 3+ repeats to 1', () => {
      expect(normalize('fuuuuck')).toBe('fuck')
    })

    it('collapses long runs', () => {
      expect(normalize('shiiiiiit')).toBe('shit')
    })

    it('preserves exactly 2 repeats', () => {
      expect(normalize('coffee')).toBe('coffee')
    })

    it('preserves double letters in normal words', () => {
      expect(normalize('happy')).toBe('happy')
      expect(normalize('passing')).toBe('passing')
      expect(normalize('letter')).toBe('letter')
    })

    it('collapses exactly 3 repeats', () => {
      expect(normalize('fffire')).toBe('fire')
    })

    it('handles mixed repeats in one word', () => {
      expect(normalize('fuuuccck')).toBe('fuck')
    })

    it('handles multiple separate repeat runs', () => {
      expect(normalize('soooo baaad')).toBe('so bad')
    })

    it('preserves Spanish double letters', () => {
      expect(normalize('perro')).toBe('perro')
      expect(normalize('calle')).toBe('calle')
    })
  })

  // --- Unicode confusables ---

  describe('unicode confusables', () => {
    it('replaces Cyrillic lookalikes', () => {
      // Cyrillic а, с, е → Latin a, c, e
      expect(normalize('\u0430\u0441\u0435')).toBe('ace')
    })

    it('replaces fullwidth characters', () => {
      // Fullwidth ｆｕｃｋ → fuck
      expect(normalize('\uFF46\uFF55\uFF43\uFF4B')).toBe('fuck')
    })

    it('preserves normal ASCII characters', () => {
      expect(normalize('hello world')).toBe('hello world')
    })

    it('handles mixed Cyrillic and Latin', () => {
      // Mix of real Latin and Cyrillic lookalikes
      expect(normalize('h\u0435ll\u043E')).toBe('hello')
    })
  })

  // --- Combined pipeline ---

  describe('combined pipeline', () => {
    it('applies all normalization steps together', () => {
      // Uppercase + repeats + Cyrillic
      expect(normalize('FUUUUCK')).toBe('fuck')
    })

    it('normalizes text with numbers unchanged', () => {
      expect(normalize('Error 404')).toBe('error 404')
    })

    it('handles empty string', () => {
      expect(normalize('')).toBe('')
    })
  })
})
