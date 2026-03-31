import { describe, it, expect, vi } from 'vitest'
import { detectFrustration, getSupportedLocales } from '../src/index.js'

describe('detectFrustration', () => {
  // --- Input validation ---

  describe('input validation', () => {
    it('returns neutral result for null input', () => {
      const result = detectFrustration(null as unknown as string)
      expect(result.frustrated).toBe(false)
      expect(result.score).toBe(0)
      expect(result.matches).toEqual([])
      expect(result.localeSupported).toBe(true)
    })

    it('returns neutral result for undefined input', () => {
      const result = detectFrustration(undefined as unknown as string)
      expect(result.frustrated).toBe(false)
      expect(result.score).toBe(0)
      expect(result.matches).toEqual([])
    })

    it('returns neutral result for empty string', () => {
      const result = detectFrustration('')
      expect(result.frustrated).toBe(false)
      expect(result.score).toBe(0)
      expect(result.matches).toEqual([])
    })

    it('returns neutral result for non-string input', () => {
      const result = detectFrustration(42 as unknown as string)
      expect(result.frustrated).toBe(false)
      expect(result.score).toBe(0)
    })

    it('handles very long input without hanging', () => {
      const longText = 'this is fine '.repeat(2000) // ~26KB
      const start = performance.now()
      const result = detectFrustration(longText)
      const elapsed = performance.now() - start
      expect(result.frustrated).toBe(false)
      expect(elapsed).toBeLessThan(50)
    })
  })

  // --- Default mode: simple T/F existence ---

  describe('default mode (boolean existence)', () => {
    it('detects any frustration keyword', () => {
      const result = detectFrustration('shit')
      expect(result.frustrated).toBe(true)
      expect(result.matches).toContain('shit')
    })

    it('detects mild keywords', () => {
      const result = detectFrustration('this is horrible and awful')
      expect(result.frustrated).toBe(true)
      expect(result.matches).toContain('horrible')
      expect(result.matches).toContain('awful')
    })

    it('detects moderate keywords', () => {
      const result = detectFrustration('wtf this sucks')
      expect(result.frustrated).toBe(true)
      expect(result.matches).toContain('wtf')
      expect(result.matches).toContain('this sucks')
    })

    it('detects severe keywords', () => {
      const result = detectFrustration('what the fuck is this')
      expect(result.frustrated).toBe(true)
      expect(result.matches).toContain('what the fuck')
    })

    it('does not trigger on clean text', () => {
      const result = detectFrustration('thanks for helping me with this task')
      expect(result.frustrated).toBe(false)
      expect(result.score).toBe(0)
      expect(result.matches).toEqual([])
    })

    it('detects multi-word phrases', () => {
      const result = detectFrustration('this is a piece of shit')
      expect(result.matches).toContain('piece of shit')
    })

    it('matches phrases with extra whitespace', () => {
      const result = detectFrustration('piece  of  shit')
      expect(result.matches).toContain('piece of shit')
    })

    it('returns score=1 when frustrated in default mode', () => {
      const result = detectFrustration('shit')
      expect(result.score).toBe(1)
    })

    it('returns score=0 when not frustrated', () => {
      const result = detectFrustration('everything is great')
      expect(result.score).toBe(0)
    })

    it('deduplicates matching terms', () => {
      const result = detectFrustration('shit shit shit')
      expect(result.matches).toEqual(['shit'])
    })

    it('returns matches sorted alphabetically', () => {
      const result = detectFrustration('shit wtf horrible')
      const sorted = [...result.matches].sort()
      expect(result.matches).toEqual(sorted)
    })

    it('matches contain canonical pattern, not original text', () => {
      // "shiiiiit" normalizes to "shit" which matches the "shit" pattern
      const result = detectFrustration('shiiiiit')
      expect(result.matches).toContain('shit')
      expect(result.matches).not.toContain('shiiiiit')
    })
  })

  // --- Scored mode: weighted severity ---

  describe('scored mode (weighted severity)', () => {
    it('single mild match has low score', () => {
      const result = detectFrustration('this is horrible', { scored: true })
      // horrible = mild (0.3), score = 0.3/3.0 = 0.1
      expect(result.score).toBeCloseTo(0.1, 2)
      expect(result.frustrated).toBe(false) // below 0.4 threshold
    })

    it('single severe match has medium score', () => {
      const result = detectFrustration('well shit', { scored: true })
      // shit = severe (1.0), score = 1.0/3.0 = 0.333
      expect(result.score).toBeCloseTo(0.333, 2)
      expect(result.frustrated).toBe(false) // below 0.4 threshold
    })

    it('severe + mild triggers at default threshold', () => {
      const result = detectFrustration('shit this is horrible', { scored: true })
      // shit (1.0) + horrible (0.3) = 1.3/3.0 = 0.433
      expect(result.frustrated).toBe(true)
      expect(result.score).toBeCloseTo(0.433, 2)
    })

    it('two moderates trigger at default threshold', () => {
      const result = detectFrustration('wtf this sucks', { scored: true })
      // wtf (0.6) + this sucks (0.6) = 1.2/3.0 = 0.4
      expect(result.frustrated).toBe(true)
      expect(result.score).toBeCloseTo(0.4, 2)
    })

    it('clamps score to 1.0 with many matches', () => {
      const result = detectFrustration(
        'fuck shit what the fuck piece of shit dumbass',
        { scored: true },
      )
      expect(result.score).toBeLessThanOrEqual(1)
    })

    it('deduplicates in scored mode', () => {
      const result = detectFrustration('shit shit shit', { scored: true })
      expect(result.matches).toEqual(['shit'])
      expect(result.score).toBeCloseTo(0.333, 2)
    })

    it('custom threshold works in scored mode', () => {
      const result = detectFrustration('damn it', { scored: true, threshold: 0.05 })
      // damn it = mild (0.3), score = 0.1. 0.1 >= 0.05
      expect(result.frustrated).toBe(true)
    })

    it('high threshold prevents triggering in scored mode', () => {
      const result = detectFrustration('shit horrible', { scored: true, threshold: 0.9 })
      expect(result.frustrated).toBe(false)
    })

    it('exact threshold boundary triggers (>= comparison)', () => {
      const result = detectFrustration('wtf this sucks', { scored: true, threshold: 0.4 })
      expect(result.frustrated).toBe(true)
    })
  })

  // --- Threshold ignored in default mode ---

  describe('threshold in default mode', () => {
    it('threshold option is ignored in default mode', () => {
      // Even with threshold: 0.9, default mode triggers on any match
      const result = detectFrustration('damn it', { threshold: 0.9 })
      expect(result.frustrated).toBe(true)
    })
  })

  // --- Locale ---

  describe('locale', () => {
    it('uses English by default', () => {
      const result = detectFrustration('what the fuck')
      expect(result.locale).toBe('en')
      expect(result.localeSupported).toBe(true)
    })

    it('detects Spanish frustration', () => {
      const result = detectFrustration('esto es una mierda', { locale: 'es' })
      expect(result.locale).toBe('es')
      expect(result.localeSupported).toBe(true)
      expect(result.matches).toContain('mierda')
    })

    it('detects Chinese frustration', () => {
      const result = detectFrustration('这个AI真是垃圾', { locale: 'zh-cn' })
      expect(result.locale).toBe('zh-cn')
      expect(result.localeSupported).toBe(true)
      expect(result.frustrated).toBe(true)
      expect(result.matches).toContain('垃圾')
    })

    it('detects Chinese severe frustration', () => {
      const result = detectFrustration('他妈的什么破玩意', { locale: 'zh-cn' })
      expect(result.frustrated).toBe(true)
      expect(result.matches).toContain('他妈的')
      expect(result.matches).toContain('什么破玩意')
    })

    it('does not trigger on clean Chinese text', () => {
      const result = detectFrustration('谢谢你的帮助，这个功能很好用', { locale: 'zh-cn' })
      expect(result.frustrated).toBe(false)
      expect(result.matches).toEqual([])
    })

    it('Chinese substring matching works without word boundaries', () => {
      // "卧槽" embedded in a sentence without spaces
      const result = detectFrustration('卧槽这也太离谱了', { locale: 'zh-cn' })
      expect(result.frustrated).toBe(true)
      expect(result.matches).toContain('卧槽')
    })

    it('handles locale case insensitivity', () => {
      const result = detectFrustration('what the fuck', { locale: 'EN' })
      expect(result.localeSupported).toBe(true)
      expect(result.frustrated).toBe(true)
    })

    it('returns localeSupported=false for unknown locale', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = detectFrustration('something', { locale: 'fr' })
      expect(result.frustrated).toBe(false)
      expect(result.score).toBe(0)
      expect(result.localeSupported).toBe(false)
      expect(result.locale).toBe('fr')
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('unsupported locale'),
      )
      warnSpy.mockRestore()
    })

    it('handles partial options (only locale)', () => {
      const result = detectFrustration('mierda', { locale: 'es' })
      expect(result.localeSupported).toBe(true)
    })

    it('handles partial options (only scored)', () => {
      const result = detectFrustration('shit', { scored: true })
      expect(result.locale).toBe('en')
    })

    it('handles empty options object', () => {
      const result = detectFrustration('shit', {})
      expect(result.locale).toBe('en')
      expect(result.frustrated).toBe(true)
    })
  })

  // --- Supported locales ---

  describe('getSupportedLocales', () => {
    it('returns array of supported locale codes', () => {
      const locales = getSupportedLocales()
      expect(locales).toContain('en')
      expect(locales).toContain('es')
      expect(locales).toContain('zh-cn')
      expect(locales.length).toBeGreaterThanOrEqual(3)
    })
  })
})
