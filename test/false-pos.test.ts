import { describe, it, expect } from 'vitest'
import { detectNegative } from '../src/index.js'

describe('false positive prevention', () => {
  // --- Scunthorpe problem ---

  describe('Scunthorpe problem (word boundary)', () => {
    const shouldNotTrigger = [
      'assistant',
      'classic',
      'Scunthorpe',
      'mishit',
      'cockatoo',
      'assume',
      'assess',
      'compass',
      'therapist',
      'buttress',
      'document',
      'analytics',
    ]

    for (const word of shouldNotTrigger) {
      it(`does not match "${word}"`, () => {
        const result = detectNegative(word)
        expect(result.detected).toBe(false)
        expect(result.matches).toEqual([])
      })
    }
  })

  // --- Normal conversational text ---

  describe('normal conversational text', () => {
    const cleanMessages = [
      'Can you help me with this code?',
      'I need to fix a bug in the authentication module',
      'The function returns undefined instead of the expected value',
      'How do I deploy this to production?',
      'Thanks for the quick response',
      'Let me try a different approach',
      'I think the issue is in the database query',
      'Can you explain how this algorithm works?',
      'The test is passing now',
      'I appreciate your help with this',
    ]

    for (const message of cleanMessages) {
      it(`does not trigger on: "${message.slice(0, 50)}..."`, () => {
        const result = detectNegative(message)
        expect(result.detected).toBe(false)
      })
    }
  })

  // --- Text with numbers ---

  describe('text with numbers (no leetspeak in v1)', () => {
    it('does not false-positive on "Error 404"', () => {
      const result = detectNegative('Error 404 not found')
      expect(result.detected).toBe(false)
    })

    it('does not false-positive on code snippets', () => {
      const result = detectNegative('const x = 100; if (x > 0) return true;')
      expect(result.detected).toBe(false)
    })

    it('does not false-positive on IP addresses', () => {
      const result = detectNegative('connect to 192.168.1.1 on port 8080')
      expect(result.detected).toBe(false)
    })
  })

  // --- Spanish false positives ---

  describe('Spanish patterns on English text', () => {
    it('Spanish patterns do not false-positive on English', () => {
      const englishTexts = [
        'Can you help me with this?',
        'The function is not working properly',
        'I need to initialize the database',
        'Please assist me with the configuration',
      ]

      for (const text of englishTexts) {
        const result = detectNegative(text, { locale: 'es' })
        expect(result.detected).toBe(false)
        expect(result.matches).toEqual([])
      }
    })
  })

  // --- Chinese false positives ---

  describe('Chinese false positive prevention', () => {
    const cleanChineseTexts = [
      '请帮我看一下这个代码',
      '这个功能很好用，谢谢',
      '我需要配置数据库连接',
      '请问这个API怎么调用',
      '今天天气不错',
      '我正在学习编程',
      '这个项目的文档写得很好',
    ]

    for (const text of cleanChineseTexts) {
      it(`does not trigger on: "${text.slice(0, 20)}..."`, () => {
        const result = detectNegative(text, { locale: 'zh-cn' })
        expect(result.detected).toBe(false)
        expect(result.matches).toEqual([])
      })
    }

    it('does not false-positive on 操作 (operate)', () => {
      // "操" alone would be a swear word, but we skip single-char terms
      const result = detectNegative('请操作这个按钮', { locale: 'zh-cn' })
      expect(result.detected).toBe(false)
    })

    it('does not false-positive on Chinese text with numbers', () => {
      const result = detectNegative('错误代码404，请重试', { locale: 'zh-cn' })
      expect(result.detected).toBe(false)
    })

    it('Chinese patterns do not false-positive on English text', () => {
      const result = detectNegative('Can you help me with this code?', { locale: 'zh-cn' })
      expect(result.detected).toBe(false)
    })
  })
})
