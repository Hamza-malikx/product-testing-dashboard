import { TIER_PERMISSIONS, type Tier } from '@/config/tiers'
import type { AggregateStats, CategoryPayload, Product } from '@/types/models'

export interface TierView {
  category: string
  aggregate_stats: AggregateStats
  /** null when the plan is not allowed to see product-level rows */
  products: Product[] | null
}

/**
 * Returns only the data the given plan is allowed to see.
 * Locked components are never handed the real rows, so hiding is
 * not just visual. (The full payload still ships in the bundle
 * because the task requires client-side parsing. Real enforcement
 * is server-side. See README, Part B.)
 */
export function selectDataForTier(payload: CategoryPayload, tier: Tier): TierView {
  const canViewProducts = TIER_PERMISSIONS[tier].has('view:products')
  return {
    category: payload.category,
    aggregate_stats: payload.aggregate_stats,
    products: canViewProducts ? payload.products : null,
  }
}
