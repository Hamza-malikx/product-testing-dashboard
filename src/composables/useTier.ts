import { readonly, ref } from 'vue'
import { TIER_PERMISSIONS, type Capability, type Tier } from '@/config/tiers'

// One shared tier for the whole app, held in module scope.
// Deliberately not Pinia: one page, one piece of state.
// The moment this grows (real auth, multiple pages), a store earns its place.

const tier = ref<Tier>('basic')

export function useTier() {
  // The plan is exposed read-only, so setTier is the only way in.
  // One controlled seam is what a real session store would give us.
  function setTier(value: Tier) {
    tier.value = value
  }

  // Reactive when called inside a template or computed
  function can(capability: Capability): boolean {
    return TIER_PERMISSIONS[tier.value].has(capability)
  }

  return { tier: readonly(tier), setTier, can }
}
