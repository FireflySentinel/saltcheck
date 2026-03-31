export type IntensityTier = 'mild' | 'moderate' | 'severe'

/** Word boundary strategy for pattern matching */
export type BoundaryMode = 'word' | 'substring'

export interface WordlistPattern {
  term: string
  tier: IntensityTier
}

export interface WordlistData {
  locale: string
  /** 'word' uses \b regex boundaries (Latin scripts). 'substring' uses plain matching (CJK). Default: 'word'. */
  boundary?: BoundaryMode
  patterns: WordlistPattern[]
}

export interface CompiledPattern {
  term: string
  tier: IntensityTier
  weight: number
  regex: RegExp
}

export const TIER_WEIGHTS: Record<IntensityTier, number> = {
  mild: 0.3,
  moderate: 0.6,
  severe: 1.0,
}
