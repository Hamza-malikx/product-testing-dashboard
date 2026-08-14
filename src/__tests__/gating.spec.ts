import { describe, expect, it } from 'vitest'
import { TIERS, TIER_PERMISSIONS } from '@/config/tiers'
import { parsePayload, PayloadError } from '@/data/parsePayload'
import rawPayload from '@/data/payload.json'
import { selectDataForTier } from '@/data/selectDataForTier'

describe('tier permissions', () => {
  it('basic sees aggregates only', () => {
    const basic = TIER_PERMISSIONS.basic
    expect(basic.has('view:aggregates')).toBe(true)
    expect(basic.has('view:charts')).toBe(false)
    expect(basic.has('view:products')).toBe(false)
    expect(basic.has('download:reports')).toBe(false)
  })

  it('premium sees charts and products but cannot download', () => {
    const premium = TIER_PERMISSIONS.premium
    expect(premium.has('view:charts')).toBe(true)
    expect(premium.has('view:products')).toBe(true)
    expect(premium.has('download:reports')).toBe(false)
  })

  it('enterprise can do everything', () => {
    const enterprise = TIER_PERMISSIONS.enterprise
    expect(enterprise.has('view:aggregates')).toBe(true)
    expect(enterprise.has('view:charts')).toBe(true)
    expect(enterprise.has('view:products')).toBe(true)
    expect(enterprise.has('download:reports')).toBe(true)
  })

  it('every tier has a permission set defined', () => {
    for (const tier of TIERS) {
      expect(TIER_PERMISSIONS[tier]).toBeDefined()
    }
  })
})

describe('selectDataForTier', () => {
  const payload = parsePayload(rawPayload)

  it('strips product rows for basic', () => {
    const view = selectDataForTier(payload, 'basic')
    expect(view.products).toBeNull()
    expect(view.aggregate_stats.avg_score).toBe(82.4)
  })

  it('keeps product rows for premium and enterprise', () => {
    expect(selectDataForTier(payload, 'premium').products).toHaveLength(3)
    expect(selectDataForTier(payload, 'enterprise').products).toHaveLength(3)
  })
})

describe('parsePayload', () => {
  it('accepts the real payload', () => {
    const parsed = parsePayload(rawPayload)
    expect(parsed.category).toBe('Dishwashers')
    expect(parsed.products).toHaveLength(3)
  })

  it('rejects an out-of-range score', () => {
    const bad = JSON.parse(JSON.stringify(rawPayload))
    bad.products[0].score = 250
    expect(() => parsePayload(bad)).toThrow(PayloadError)
  })

  it('rejects missing fields', () => {
    expect(() => parsePayload({ category: 'Dishwashers' })).toThrow(PayloadError)
    expect(() => parsePayload(null)).toThrow(PayloadError)
  })
})
