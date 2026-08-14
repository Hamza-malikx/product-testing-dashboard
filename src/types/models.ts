// Shapes of the data payload. Field names match the JSON exactly.
export interface AggregateStats {
  avg_score: number
  total_tested: number
  avg_ttr_days: number
}

export interface Product {
  id: number
  brand: string
  model: string
  score: number
  ttr_days: number
  download_id: string
}

export interface CategoryPayload {
  category: string
  aggregate_stats: AggregateStats
  products: Product[]
}
