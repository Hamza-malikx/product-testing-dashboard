// Shared chart styling. Canvas cannot read CSS variables,
// so keep these hex values in sync with src/assets/main.css.
export const chartColors = {
  ink: '#10161a',
  inkSoft: '#5b6b70',
  faint: '#5e6c6f', // matches --ink-faint, AA-legible on every surface
  line: '#e2e6e2',
  lineSoft: '#edefeb',
  paper: '#ffffff',
  teal900: '#0b5d50',
  teal700: '#0e7c6b',
  teal500: '#159c86',
  teal300: '#6fc7b4',
}

export const chartFonts = {
  body: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
}

// The bar gradient runs deep to bright along the bar's own length.
export function barGradient(top = false) {
  return {
    type: 'linear',
    x: 0,
    y: 0,
    x2: 1,
    y2: 0,
    colorStops: top
      ? [
          { offset: 0, color: '#073f37' },
          { offset: 1, color: chartColors.teal700 },
        ]
      : [
          { offset: 0, color: chartColors.teal900 },
          { offset: 1, color: chartColors.teal500 },
        ],
  }
}

// ECharts animates in JavaScript, so the CSS reduced-motion rule
// cannot stop it. Charts read this flag instead.
export const prefersReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
