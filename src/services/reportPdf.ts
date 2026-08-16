import { jsPDF } from 'jspdf'
import autoTable, { type CellHookData } from 'jspdf-autotable'
import { scoreBand } from '@/config/bands'
import type { AggregateStats, Product } from '@/types/models'

// Colors kept in sync with src/assets/main.css
const INK = '#10161a'
const MUTED = '#5b6b70'
const ACCENT = '#0b5d50'
const CHART_TEAL = '#0e7c6b' // chart bars
const HAIRLINE = '#e2e6e2'
const PAPER_WHITE = '#ffffff'

// Verdict band colors, same as the app's chips
const BAND_COLORS: Record<'excellent' | 'good' | 'fair' | 'poor', { bg: string; fg: string }> = {
  excellent: { bg: '#0b5d50', fg: PAPER_WHITE },
  good: { bg: '#def0ea', fg: '#0b5d50' },
  fair: { bg: '#fbedd3', fg: '#7a5308' },
  poor: { bg: '#f8e2dd', fg: '#7c2a1d' },
}

export interface ReportOptions {
  category: string
  products: Product[]
  totalTested: number
  /** category-level stats; omit for a single-product report */
  stats?: AggregateStats
  /** draw the two charts (category reports only, needs stats) */
  withChart?: boolean
  /** report file name without extension */
  fileName: string
}

/**
 * The same score chip as the app's ScoreBadge. 'number' puts the score
 * in the chip with the band word beside it (table rows); 'word' puts
 * the band word in the chip (the KPI strip), so the number is never
 * printed twice next to itself.
 */
function drawScoreChip(
  doc: jsPDF,
  score: number,
  x: number,
  yCenter: number,
  variant: 'number' | 'word' = 'number',
): void {
  const band = scoreBand(score)
  const c = BAND_COLORS[band.css]
  const chipText = variant === 'word' ? band.word : String(score)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  const textW = doc.getTextWidth(chipText)
  const chipW = textW + 10
  const chipH = 12
  doc.setFillColor(c.bg)
  doc.roundedRect(x, yCenter - chipH / 2, chipW, chipH, 2, 2, 'F')
  doc.setTextColor(c.fg)
  doc.text(chipText, x + 5, yCenter + 2.8)
  doc.setFont('helvetica', 'normal')
  if (variant === 'number') {
    doc.setTextColor(MUTED)
    doc.text(band.word, x + chipW + 5, yCenter + 2.8)
  }
}

/** The app's KPI strip: three cells, hero average score, hairline dividers */
function drawKpiStrip(
  doc: jsPDF,
  stats: AggregateStats,
  x: number,
  y: number,
  width: number,
): number {
  const col1 = 0.4 * width
  const col2 = 0.3 * width
  const stripH = 52

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(MUTED)
  doc.text('AVERAGE SCORE', x, y + 10, { charSpace: 0.5 })
  doc.text('MODELS TESTED', x + col1, y + 10, { charSpace: 0.5 })
  doc.text('AVERAGE TIME TO RESULT', x + col1 + col2, y + 10, { charSpace: 0.5 })

  // Hero cell: big score, muted unit, verdict chip
  doc.setFontSize(24)
  doc.setTextColor(INK)
  doc.text(String(stats.avg_score), x, y + 36)
  const scoreW = doc.getTextWidth(String(stats.avg_score))
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(MUTED)
  doc.text('/100', x + scoreW + 3, y + 36)
  const unitW = doc.getTextWidth('/100')
  drawScoreChip(doc, stats.avg_score, x + scoreW + unitW + 12, y + 32, 'word')

  // Supporting cells
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(INK)
  doc.text(String(stats.total_tested), x + col1, y + 36)
  doc.text(String(stats.avg_ttr_days), x + col1 + col2, y + 36)
  const ttrW = doc.getTextWidth(String(stats.avg_ttr_days))
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(MUTED)
  doc.text('days', x + col1 + col2 + ttrW + 3, y + 36)

  // Hairline dividers between cells, closing rule below
  doc.setDrawColor(HAIRLINE)
  doc.setLineWidth(0.5)
  doc.line(x + col1 - 14, y + 2, x + col1 - 14, y + stripH - 10)
  doc.line(x + col1 + col2 - 14, y + 2, x + col1 + col2 - 14, y + stripH - 10)
  doc.line(x, y + stripH, x + width, y + stripH)

  return y + stripH + 16
}

