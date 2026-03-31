# Contributing a language

Adding a new language is the most valuable contribution you can make. Here's how.

## Wordlist format

Create a JSON file at `src/wordlists/{locale}.json`:

```json
{
  "locale": "fr",
  "patterns": [
    { "term": "merde", "tier": "severe" },
    { "term": "putain", "tier": "severe" },
    { "term": "c'est nul", "tier": "moderate" },
    { "term": "ras le bol", "tier": "moderate" },
    { "term": "horrible", "tier": "mild" }
  ]
}
```

### Tiers

| Tier | Weight | Examples (English) |
|------|--------|--------------------|
| `mild` | 0.3 | "annoying", "horrible", "ugh" |
| `moderate` | 0.6 | "wtf", "this sucks", "pissed off" |
| `severe` | 1.0 | "fuck", "shit", "piece of shit" |

### Guidelines

- **~20-30 patterns per language.** Not an exhaustive dictionary. High-signal, high-confidence patterns only.
- **Include frustration expressions, not just profanity.** "no funciona" (doesn't work), "estoy harto" (I'm fed up) are valuable frustration signals even without swear words.
- **Test for false positives.** Every word in your wordlist should be checked against common words in your language to make sure it doesn't trigger on normal text.
- **Quality gate:** Each language must match English-level false-positive rate before shipping.

## Register the wordlist

After creating the JSON file, add it to the loader in `src/wordlists/loader.ts`:

```typescript
import frData from './fr.json'

const RAW_WORDLISTS: Record<string, WordlistData> = {
  en: enData as WordlistData,
  es: esData as WordlistData,
  fr: frData as WordlistData,  // add your locale here
}
```

## Testing

Run the full test suite:

```bash
npm test
```

Add test cases in `test/detect.test.ts` and `test/false-pos.test.ts` for your language.

The `test/regex-safety.test.ts` file automatically tests all patterns in all wordlists for ReDoS safety. No additional work needed there.

## Known limitation: word boundaries

`\b` word boundaries in JavaScript regex are ASCII-only. This works correctly for Latin-script languages (English, Spanish, French, Portuguese, etc.) but will NOT work for:

- CJK (Chinese, Japanese, Korean)
- Arabic, Hebrew
- Thai, Devanagari

If you want to contribute a non-Latin locale, please open an issue first so we can discuss the boundary-matching strategy.

## Submitting

1. Fork the repo
2. Create a branch (`feat/add-french-wordlist`)
3. Add your JSON wordlist + update the loader + add tests
4. Run `npm test` to verify
5. Open a PR with a description of your language expertise
