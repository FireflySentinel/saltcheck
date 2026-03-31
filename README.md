# saltcheck

A zero-dependency, multilingual sentiment detector for AI/LLM product telemetry.

Inspired by the Claude Code source leak (March 31, 2026): Anthropic's `matchesNegativeKeyword()` silently tags user messages as `analytics_negative`. This is the open-source, multilingual version.

**Not a sentiment analyzer** (use `sentiment` for that). **Not a profanity filter** (use `@2toad/profanity` for that). A keyword-based signal detector for real-time product health monitoring, with experimental positive sentiment detection.

## Install

```bash
npm install saltcheck
```

## Usage

```typescript
import { detectNegative, detectPositive } from 'saltcheck'

// Simple boolean: any match = detected (like Anthropic's approach)
detectNegative('what the fuck is this')
// { detected: true, matches: ['fuck', 'what the fuck'], locale: 'en', localeSupported: true, score: 1 }

detectNegative('thanks, that helped!')
// { detected: false, matches: [], locale: 'en', localeSupported: true, score: 0 }
```

### Positive detection (experimental)

```typescript
detectPositive('this is amazing, love it')
// { detected: true, matches: ['amazing', 'love it'], locale: 'en', localeSupported: true, score: 1 }

detectPositive('please fix the auth bug')
// { detected: false, matches: [], locale: 'en', localeSupported: true, score: 0 }
```

### Spanish

```typescript
detectNegative('esto es una mierda', { locale: 'es' })
// { detected: true, matches: ['mierda'], ... }
```

### Chinese (Simplified)

```typescript
detectNegative('这个AI真是垃圾', { locale: 'zh-cn' })
// { detected: true, matches: ['垃圾'], ... }

detectNegative('他妈的什么破玩意', { locale: 'zh-cn' })
// { detected: true, matches: ['他妈的', '破玩意'], ... }
```

Chinese and Japanese use substring matching (no word boundaries needed). Single ambiguous characters are excluded to prevent false positives with common compound words.

### Scored mode (experimental)

Enable weighted severity scoring for finer-grained signal:

```typescript
detectNegative('damn it', { scored: true })
// { detected: false, score: 0.1, matches: ['damn it'], ... }
// matches shows what was found; detected is the final verdict after threshold check.
// Single mild match: score 0.1 is below the default 0.4 threshold, so detected = false.

detectNegative('shit this is horrible', { scored: true })
// { detected: true, score: 0.433, matches: ['horrible', 'shit'], ... }
// Severe + mild: above threshold

detectNegative('damn it', { scored: true, threshold: 0.05 })
// { detected: true, ... }
// Lower threshold = more sensitive
```

### Check locale support

```typescript
const result = detectNegative('text', { locale: 'ko' })
if (!result.localeSupported) {
  // Korean is not supported yet. Detection was skipped.
}
```

## API

### `detectNegative(text, options?)`

Detect negative sentiment/frustration in text.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `text` | `string` | required | The text to analyze |
| `options.locale` | `string` | `'en'` | Locale code (see supported languages) |
| `options.scored` | `boolean` | `false` | Enable weighted severity scoring |
| `options.threshold` | `number` | `0.4` | Score threshold (only used in scored mode) |

### `detectPositive(text, options?)` (experimental)

Detect positive sentiment/satisfaction in text. Same API shape as `detectNegative`.

### Return type: `DetectionResult`

| Field | Type | Description |
|-------|------|-------------|
| `detected` | `boolean` | `true` if any pattern matched (default) or score >= threshold (scored) |
| `matches` | `string[]` | Canonical patterns that matched (sorted) |
| `locale` | `string` | Locale used for detection |
| `localeSupported` | `boolean` | `false` if locale has no wordlist |
| `score` | `number` | 0 or 1 in default mode. 0-1 weighted score in scored mode. |

### `getSupportedLocales()`

Returns an array of supported locale codes for negative detection.

### `getPositiveSupportedLocales()`

Returns an array of supported locale codes for positive detection.

## How it works

**Default mode (battle-tested):**
1. Normalize input (lowercase, collapse repeated characters, strip apostrophes)
2. Match against ~25 curated patterns per language using word boundaries
3. Any match = `detected: true`. That's it. Same approach Anthropic ships in production.

**Scored mode (experimental):**
Same as above, but each pattern has a severity weight (mild=0.3, moderate=0.6, severe=1.0). Score = sum of weights / 3.0, clamped to [0,1]. `detected = score >= threshold`.

Patterns use word boundary matching (`\b`) for Latin scripts and substring matching for CJK scripts. Non-ASCII patterns (accented characters) use whitespace-based boundaries. "assistant" does not match "ass". "classic" does not match "ass".

## Supported languages

| Locale | Negative | Positive | Matching | Status |
|--------|----------|----------|----------|--------|
| `en` | 34 | 28 | Word boundary | Stable |
| `es` | 26 | 18 | Word boundary | Stable |
| `zh-cn` | 26 | 16 | Substring | Stable |
| `ja` | 25 | 16 | Substring | Experimental |
| `fr` | 24 | 17 | Word boundary | Experimental |
| `ru` | 24 | 18 | Substring | Experimental |
| `de` | 24 | 18 | Word boundary | Experimental |

## Design decisions

- **Zero dependencies.** No ML models, no NLP libraries, no API calls.
- **Sub-millisecond.** Fast enough to run inline on every message.
- **Boolean by default.** Any match = detected. No thresholds, no scoring, no tuning. The scored mode exists for users who need finer-grained signal, but the default mirrors what Anthropic validated in production.
- **Battle-tested pattern count.** ~25 patterns per language, not hundreds. Fewer patterns = fewer false positives = more trust in the signal.
- **Never throws.** Invalid input returns a neutral result. Unsupported locales return `localeSupported: false`.

## Contributing a language

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add a new language wordlist.

## License

MIT