/** A DashPanel look-alike: hairline rounded frame with title and optional note */
function panelFrame(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  note?: string,
): number {
  doc.setDrawColor(HAIRLINE)
  doc.setLineWidth(0.75)
  doc.roundedRect(x, y, w, h, 4, 4, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(INK)
  doc.text(title, x + 14, y + 19)
  if (note) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(MUTED)
    doc.text(note, x + w - 14, y + 19, { align: 'right' })
  }
  doc.setFont('helvetica', 'normal')
  return y + 28
}

/** Ranked horizontal bars with the dashed category-average line, as vectors */
function drawScoreChart(
  doc: jsPDF,
  products: Product[],
  average: number,
  x: number,
  y: number,
  width: number,
): number {
  const labelGutter = 105
  const valueGutter = 28
  const plotX = x + labelGutter
  const plotW = width - labelGutter - valueGutter
  const barH = 13
  const gap = 11
  const topPad = 15 // room for the average label above the plot
  const sorted = [...products].sort((a, b) => b.score - a.score)
  const plotH = sorted.length * (barH + gap) - gap
  const baseY = y + topPad

  doc.setLineWidth(0.5)
  doc.setFontSize(7.5)
  for (let tick = 0; tick <= 100; tick += 25) {
    const gx = plotX + (tick / 100) * plotW
    doc.setDrawColor(HAIRLINE)
    doc.line(gx, baseY, gx, baseY + plotH)
    doc.setTextColor(MUTED)
    doc.text(String(tick), gx, baseY + plotH + 11, { align: 'center' })
  }

  sorted.forEach((p, i) => {
    const barY = baseY + i * (barH + gap)
    const barW = (p.score / 100) * plotW
    doc.setFontSize(8.5)
    doc.setTextColor(INK)
    doc.text(`${p.brand} ${p.model}`, plotX - 8, barY + barH / 2 + 3, { align: 'right' })
    doc.setFillColor(CHART_TEAL)
    doc.rect(plotX, barY, barW, barH, 'F')
    doc.setFont('helvetica', 'bold')
    doc.text(String(p.score), plotX + barW + 5, barY + barH / 2 + 3)
    doc.setFont('helvetica', 'normal')
  })

  const avgX = plotX + (average / 100) * plotW
  doc.setDrawColor(MUTED)
  doc.setLineWidth(0.75)
  doc.setLineDashPattern([2, 2], 0)
  doc.line(avgX, y + 7, avgX, baseY + plotH)
  doc.setLineDashPattern([], 0)
  doc.setFontSize(7.5)
  doc.setTextColor(MUTED)
  doc.text(`Category avg ${average}`, avgX, y + 3, { align: 'center' })

  return baseY + plotH + 20
}

