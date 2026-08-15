import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { scoreBand } from '@/config/bands'
import type { AggregateStats, Product } from '@/types/models'

// Colors kept in sync with src/assets/main.css
const INK = '#1a1f24'
const MUTED = '#5c6670'
const RED = '#c8102e'

export interface ReportOptions {
  category: string
  products: Product[]
  totalTested: number
  /** category-level stats; omit for a single-product report */
  stats?: AggregateStats
  /** PNG data URL of the score chart; omit for a single-product report */
  chartImage?: string
  /** report file name without extension */
  fileName: string
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Builds and saves a PDF test report in the browser.
 * In production this would be a server endpoint instead: the server
 * would check the caller's plan first and return a short-lived
 * signed link (see README, Part B).
 */
export async function generateReport(opts: ReportOptions): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
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
  doc.setDrawColor(RED)
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

  // Chart image, scaled to keep its real shape
  if (opts.chartImage) {
    const img = await loadImage(opts.chartImage)
    const width = pageWidth - margin * 2
    const height = (img.naturalHeight / img.naturalWidth) * width
    doc.addImage(opts.chartImage, 'PNG', margin, y, width, height)
    y += height + 16
  }

  // Product table
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: { font: 'helvetica', fontSize: 10, textColor: INK },
    headStyles: { fillColor: INK, textColor: '#ffffff', fontStyle: 'bold' },
    head: [['Brand', 'Model', 'Score', 'Verdict', 'Time to result', 'Report ref']],
    body: opts.products.map((p) => [
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