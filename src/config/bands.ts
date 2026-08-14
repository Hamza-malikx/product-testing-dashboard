// One verdict system for the whole app.
export interface ScoreBand {
  word: 'Excellent' | 'Good' | 'Fair' | 'Poor'
  css: 'excellent' | 'good' | 'fair' | 'poor'
}

export function scoreBand(score: number): ScoreBand {
  if (score >= 85) return { word: 'Excellent', css: 'excellent' }
  if (score >= 70) return { word: 'Good', css: 'good' }
  if (score >= 55) return { word: 'Fair', css: 'fair' }
  return { word: 'Poor', css: 'poor' }
}