/** Score vs time-to-result scatter, same padded half-day axis rule as the app */
function drawEfficiencyChart(
  doc: jsPDF,
  products: Product[],
  x: number,
  y: number,
  width: number,
): number {
  const labelGutter = 38
  const plotX = x + labelGutter
  const plotW = width - labelGutter - 10
  const plotH = 110
  const topPad = 13
  const baseY = y + topPad

  const days = products.map((p) => p.ttr_days)
  const minX = Math.floor((Math.min(...days) - 0.1) * 2) / 2
  const maxX = Math.ceil((Math.max(...days) + 0.1) * 2) / 2
  const yMin = 50
  const yMax = 100
  const px = (d: number) => plotX + ((d - minX) / (maxX - minX)) * plotW
  const py = (s: number) => baseY + plotH - ((s - yMin) / (yMax - yMin)) * plotH

  doc.setLineWidth(0.5)
  doc.setFontSize(7.5)
  for (let s = yMin; s <= yMax; s += 10) {
    doc.setDrawColor(HAIRLINE)
    doc.line(plotX, py(s), plotX + plotW, py(s))
    doc.setTextColor(MUTED)
    doc.text(String(s), plotX - 6, py(s) + 2.5, { align: 'right' })
  }
  const steps = Math.round((maxX - minX) * 2)
  for (let i = 0; i <= steps; i++) {
    const d = minX + i * 0.5
    doc.setDrawColor(HAIRLINE)
    doc.line(px(d), baseY, px(d), baseY + plotH)
    doc.setTextColor(MUTED)
    doc.text(d.toFixed(1), px(d), baseY + plotH + 10, { align: 'center' })
  }

  products.forEach((p) => {
    doc.setFillColor(CHART_TEAL)
    doc.circle(px(p.ttr_days), py(p.score), 3.5, 'F')
    doc.setTextColor(INK)
    doc.text(`${p.brand} ${p.model}`, px(p.ttr_days), py(p.score) - 7, { align: 'center' })
  })

  doc.setTextColor(MUTED)
  doc.text('Time to result (days)', plotX + plotW / 2, baseY + plotH + 22, { align: 'center' })

  return baseY + plotH + 30
}

/** The app's colophon: rating-scale key with swatches, demo note underneath */
function drawColophon(doc: jsPDF, pageWidth: number, pageHeight: number, margin: number): void {
  const y = pageHeight - 46
  doc.setDrawColor(HAIRLINE)
  doc.setLineWidth(0.5)
  doc.line(margin, y - 13, pageWidth - margin, y - 13)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(MUTED)
  doc.text('RATING SCALE', margin, y, { charSpace: 0.5 })
  doc.setFont('helvetica', 'normal')

  const items: Array<[string, string]> = [
    [BAND_COLORS.excellent.bg, 'Excellent 85-100'],
    [BAND_COLORS.good.bg, 'Good 70-84'],
    [BAND_COLORS.fair.bg, 'Fair 55-69'],
    [BAND_COLORS.poor.bg, 'Poor below 55'],
  ]
  let ix = margin + 68
  items.forEach(([color, label]) => {
    doc.setFillColor(color)
    // plain squares: tiny rounded rects can misrender in some viewers
    doc.rect(ix, y - 5.5, 6, 6, 'F')
    doc.setTextColor(MUTED)
    doc.text(label, ix + 9, y)
    ix += 9 + doc.getTextWidth(label) + 14
  })
  doc.text('Illustrative sample data · technical demonstration', margin, y + 13)
}

/**
 * Builds and saves a PDF test report in the browser, styled to match
 * the app's design system. Everything is drawn as native vectors:
 * crisp at any zoom, small files, no dependence on screen state.
 * In production this would be a server endpoint instead: the server
 * would check the caller's plan first and return a short-lived
 * signed link (see README, Part B).
 */
