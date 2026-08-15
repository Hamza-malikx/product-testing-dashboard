import type { Product } from '@/types/models'

// Fake placeholder rows for locked (blurred) chart previews.
// Locked plans must never receive real product data, not even
// blurred: a blur is easy to remove in browser dev tools.
// These values are made up, including the brand names.
export const DECOY_PRODUCTS: Product[] = [
  { id: -1, brand: 'Sample', model: 'A-100', score: 81, ttr_days: 4.1, download_id: 'sample_001' },
  { id: -2, brand: 'Sample', model: 'B-200', score: 74, ttr_days: 4.8, download_id: 'sample_002' },
  { id: -3, brand: 'Sample', model: 'C-300', score: 68, ttr_days: 5.2, download_id: 'sample_003' },
]
