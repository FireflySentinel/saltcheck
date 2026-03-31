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

  // --- Apostrophe stripping ---

  describe('apostrophe stripping', () => {
    it('strips straight apostrophes', () => {
      expect(normalize("n'importe quoi")).toBe('nimporte quoi')
    })

    it('strips curly apostrophes', () => {
      expect(normalize('j\u2019adore')).toBe('jadore')
    })

    it('handles English contractions', () => {
      expect(normalize("don't")).toBe('dont')
      expect(normalize("can't")).toBe('cant')
    })

    it('preserves text without apostrophes', () => {
      expect(normalize('hello world')).toBe('hello world')
    })
  })

  // --- Combined pipeline ---

  describe('combined pipeline', () => {
    it('applies all normalization steps together', () => {
      expect(normalize('FUUUUCK')).toBe('fuck')
    })

    it('normalizes text with numbers unchanged', () => {
      expect(normalize('Error 404')).toBe('error 404')
    })

    it('handles empty string', () => {
      expect(normalize('')).toBe('')
    })

    it('preserves Cyrillic characters', () => {
      expect(normalize('дерьмо')).toBe('дерьмо')
    })

    it('preserves fullwidth characters', () => {
      expect(normalize('\uFF46\uFF55\uFF43\uFF4B')).toBe('\uFF46\uFF55\uFF43\uFF4B')
    })
  })
})
