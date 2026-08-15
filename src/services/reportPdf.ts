import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { scoreBand } from '@/config/bands'
import type { AggregateStats, Product } from '@/types/models'

// Colors kept in sync with src/assets/main.css
const INK = '#1a1f24'
const MUTED = '#5c6670'
const ACCENT = '#0d3a4e'
const NAVY = '#24537b'
const HAIRLINE = '#e4e6e3'

export interface ReportOptions {
  category: string
  products: Product[]
  totalTested: number
  /** category-level stats; omit for a single-product report */
  stats?: AggregateStats
  /** draw the score chart (category reports only, needs stats) */
  withChart?: boolean
  /** report file name without extension */
  fileName: string
}

/**
 * Draws the score bar chart as native PDF vector graphics.
 * A vector chart stays crisp at any zoom or print size, keeps the
 * file small, and never depends on how the on-screen chart happens
 * to look at the moment of download (window size, hover state).
 * Returns the y position below the chart.
 */
function drawScoreChart(
  doc: jsPDF,
  products: Product[],
  average: number,
  x: number,
  y: number,
  width: number,
): number {
  const labelGutter = 110 // room for "BrandC DW-300" labels
  const valueGutter = 30 // room for the score at the bar end
  const plotX = x + labelGutter
  const plotW = width - labelGutter - valueGutter
  const barH = 14
  const gap = 12
  const topPad = 16 // room for the average label above the plot
  const sorted = [...products].sort((a, b) => b.score - a.score)
  const plotH = sorted.length * (barH + gap) - gap
  const baseY = y + topPad

  // Gridlines and ticks at 0 / 25 / 50 / 75 / 100
  doc.setLineWidth(0.5)
  doc.setFontSize(8)
  for (let tick = 0; tick <= 100; tick += 25) {
    const gx = plotX + (tick / 100) * plotW
    doc.setDrawColor(HAIRLINE)
    doc.line(gx, baseY, gx, baseY + plotH)
    doc.setTextColor(MUTED)
    doc.text(String(tick), gx, baseY + plotH + 12, { align: 'center' })
  }

  // Bars, name labels, and value labels
  sorted.forEach((p, i) => {
    const barY = baseY + i * (barH + gap)
    const barW = (p.score / 100) * plotW
    doc.setFontSize(9)
    doc.setTextColor(INK)
    doc.text(`${p.brand} ${p.model}`, plotX - 8, barY + barH / 2 + 3, { align: 'right' })
    doc.setFillColor(NAVY)
    doc.rect(plotX, barY, barW, barH, 'F')
    doc.setFont('helvetica', 'bold')
    doc.text(String(p.score), plotX + barW + 6, barY + barH / 2 + 3)
    doc.setFont('helvetica', 'normal')
  })

  // Dashed category-average line with its label on top
  const avgX = plotX + (average / 100) * plotW
  doc.setDrawColor(MUTED)
  doc.setLineWidth(0.75)
  doc.setLineDashPattern([2, 2], 0)
  doc.line(avgX, y + 8, avgX, baseY + plotH)
  doc.setLineDashPattern([], 0)
  doc.setFontSize(8)
  doc.setTextColor(MUTED)
  doc.text(`Category avg ${average}`, avgX, y + 4, { align: 'center' })

  return baseY + plotH + 26
}

/**
 * Draws the score vs time-to-result scatter as native PDF vectors.
 * Mirrors the app's Enterprise efficiency chart, including the same
 * padded 0.5-day axis rule. Returns the y position below the chart.
 */
