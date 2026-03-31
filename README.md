# saltcheck

A zero-dependency, multilingual frustration detector for AI/LLM product telemetry.

Inspired by how Anthropic silently detects user frustration in Claude Code via keyword matching and tags messages as `analytics_negative`. This library generalizes that pattern for any AI product.

**Not a sentiment analyzer** (use `sentiment` for that). **Not a profanity filter** (use `@2toad/profanity` for that). A frustration detector for real-time product health monitoring.

## Install

```bash
npm install saltcheck
```

## Usage

```typescript
import { detectFrustration } from 'saltcheck'

// Simple boolean: any match = frustrated (like Anthropic's approach)
detectFrustration('what the fuck is this')
// { frustrated: true, matches: ['fuck', 'what the fuck'], locale: 'en', localeSupported: true, score: 1 }

detectFrustration('thanks, that helped!')
// { frustrated: false, matches: [], locale: 'en', localeSupported: true, score: 0 }
```

### Spanish

```typescript
detectFrustration('esto es una mierda', { locale: 'es' })
// { frustrated: true, matches: ['mierda'], ... }
```

### Chinese (Simplified)

```typescript
detectFrustration('这个AI真是垃圾', { locale: 'zh-cn' })
// { frustrated: true, matches: ['垃圾'], ... }

detectFrustration('他妈的什么破玩意', { locale: 'zh-cn' })
// { frustrated: true, matches: ['他妈的', '什么破玩意'], ... }
```

Chinese uses substring matching (no word boundaries needed). Single ambiguous characters like 操 and 靠 are excluded to prevent false positives with common words like 操作 (operate).

### Scored mode (experimental)

Enable weighted severity scoring for finer-grained signal:

```typescript
detectFrustration('damn it', { scored: true })
// { frustrated: false, score: 0.1, matches: ['damn it'], ... }
// Single mild match: below 0.4 threshold

detectFrustration('shit this is horrible', { scored: true })
// { frustrated: true, score: 0.433, matches: ['horrible', 'shit'], ... }
// Severe + mild: above threshold

detectFrustration('damn it', { scored: true, threshold: 0.05 })
// { frustrated: true, ... }
// Lower threshold = more sensitive
```

### Check locale support

```typescript
const result = detectFrustration('text', { locale: 'fr' })
if (!result.localeSupported) {
  // French is not supported yet. Detection was skipped.
}
```

## API

### `detectFrustration(text, options?)`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `text` | `string` | required | The text to analyze |
| `options.locale` | `string` | `'en'` | Locale code (`'en'`, `'es'`, `'zh-cn'`) |
| `options.scored` | `boolean` | `false` | Enable weighted severity scoring |
| `options.threshold` | `number` | `0.4` | Score threshold (only used in scored mode) |

Returns `FrustrationResult`:

| Field | Type | Description |
|-------|------|-------------|
| `frustrated` | `boolean` | `true` if any pattern matched (default) or score >= threshold (scored) |
| `matches` | `string[]` | Canonical patterns that matched (sorted) |
| `locale` | `string` | Locale used for detection |
| `localeSupported` | `boolean` | `false` if locale has no wordlist |
| `score` | `number` | 0 or 1 in default mode. 0-1 weighted score in scored mode. |

### `getSupportedLocales()`

Returns an array of supported locale codes (e.g., `['en', 'es', 'zh-cn']`).

## How it works

**Default mode (battle-tested):**
1. Normalize input (lowercase, collapse repeated characters, replace unicode confusables)
2. Match against ~25 curated patterns per language using word boundaries
3. Any match = `frustrated: true`. That's it. Same approach Anthropic ships in production.

**Scored mode (experimental):**
Same as above, but each pattern has a severity weight (mild=0.3, moderate=0.6, severe=1.0). Score = sum of weights / 3.0, clamped to [0,1]. `frustrated = score >= threshold`.

Patterns use word boundary matching (`\b`) to prevent false positives. "assistant" does not match "ass". "classic" does not match "ass".

## Supported languages

| Locale | Patterns | Matching | Status |
|--------|----------|----------|--------|
| `en` | 34 | Word boundary (`\b`) | Stable — 1:1 with Anthropic's `matchesNegativeKeyword` |
| `es` | 26 | Word boundary (`\b`) | Stable |
| `zh-cn` | 26 | Substring | Stable |

## Design decisions

- **Zero dependencies.** No ML models, no NLP libraries, no API calls.
- **Sub-millisecond.** Fast enough to run inline on every message.
- **Boolean by default.** Any match = frustrated. No thresholds, no scoring, no tuning. The scored mode exists for users who need finer-grained signal, but the default mirrors what Anthropic validated in production.
- **Battle-tested pattern count.** ~25 patterns per language, not hundreds. Fewer patterns = fewer false positives = more trust in the signal.
- **Never throws.** Invalid input returns a neutral result. Unsupported locales return `localeSupported: false`.

## Contributing a language

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add a new language wordlist.

## License

MIT
