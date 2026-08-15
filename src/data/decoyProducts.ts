import type { Product } from '@/types/models'

// Fake placeholder rows for locked (blurred) chart previews.
// Locked plans must never receive real product data, not even
// blurred: a blur is easy to remove in browser dev tools.
// These values are made up, including the brand names.
// Scores deliberately straddle the real category average (82.4) so the
// blurred preview looks statistically plausible.
export const DECOY_PRODUCTS: Product[] = [
  { id: -1, brand: 'Sample', model: 'A-100', score: 88, ttr_days: 4.1, download_id: 'sample_001' },
  { id: -2, brand: 'Sample', model: 'B-200', score: 78, ttr_days: 4.8, download_id: 'sample_002' },
  { id: -3, brand: 'Sample', model: 'C-300', score: 69, ttr_days: 5.2, download_id: 'sample_003' },
]
