import { describe, it, expect } from 'vitest'
import { detectPositive } from '../src/index.js'

describe('positive detection false positive prevention', () => {
  // --- Scunthorpe-style word boundary ---

  describe('word boundary (no partial matches)', () => {
    const shouldNotTrigger = [
      'thanksgiving',
      'thankless',
      'perfectly',
      'imperfect',
      'lovelier',
      'gloves',
      'typewriter',
      'appreciated',
      'unimpressed',
    ]

    for (const word of shouldNotTrigger) {
      it(`does not match "${word}"`, () => {
        const result = detectPositive(word)
        expect(result.detected).toBe(false)
        expect(result.matches).toEqual([])
      })
    }
  })

  // --- Normal conversational text ---

  describe('normal conversational text', () => {
    const neutralMessages = [
      'Can you help me with this code?',
      'I need to fix a bug in the authentication module',
      'The function returns undefined instead of the expected value',
      'How do I deploy this to production?',
      'Let me try a different approach',
      'I think the issue is in the database query',
      'Can you explain how this algorithm works?',
      'The test is passing now',
      'Please review my pull request',
      'I need to refactor this service',
    ]

    for (const message of neutralMessages) {
      it(`does not trigger on: "${message.slice(0, 50)}..."`, () => {
        const result = detectPositive(message)
        expect(result.detected).toBe(false)
      })
    }
  })

  // --- Text with numbers ---

  describe('text with numbers', () => {
    it('does not false-positive on "Error 404"', () => {
      const result = detectPositive('Error 404 not found')
      expect(result.detected).toBe(false)
    })

    it('does not false-positive on code snippets', () => {
      const result = detectPositive('const x = 100; if (x > 0) return true;')
      expect(result.detected).toBe(false)
    })

    it('does not false-positive on IP addresses', () => {
      const result = detectPositive('connect to 192.168.1.1 on port 8080')
      expect(result.detected).toBe(false)
    })
  })

  // --- Negative text should not trigger positive ---

  describe('negative text does not trigger positive', () => {
    const negativeMessages = [
      'this is horrible',
      'what the fuck',
      'shit this is broken',
      'wtf is going on',
      'this sucks',
      'damn it nothing works',
    ]

    for (const message of negativeMessages) {
      it(`does not trigger on: "${message}"`, () => {
        const result = detectPositive(message)
        expect(result.detected).toBe(false)
      })
    }
  })

  // --- Spanish false positives ---

  describe('Spanish patterns on English text', () => {
    it('Spanish positive patterns do not false-positive on English', () => {
      const englishTexts = [
        'Can you help me with this?',
        'The function is not working properly',
        'I need to initialize the database',
        'Please assist me with the configuration',
      ]

      for (const text of englishTexts) {
        const result = detectPositive(text, { locale: 'es' })
        expect(result.detected).toBe(false)
        expect(result.matches).toEqual([])
      }
    })
  })

  // --- Chinese false positives ---

  describe('Chinese false positive prevention', () => {
    const neutralChineseTexts = [
      '请帮我看一下这个代码',
      '我需要配置数据库连接',
      '请问这个API怎么调用',
      '今天天气不错',
      '我正在学习编程',
      '这个项目的文档写得很详细',
      '帮我修一下这个bug',
    ]

    for (const text of neutralChineseTexts) {
      it(`does not trigger on: "${text.slice(0, 20)}..."`, () => {
        const result = detectPositive(text, { locale: 'zh-cn' })
        expect(result.detected).toBe(false)
        expect(result.matches).toEqual([])
      })
    }

    it('Chinese positive patterns do not false-positive on English text', () => {
      const result = detectPositive('Can you help me with this code?', { locale: 'zh-cn' })
      expect(result.detected).toBe(false)
    })
  })
})
