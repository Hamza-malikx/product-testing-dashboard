// The single source of truth for what each plan can do.
// Components never check the plan name. They ask for a
// capability, like can('download:reports'). Moving a feature
// between plans means editing this file only. This mirrors how
// a server-side policy table would work (see README, Part B).

export const TIERS = ['basic', 'premium', 'enterprise'] as const
export type Tier = (typeof TIERS)[number]

export type Capability =
  | 'view:aggregates' // the stats row
  | 'view:charts' // interactive charts
  | 'view:products' // product-level rows (table and chart data)
  | 'download:reports' // the PDF report

export const TIER_PERMISSIONS: Record<Tier, ReadonlySet<Capability>> = {
  basic: new Set<Capability>(['view:aggregates']),
  premium: new Set<Capability>(['view:aggregates', 'view:charts', 'view:products']),
  enterprise: new Set<Capability>([
    'view:aggregates',
    'view:charts',
    'view:products',
    'download:reports',
  ]),
}

// Labels for the dropdown
export const TIER_LABELS: Record<Tier, string> = {
  basic: 'Basic',
  premium: 'Premium',
  enterprise: 'Enterprise',
}
