// One verdict system for the whole app. The thresholds live here once,
// and every badge, legend and report reads them from this list, so the
// rating scale printed on screen can never drift from the scale used
// to award it.
export interface ScoreBand {
  word: 'Excellent' | 'Good' | 'Fair' | 'Poor'
  css: 'excellent' | 'good' | 'fair' | 'poor'
  /** lowest score that still earns this band */
  min: number
  /** how the range reads in a legend */
  range: string
}

// Ordered from best to worst, which is also the order they are shown in
export const SCORE_BANDS: readonly ScoreBand[] = [
  { word: 'Excellent', css: 'excellent', min: 85, range: 'Excellent 85-100' },
  { word: 'Good', css: 'good', min: 70, range: 'Good 70-84' },
  { word: 'Fair', css: 'fair', min: 55, range: 'Fair 55-69' },
  { word: 'Poor', css: 'poor', min: 0, range: 'Poor below 55' },
]

export function scoreBand(score: number): ScoreBand {
  // The list is ordered high to low, so the first match is the right one.
  // The last entry has min 0, so there is always a match.
  return SCORE_BANDS.find((band) => score >= band.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1]!
}

/** Highest score first. Used by both charts, the table and the report. */
export function byScoreDesc<T extends { score: number }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => b.score - a.score)
}