export async function generateReport(opts: ReportOptions): Promise<void> {
  // compress keeps the document streams deflated
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 48
  const contentW = pageWidth - margin * 2
  let y = 54

  // A single-product report is titled after that model, not the
  // category, so the document never claims to be more than it is
  const single = !opts.stats && opts.products.length === 1 ? opts.products[0] : undefined

  // Masthead: eyebrow, title, accent rule, meta line
  doc.setTextColor(MUTED)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(single ? 'MODEL TEST REPORT' : 'CATEGORY TEST REPORT', margin, y, { charSpace: 1 })
  y += 24
  doc.setTextColor(INK)
  doc.setFontSize(26)
  doc.text(single ? `${single.brand} ${single.model}` : opts.category, margin, y)
  y += 10
  doc.setDrawColor(ACCENT)
  doc.setLineWidth(2.2)
  doc.line(margin, y, pageWidth - margin, y)
  y += 16
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(MUTED)
  const generated = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  doc.text(
    single
      ? `${opts.category} · Report ${single.download_id} · Generated ${generated}`
      : `Generated ${generated} · Independent lab data`,
    margin,
    y,
  )
  y += 20

  // KPI strip (category reports)
  if (opts.stats) {
    y = drawKpiStrip(doc, opts.stats, margin, y, contentW)
  }

  // The two chart panels, same views an Enterprise user sees in the app
  if (opts.withChart && opts.stats) {
    const barPanelH = 28 + 15 + (opts.products.length * 24 - 11) + 20 + 6
    let contentY = panelFrame(doc, margin, y, contentW, barPanelH, 'Performance by model')
    drawScoreChart(
      doc,
      opts.products,
      opts.stats.avg_score,
      margin + 14,
      contentY - 6,
      contentW - 28,
    )
    y += barPanelH + 14

    const scatterPanelH = 28 + 13 + 110 + 30 + 8
    contentY = panelFrame(
      doc,
      margin,
      y,
      contentW,
      scatterPanelH,
      'Score vs time to result',
      'Top left is best: high score, fast turnaround',
    )
    drawEfficiencyChart(doc, opts.products, margin + 14, contentY - 4, contentW - 28)
    y += scatterPanelH + 16
  }

  // Product table, highest score first, styled like the app's table
  const rows = [...opts.products].sort((a, b) => b.score - a.score)
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      textColor: INK,
      cellPadding: { top: 7, bottom: 7, left: 4, right: 4 },
      lineColor: HAIRLINE,
      lineWidth: { bottom: 0.5 },
      valign: 'middle',
    },
    headStyles: {
      fontSize: 7.5,
      fontStyle: 'bold',
      textColor: MUTED,
      lineColor: INK,
      lineWidth: { bottom: 1.2 },
    },
    columnStyles: {
      0: { cellWidth: 65, fontStyle: 'bold' },
      1: { cellWidth: 105, font: 'courier', fontSize: 8.5, textColor: MUTED },
      2: { cellWidth: 110 },
      3: { cellWidth: 95 },
      4: { cellWidth: 95, font: 'courier', fontSize: 8.5, textColor: MUTED },
    },
    head: [['BRAND', 'MODEL', 'SCORE', 'TIME TO RESULT', 'REPORT REF']],
    body: rows.map((p) => [p.brand, p.model, String(p.score), `${p.ttr_days} days`, p.download_id]),
    didParseCell: (data: CellHookData) => {
      // The score cell is drawn by hand as a chip, so clear its text
      if (data.section === 'body' && data.column.index === 2) {
        data.cell.text = ['']
      }
    },
    didDrawCell: (data: CellHookData) => {
      if (data.section !== 'body') return
      const p = rows[data.row.index]
      if (!p) return
      if (data.column.index === 2) {
        drawScoreChip(doc, p.score, data.cell.x + 4, data.cell.y + data.cell.height / 2)
      }
      // "Best in test" stamp on the top-ranked row, category reports only
      if (data.column.index === 1 && data.row.index === 0 && opts.withChart) {
        doc.setFont('courier', 'normal')
        doc.setFontSize(8.5)
        const modelW = doc.getTextWidth(p.model)
        const stampX = data.cell.x + 4 + modelW + 8
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(5.5)
        const stampTextW = doc.getTextWidth('BEST IN TEST') + 2.5
        const stampY = data.cell.y + data.cell.height / 2 - 5
        doc.setDrawColor(INK)
        doc.setLineWidth(0.5)
        doc.roundedRect(stampX, stampY, stampTextW + 8, 10, 2, 2, 'S')
        doc.setTextColor(INK)
        doc.text('BEST IN TEST', stampX + 4, stampY + 7, { charSpace: 0.3 })
        doc.setFont('helvetica', 'normal')
      }
    },
  })

  // Footer note under the table
  const table = doc as unknown as { lastAutoTable?: { finalY: number } }
  const afterTable = (table.lastAutoTable?.finalY ?? y) + 20
  doc.setFontSize(8.5)
  doc.setTextColor(MUTED)
  doc.text(
    single
      ? `One model from ${opts.totalTested} tested in this category.`
      : `Showing top ${opts.products.length} of ${opts.totalTested} tested products.`,
    margin,
    afterTable,
  )

  // Rating-scale colophon pinned to the page foot, like the app
  drawColophon(doc, pageWidth, pageHeight, margin)

  doc.save(`${opts.fileName}.pdf`)
}
