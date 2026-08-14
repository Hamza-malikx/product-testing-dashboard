<script setup lang="ts">
import { computed } from 'vue'
import KpiRow from '@/components/dashboard/KpiRow.vue'
import TierSelect from '@/components/gating/TierSelect.vue'
import { useTier } from '@/composables/useTier'
import { TIER_LABELS } from '@/config/tiers'
import payloadJson from '@/data/payload.json'
import { parsePayload, PayloadError } from '@/data/parsePayload'
import { selectDataForTier } from '@/data/selectDataForTier'
import type { CategoryPayload } from '@/types/models'

const { tier } = useTier()

// Parse once at startup. The data is static here, but we still
// validate it like an API response and fail with a readable error.
let payload: CategoryPayload | null = null
let loadError = ''
try {
  payload = parsePayload(payloadJson)
} catch (error) {
  loadError = error instanceof PayloadError ? error.message : 'Could not load the test data.'
}

// Everything below only ever sees the data this plan is allowed to see
const view = computed(() => (payload ? selectDataForTier(payload, tier.value) : null))
</script>

<template>
  <TierSelect />

  <main v-if="view" class="page">
    <header class="masthead">
      <p class="eyebrow">Category report</p>
      <div class="title-row">
        <h1>{{ view.category }}</h1>
        <span class="plan-chip">{{ TIER_LABELS[tier] }} plan</span>
      </div>
      <p class="subtitle tnum">
        {{ view.aggregate_stats.total_tested }} models tested · independent lab data
      </p>
    </header>

    <KpiRow :stats="view.aggregate_stats" />
  </main>

  <main v-else class="page">
    <p class="load-error" role="alert">{{ loadError }}</p>
  </main>

  <!-- Announces plan changes to screen readers -->
  <p class="sr-only" aria-live="polite">Now viewing as {{ TIER_LABELS[tier] }} plan</p>
</template>

<style scoped>
.page {
  max-width: 1140px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}
.masthead {
  border-bottom: 3px solid var(--brand-red);
  padding-bottom: 20px;
  margin-bottom: 28px;
}
.eyebrow {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}
.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
h1 {
  font-size: 34px;
  font-weight: 800;
}
.plan-chip {
  border: 1px solid var(--brand-red);
  color: var(--brand-red);
  border-radius: var(--radius);
  padding: 3px 10px;
  font-size: 13px;
  font-weight: 600;
}
.subtitle {
  margin: 6px 0 0;
  color: var(--muted);
}
.load-error {
  color: var(--band-poor);
}
</style>