function drawEfficiencyChart(
  doc: jsPDF,
  products: Product[],
  x: number,
  y: number,
  width: number,
): number {
  const labelGutter = 40 // room for the score labels on the left
  const plotX = x + labelGutter
  const plotW = width - labelGutter - 10
  const plotH = 120
  const topPad = 14 // room for point labels above the highest points
  const baseY = y + topPad

  // Same padded bounds rule as the app: snap to 0.5-day ticks
  const days = products.map((p) => p.ttr_days)
  const minX = Math.floor((Math.min(...days) - 0.1) * 2) / 2
  const maxX = Math.ceil((Math.max(...days) + 0.1) * 2) / 2
  const yMin = 50
  const yMax = 100
  const px = (d: number) => plotX + ((d - minX) / (maxX - minX)) * plotW
  const py = (s: number) => baseY + plotH - ((s - yMin) / (yMax - yMin)) * plotH

  doc.setLineWidth(0.5)
  doc.setFontSize(8)

  // Horizontal gridlines with score labels, every 10 points
  for (let s = yMin; s <= yMax; s += 10) {
    doc.setDrawColor(HAIRLINE)
    doc.line(plotX, py(s), plotX + plotW, py(s))
    doc.setTextColor(MUTED)
    doc.text(String(s), plotX - 6, py(s) + 2.5, { align: 'right' })
  }

  // Vertical gridlines with day labels, every 0.5 days
  const steps = Math.round((maxX - minX) * 2)
  for (let i = 0; i <= steps; i++) {
    const d = minX + i * 0.5
    doc.setDrawColor(HAIRLINE)
    doc.line(px(d), baseY, px(d), baseY + plotH)
    doc.setTextColor(MUTED)
    doc.text(d.toFixed(1), px(d), baseY + plotH + 10, { align: 'center' })
  }

  // Points with their labels
  products.forEach((p) => {
    doc.setFillColor(NAVY)
    doc.circle(px(p.ttr_days), py(p.score), 3.5, 'F')
    doc.setTextColor(INK)
    doc.text(`${p.brand} ${p.model}`, px(p.ttr_days), py(p.score) - 7, { align: 'center' })
  })

  // Axis title
  doc.setTextColor(MUTED)
  doc.text('Time to result (days)', plotX + plotW / 2, baseY + plotH + 24, { align: 'center' })

  return baseY + plotH + 36
}

/** Small bold section heading inside the report */
function sectionTitle(doc: jsPDF, text: string, x: number, y: number): void {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(INK)
  doc.text(text, x, y)
  doc.setFont('helvetica', 'normal')
}

/**
 * Builds and saves a PDF test report in the browser.
 * In production this would be a server endpoint instead: the server
 * would check the caller's plan first and return a short-lived
 * signed link (see README, Part B).
 */
export async function generateReport(opts: ReportOptions): Promise<void> {
  // compress keeps the document streams deflated
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 48
  let y = 56

  // Header
  doc.setTextColor(MUTED)
  doc.setFontSize(9)
  doc.text('CATEGORY TEST REPORT', margin, y)
  y += 20
  doc.setTextColor(INK)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text(opts.category, margin, y)
  y += 10
  doc.setDrawColor(ACCENT)
  doc.setLineWidth(2)
  doc.line(margin, y, pageWidth - margin, y)
  y += 18
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(MUTED)
  const generated = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  doc.text(`Generated ${generated} · Independent lab data`, margin, y)
  y += 24

  // Category stats block
  if (opts.stats) {
    doc.setTextColor(INK)
    doc.setFontSize(11)
    doc.text(
      [
        `Average score: ${opts.stats.avg_score} / 100`,
        `Models tested: ${opts.stats.total_tested}`,
        `Average time to result: ${opts.stats.avg_ttr_days} days`,
      ],
      margin,
      y,
    )
    y += 3 * 16 + 10
  }

  // Native vector charts (category reports only): the same two views
  // an Enterprise user sees in the app
  if (opts.withChart && opts.stats) {
    const chartWidth = pageWidth - margin * 2
    sectionTitle(doc, 'Performance by model', margin, y)
    y += 4
    y = drawScoreChart(doc, opts.products, opts.stats.avg_score, margin, y, chartWidth)
    sectionTitle(doc, 'Score vs time to result', margin, y)
    doc.setFontSize(8)
    doc.setTextColor(MUTED)
    doc.text('Top left is best: high score, fast turnaround', margin, y + 11)
    y += 14
    y = drawEfficiencyChart(doc, opts.products, margin, y, chartWidth)
  }

  // Product table, highest score first, same order as the chart and the app
  const rows = [...opts.products].sort((a, b) => b.score - a.score)
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: { font: 'helvetica', fontSize: 10, textColor: INK },
    headStyles: { fillColor: INK, textColor: '#ffffff', fontStyle: 'bold' },
    head: [['Brand', 'Model', 'Score', 'Verdict', 'Time to result', 'Report ref']],
    body: rows.map((p) => [
      p.brand,
      p.model,
      String(p.score),
      scoreBand(p.score).word,
      `${p.ttr_days} days`,
      p.download_id,
    ]),
  })

  // Footer note
  const table = doc as unknown as { lastAutoTable?: { finalY: number } }
  const afterTable = (table.lastAutoTable?.finalY ?? y) + 24
  doc.setFontSize(9)
  doc.setTextColor(MUTED)
  doc.text(
    `Showing top ${opts.products.length} of ${opts.totalTested} tested products.`,
    margin,
    afterTable,
  )

  doc.save(`${opts.fileName}.pdf`)
}
