import type { AggregateStats, CategoryPayload, Product } from '@/types/models'

/** Thrown when the payload does not match the expected shape. */
export class PayloadError extends Error {
  constructor(message: string) {
    super(`Invalid data payload: ${message}`)
    this.name = 'PayloadError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new PayloadError(`"${field}" must be a number`)
  }
  return value
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new PayloadError(`"${field}" must be a non-empty string`)
  }
  return value
}

function parseAggregateStats(value: unknown): AggregateStats {
  if (!isRecord(value)) throw new PayloadError('"aggregate_stats" must be an object')
  return {
    avg_score: requireNumber(value.avg_score, 'aggregate_stats.avg_score'),
    total_tested: requireNumber(value.total_tested, 'aggregate_stats.total_tested'),
    avg_ttr_days: requireNumber(value.avg_ttr_days, 'aggregate_stats.avg_ttr_days'),
  }
}

function parseProduct(value: unknown, index: number): Product {
  if (!isRecord(value)) throw new PayloadError(`products[${index}] must be an object`)
  const at = (field: string) => `products[${index}].${field}`
  const score = requireNumber(value.score, at('score'))
  if (score < 0 || score > 100) {
    throw new PayloadError(`${at('score')} must be between 0 and 100`)
  }
  return {
    id: requireNumber(value.id, at('id')),
    brand: requireString(value.brand, at('brand')),
    model: requireString(value.model, at('model')),
    score,
    ttr_days: requireNumber(value.ttr_days, at('ttr_days')),
    download_id: requireString(value.download_id, at('download_id')),
  }
}


/**
 * Validates unknown data and returns a typed payload.
 * In production this data would arrive from an API, so we
 * treat it as untrusted input instead of assuming the shape.
 */
export function parsePayload(value: unknown): CategoryPayload {
  if (!isRecord(value)) throw new PayloadError('payload must be an object')
  if (!Array.isArray(value.products)) throw new PayloadError('"products" must be an array')
  return {
    category: requireString(value.category, 'category'),
    aggregate_stats: parseAggregateStats(value.aggregate_stats),
    products: value.products.map(parseProduct),
  }
}