import { describe, it, expect, vi } from 'vitest'
import { detectNegative, detectPositive, getSupportedLocales, getPositiveSupportedLocales } from '../src/index.js'

describe('experimental locales', () => {
  // --- Japanese (ja) ---

  describe('Japanese negative detection', () => {
    it('detects severe frustration', () => {
      const result = detectNegative('クソみたいなバグだ', { locale: 'ja' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('クソ')
    })

    it('detects moderate frustration', () => {
      const result = detectNegative('最悪だ', { locale: 'ja' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('最悪')
    })

    it('detects mild frustration', () => {
      const result = detectNegative('ひどいバグだ', { locale: 'ja' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('ひどい')
    })

    it('does not trigger on clean Japanese text', () => {
      const result = detectNegative('このコードを修正してください', { locale: 'ja' })
      expect(result.detected).toBe(false)
    })

    it('substring matching works without word boundaries', () => {
      const result = detectNegative('もうイライラする', { locale: 'ja' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('イライラ')
    })
  })

  describe('Japanese positive detection', () => {
    it('detects gratitude', () => {
      const result = detectPositive('ありがとうございます', { locale: 'ja' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('ありがとうございます')
    })

    it('detects strong positive', () => {
      const result = detectPositive('最高です', { locale: 'ja' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('最高')
    })

    it('does not trigger on neutral Japanese text', () => {
      const result = detectPositive('この関数の使い方を教えてください', { locale: 'ja' })
      expect(result.detected).toBe(false)
    })
  })

  // --- French (fr) ---

  describe('French negative detection', () => {
    it('detects severe frustration', () => {
      const result = detectNegative('putain de merde', { locale: 'fr' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('merde')
      expect(result.matches).toContain('putain')
    })

    it('detects moderate frustration', () => {
      const result = detectNegative("j'en ai marre", { locale: 'fr' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('marre')
    })

    it('detects mild frustration', () => {
      const result = detectNegative("c'est horrible", { locale: 'fr' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('horrible')
    })

    it('does not trigger on clean French text', () => {
      const result = detectNegative('Pouvez-vous corriger ce bug?', { locale: 'fr' })
      expect(result.detected).toBe(false)
    })

    it('matches diacritics correctly', () => {
      const result = detectNegative('c\'est dégueulasse', { locale: 'fr' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('dégueulasse')
    })

    it('matches apostrophe phrases', () => {
      const result = detectNegative("n'importe quoi", { locale: 'fr' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain("n'importe quoi")
    })

    it('matches ça craint with cedilla', () => {
      const result = detectNegative('ça craint', { locale: 'fr' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('ça craint')
    })
  })

  describe('French positive detection', () => {
    it('detects gratitude', () => {
      const result = detectPositive('merci beaucoup', { locale: 'fr' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('merci beaucoup')
    })

    it('detects enthusiasm', () => {
      const result = detectPositive("c'est magnifique", { locale: 'fr' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('magnifique')
    })

    it('matches j\'adore with apostrophe', () => {
      const result = detectPositive("j'adore", { locale: 'fr' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain("j'adore")
    })

    it('matches bien joué with accent', () => {
      const result = detectPositive('bien joué', { locale: 'fr' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('bien joué')
    })

    it('does not trigger on neutral French text', () => {
      const result = detectPositive('Je travaille sur le projet', { locale: 'fr' })
      expect(result.detected).toBe(false)
    })
  })

  // --- Russian (ru) ---

  describe('Russian negative detection', () => {
    it('detects severe frustration', () => {
      const result = detectNegative('это полное дерьмо', { locale: 'ru' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('дерьмо')
    })

    it('detects moderate frustration', () => {
      const result = detectNegative('это бесит', { locale: 'ru' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('бесит')
    })

    it('detects mild frustration', () => {
      const result = detectNegative('какой ужас', { locale: 'ru' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('ужас')
    })

    it('does not trigger on clean Russian text', () => {
      const result = detectNegative('Помогите исправить ошибку в коде', { locale: 'ru' })
      expect(result.detected).toBe(false)
    })
  })

  describe('Russian positive detection', () => {
    it('detects gratitude', () => {
      const result = detectPositive('большое спасибо', { locale: 'ru' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('большое спасибо')
    })

    it('detects enthusiasm', () => {
      const result = detectPositive('это отлично работает', { locale: 'ru' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('отлично')
    })

    it('does not trigger on neutral Russian text', () => {
      const result = detectPositive('Я работаю над проектом', { locale: 'ru' })
      expect(result.detected).toBe(false)
    })
  })

  // --- German (de) ---

  describe('German negative detection', () => {
    it('detects severe frustration', () => {
      const result = detectNegative('das ist totaler Scheiße', { locale: 'de' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('scheiße')
    })

    it('detects moderate frustration', () => {
      const result = detectNegative('verdammt nochmal', { locale: 'de' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('verdammt')
    })

    it('detects mild frustration', () => {
      const result = detectNegative('das ist furchtbar', { locale: 'de' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('furchtbar')
    })

    it('does not trigger on clean German text', () => {
      const result = detectNegative('Können Sie den Fehler beheben?', { locale: 'de' })
      expect(result.detected).toBe(false)
    })

    it('detects alternative spelling scheisse', () => {
      const result = detectNegative('das ist scheisse', { locale: 'de' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('scheisse')
    })

    it('matches umlaut forms', () => {
      const result = detectNegative('was zur Hölle', { locale: 'de' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('was zur hölle')
    })

    it('matches völlig with umlaut', () => {
      const result = detectNegative('völlig daneben', { locale: 'de' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('völlig daneben')
    })
  })

  describe('German positive detection', () => {
    it('detects gratitude', () => {
      const result = detectPositive('vielen dank', { locale: 'de' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('vielen dank')
    })

    it('detects enthusiasm', () => {
      const result = detectPositive('das ist wunderbar', { locale: 'de' })
      expect(result.detected).toBe(true)
      expect(result.matches).toContain('wunderbar')
    })

    it('does not trigger on neutral German text', () => {
      const result = detectPositive('Ich arbeite an dem Projekt', { locale: 'de' })
      expect(result.detected).toBe(false)
    })
  })

  // --- Locale registration ---

  describe('locale registration', () => {
    it('getSupportedLocales includes all 7 locales', () => {
      const locales = getSupportedLocales()
      expect(locales).toContain('en')
      expect(locales).toContain('es')
      expect(locales).toContain('zh-cn')
      expect(locales).toContain('ja')
      expect(locales).toContain('fr')
      expect(locales).toContain('ru')
      expect(locales).toContain('de')
      expect(locales).toHaveLength(7)
    })

    it('getPositiveSupportedLocales includes all 7 locales', () => {
      const locales = getPositiveSupportedLocales()
      expect(locales).toContain('en')
      expect(locales).toContain('es')
      expect(locales).toContain('zh-cn')
      expect(locales).toContain('ja')
      expect(locales).toContain('fr')
      expect(locales).toContain('ru')
      expect(locales).toContain('de')
      expect(locales).toHaveLength(7)
    })
  })

  // --- Scored mode works for new locales ---

  describe('scored mode for new locales', () => {
    it('Japanese scored mode works', () => {
      const result = detectNegative('クソみたいだ', { locale: 'ja', scored: true })
      expect(result.score).toBeGreaterThan(0)
    })

    it('French scored mode works', () => {
      const result = detectNegative('merde', { locale: 'fr', scored: true })
      expect(result.score).toBeGreaterThan(0)
    })

    it('Russian scored mode works', () => {
      const result = detectNegative('дерьмо', { locale: 'ru', scored: true })
      expect(result.score).toBeGreaterThan(0)
    })

    it('German scored mode works', () => {
      const result = detectNegative('scheiße', { locale: 'de', scored: true })
      expect(result.score).toBeGreaterThan(0)
    })
  })

  // --- False positive prevention ---

  describe('Japanese false positive prevention', () => {
    const neutralJapanese = [
      'このコードを修正してください',
      'データベースの設定を確認します',
      'テストを実行しています',
      '関数の戻り値を確認してください',
      'プロジェクトの進捗報告',
    ]

    for (const text of neutralJapanese) {
      it(`negative does not trigger on: "${text.slice(0, 20)}..."`, () => {
        expect(detectNegative(text, { locale: 'ja' }).detected).toBe(false)
      })
      it(`positive does not trigger on: "${text.slice(0, 20)}..."`, () => {
        expect(detectPositive(text, { locale: 'ja' }).detected).toBe(false)
      })
    }

    it('神社 (shrine) does not trigger positive', () => {
      expect(detectPositive('神社に行きました', { locale: 'ja' }).detected).toBe(false)
    })

    it('使う (use) does not trigger negative 使えない', () => {
      expect(detectNegative('この関数を使う', { locale: 'ja' }).detected).toBe(false)
    })
  })

  describe('French false positive prevention', () => {
    const neutralFrench = [
      'Pouvez-vous corriger ce bug?',
      'Le serveur ne répond pas',
      'Je travaille sur le projet',
      'La fonction retourne une erreur',
      'Merci de vérifier la configuration',
    ]

    for (const text of neutralFrench) {
      it(`negative does not trigger on: "${text.slice(0, 30)}..."`, () => {
        expect(detectNegative(text, { locale: 'fr' }).detected).toBe(false)
      })
    }

    it('annuler does not match nul', () => {
      expect(detectNegative('veuillez annuler la commande', { locale: 'fr' }).detected).toBe(false)
    })

    it('top-level technical text does not trigger positive', () => {
      expect(detectPositive('top priority task', { locale: 'fr' }).detected).toBe(false)
    })
  })

  describe('Russian false positive prevention', () => {
    const neutralRussian = [
      'Помогите исправить ошибку в коде',
      'Сервер не отвечает на запросы',
      'Я работаю над новой функцией',
      'Проверьте конфигурацию базы данных',
      'Тест выполнен успешно',
    ]

    for (const text of neutralRussian) {
      it(`negative does not trigger on: "${text.slice(0, 25)}..."`, () => {
        expect(detectNegative(text, { locale: 'ru' }).detected).toBe(false)
      })
      it(`positive does not trigger on: "${text.slice(0, 25)}..."`, () => {
        expect(detectPositive(text, { locale: 'ru' }).detected).toBe(false)
      })
    }
  })

  describe('German false positive prevention', () => {
    const neutralGerman = [
      'Können Sie den Fehler beheben?',
      'Der Server antwortet nicht',
      'Ich arbeite an dem Projekt',
      'Bitte überprüfen Sie die Konfiguration',
      'Der Test ist erfolgreich gelaufen',
    ]

    for (const text of neutralGerman) {
      it(`negative does not trigger on: "${text.slice(0, 30)}..."`, () => {
        expect(detectNegative(text, { locale: 'de' }).detected).toBe(false)
      })
    }

    it('Supermarkt does not trigger positive "super"', () => {
      expect(detectPositive('Ich gehe zum Supermarkt', { locale: 'de' }).detected).toBe(false)
    })
  })

  describe('removed pattern verification', () => {
    it('Chinese 666 in phone number does not trigger', () => {
      expect(detectPositive('电话号码是13866612345', { locale: 'zh-cn' }).detected).toBe(false)
    })

    it('Chinese 赞 as single char is removed', () => {
      expect(detectPositive('赞助商', { locale: 'zh-cn' }).detected).toBe(false)
    })

    it('Japanese 神 as single char is removed', () => {
      expect(detectPositive('神社に行きました', { locale: 'ja' }).detected).toBe(false)
    })
  })

  // --- Cross-locale isolation ---

  describe('cross-locale isolation', () => {
    it('French patterns do not trigger on English text', () => {
      const result = detectNegative('Can you help me with this?', { locale: 'fr' })
      expect(result.detected).toBe(false)
    })

    it('German patterns do not trigger on English text', () => {
      const result = detectNegative('The function is not working', { locale: 'de' })
      expect(result.detected).toBe(false)
    })

    it('Russian patterns do not trigger on English text', () => {
      const result = detectNegative('Please fix this bug', { locale: 'ru' })
      expect(result.detected).toBe(false)
    })

    it('Japanese patterns do not trigger on English text', () => {
      const result = detectNegative('How do I deploy this?', { locale: 'ja' })
      expect(result.detected).toBe(false)
    })
  })
})
