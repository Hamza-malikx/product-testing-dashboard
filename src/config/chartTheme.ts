// Shared chart styling. Canvas cannot read CSS variables,
// so keep these hex values in sync with src/assets/main.css.
export const chartColors = {
  ink: '#1a1f24',
  muted: '#5c6670',
  hairline: '#e4e6e3',
  paper: '#fcfcfb',
  blue: '#24537b',
  blueHover: '#1c4265',
}

export const chartFonts = {
  body: "'Public Sans', 'Helvetica Neue', Arial, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, monospace",
}

// ECharts animates in JavaScript, so the CSS reduced-motion rule
// cannot stop it. Charts read this flag instead.
export const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
