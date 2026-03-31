import { describe, it, expect, vi } from 'vitest'
import { detectPositive, getPositiveSupportedLocales } from '../src/index.js'

describe('detectPositive (experimental)', () => {
  // --- Input validation ---

  describe('input validation', () => {
    it('returns neutral result for null input', () => {
      const result = detectPositive(null as unknown as string)
      expect(result.detected).toBe(false)
      expect(result.score).toBe(0)
      expect(result.matches).toEqual([])
      expect(result.localeSupported).toBe(true)
    })

    it('returns neutral result for undefined input', () => {
      const result = detectPositive(undefined as unknown as string)
      expect(result.detected).toBe(false)
      expect(result.score).toBe(0)
      expect(result.matches).toEqual([])
    })

    it('returns neutral result for empty string', () => {
      const result = detectPositive('')
      expect(result.detected).toBe(false)
      expect(result.score).toBe(0)
      expect(result.matches).toEqual([])
    })

    it('returns neutral result for non-string input', () => {
      const result = detectPositive(42 as unknown as string)
      expect(result.detected).toBe(false)
      expect(result.score).toBe(0)
    })

    it('handles very long input without hanging', () => {
      const longText = 'this is fine '.repeat(2000)
      const start = performance.now()
      const result = detectPositive(longText)
      const elapsed = performance.now() - start
      expect(result.detected).toBe(false)
      expect(elapsed).toBeLessThan(50)
    })
  })

  // --- Default mode ---

  describe('default mode (boolean existence)', () => {
    it('detects gratitude keywords', () => {
      const result = detectPositive('thank you so much')
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('thank you')
    })

    it('detects casual thanks', () => {
      const result = detectPositive('thx for the help')
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('thx')
    })

    it('detects enthusiasm keywords', () => {
      const result = detectPositive('this is amazing')
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('amazing')
    })

    it('detects strong positive phrases', () => {
      const result = detectPositive('I love it')
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('love it')
    })

    it('detects multi-word praise', () => {
      const result = detectPositive('exactly what i needed')
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('exactly what i needed')
    })

    it('matches phrases with extra whitespace', () => {
      const result = detectPositive('love   it')
      expect(result.matches).toContain('love it')
    })

    it('does not trigger on neutral text', () => {
      const result = detectPositive('please fix the bug in the auth module')
      expect(result.detected).toBe(false)
      expect(result.matches).toEqual([])
    })

    it('does not trigger on negative text', () => {
      const result = detectPositive('this is broken and horrible')
      expect(result.detected).toBe(false)
    })

    it('returns score=1 when detected in default mode', () => {
      const result = detectPositive('awesome work')
      expect(result.score).toBe(1)
    })

    it('returns score=0 when not detected', () => {
      const result = detectPositive('the function returns null')
      expect(result.score).toBe(0)
    })

    it('deduplicates matching terms', () => {
      const result = detectPositive('thanks thanks thanks')
      expect(result.matches).toEqual(['thanks'])
    })

    it('returns matches sorted alphabetically', () => {
      const result = detectPositive('awesome thanks perfect')
      const sorted = [...result.matches].sort()
      expect(result.matches).toEqual(sorted)
    })

    it('matches contain canonical pattern, not original text', () => {
      const result = detectPositive('THANKS')
      expect(result.matches).toContain('thanks')
    })
  })

  // --- Scored mode ---

  describe('scored mode (weighted severity)', () => {
    it('single mild match has low score', () => {
      const result = detectPositive('thanks', { scored: true })
      // thanks = mild (0.3), score = 0.3/3.0 = 0.1
      expect(result.score).toBeCloseTo(0.1, 2)
      expect(result.detected).toBe(false)
    })

    it('strong phrase has higher score', () => {
      const result = detectPositive('love it, this is a game changer', { scored: true })
      // love it (1.0) + game changer (1.0) = 2.0/3.0 = 0.667
      expect(result.score).toBeCloseTo(0.667, 2)
      expect(result.detected).toBe(true)
    })

    it('custom threshold works', () => {
      const result = detectPositive('thanks', { scored: true, threshold: 0.05 })
      expect(result.detected).toBe(true)
    })

    it('high threshold prevents triggering', () => {
      const result = detectPositive('thanks amazing', { scored: true, threshold: 0.9 })
      expect(result.detected).toBe(false)
    })

    it('exact threshold boundary triggers (>= comparison)', () => {
      // amazing (0.6) + perfect (0.6) = 1.2/3.0 = 0.4
      const result = detectPositive('amazing and perfect', { scored: true, threshold: 0.4 })
      expect(result.detected).toBe(true)
    })

    it('clamps score to 1.0 with many matches', () => {
      const result = detectPositive(
        'love it, blown away, you rock, life saver, game changer',
        { scored: true },
      )
      expect(result.score).toBeLessThanOrEqual(1)
    })

    it('deduplicates in scored mode', () => {
      const result = detectPositive('thanks thanks thanks', { scored: true })
      expect(result.matches).toEqual(['thanks'])
      expect(result.score).toBeCloseTo(0.1, 2)
    })
  })

  // --- Threshold ignored in default mode ---

  describe('threshold in default mode', () => {
    it('threshold option is ignored in default mode', () => {
      const result = detectPositive('thanks', { threshold: 0.9 })
      expect(result.detected).toBe(true)
    })
  })

  // --- Locale ---

  describe('locale', () => {
    it('uses English by default', () => {
      const result = detectPositive('thanks')
      expect(result.locale).toBe('en')
      expect(result.localeSupported).toBe(true)
    })

    it('detects Spanish positive sentiment', () => {
      const result = detectPositive('muchas gracias', { locale: 'es' })
      expect(result.locale).toBe('es')
      expect(result.localeSupported).toBe(true)
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('muchas gracias')
    })

    it('detects Chinese positive sentiment', () => {
      const result = detectPositive('太棒了', { locale: 'zh-cn' })
      expect(result.locale).toBe('zh-cn')
      expect(result.localeSupported).toBe(true)
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('太棒')
    })

    it('detects Chinese gratitude', () => {
      const result = detectPositive('非常感谢你的帮助', { locale: 'zh-cn' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('非常感谢')
    })

    it('does not trigger on neutral Chinese text', () => {
      const result = detectPositive('请帮我看一下这个代码', { locale: 'zh-cn' })
      expect(result.detected).toBe(false)
    })

    it('handles locale case insensitivity', () => {
      const result = detectPositive('thanks', { locale: 'EN' })
      expect(result.localeSupported).toBe(true)
      expect(result.detected).toBe(true)
    })

    it('returns localeSupported=false for unknown locale', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = detectPositive('something', { locale: 'ko' })
      expect(result.detected).toBe(false)
      expect(result.score).toBe(0)
      expect(result.localeSupported).toBe(false)
      expect(result.locale).toBe('ko')
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('unsupported locale'),
      )
      warnSpy.mockRestore()
    })

    it('handles partial options (only locale)', () => {
      const result = detectPositive('gracias', { locale: 'es' })
      expect(result.localeSupported).toBe(true)
    })

    it('handles partial options (only scored)', () => {
      const result = detectPositive('thanks', { scored: true })
      expect(result.locale).toBe('en')
    })

    it('handles empty options object', () => {
      const result = detectPositive('thanks', {})
      expect(result.locale).toBe('en')
      expect(result.detected).toBe(true)
    })
  })

  // --- Supported locales ---

  describe('getPositiveSupportedLocales', () => {
    it('returns array of supported locale codes', () => {
      const locales = getPositiveSupportedLocales()
      expect(locales).toContain('en')
      expect(locales).toContain('es')
      expect(locales).toContain('zh-cn')
      expect(locales.length).toBeGreaterThanOrEqual(3)
    })
  })
})
