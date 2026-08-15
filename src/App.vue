<script setup lang="ts">
import { computed, ref } from 'vue'
import KpiRow from '@/components/dashboard/KpiRow.vue'
import TierSelect from '@/components/gating/TierSelect.vue'
import { useTier } from '@/composables/useTier'
import { TIER_LABELS } from '@/config/tiers'
import payloadJson from '@/data/payload.json'
import { parsePayload, PayloadError } from '@/data/parsePayload'
import { selectDataForTier } from '@/data/selectDataForTier'
import type { CategoryPayload, Product } from '@/types/models'
import ScoreChart from '@/components/dashboard/ScoreChart.vue'
import ProductTable from '@/components/dashboard/ProductTable.vue'
import FeatureGate from '@/components/gating/FeatureGate.vue'
import UpgradePrompt from '@/components/gating/UpgradePrompt.vue'
import { DECOY_PRODUCTS } from '@/data/decoyProducts'
import EfficiencyChart from '@/components/dashboard/EfficiencyChart.vue'

const { tier, can, setTier } = useTier()

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

// Small feedback message when a download starts.
// The real PDF generation arrives in the report service step.
// Feedback toast for downloads
const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | undefined

function showToast(message: string) {
  toast.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2500)
}

// Reference to the real score chart, so the PDF can embed its image
const scoreChart = ref<InstanceType<typeof ScoreChart> | null>(null)

// The PDF code is loaded only here, on click. Locked plans never
// even download it (the gate extends to the code bundle itself).
async function downloadCategoryReport() {
  if (!view.value?.products) return
  showToast('Preparing category report...')
  const { generateReport } = await import('@/services/reportPdf')
  await generateReport({
    category: view.value.category,
    stats: view.value.aggregate_stats,
    products: view.value.products,
    totalTested: view.value.aggregate_stats.total_tested,
    chartImage: scoreChart.value?.getImage(),
    fileName: `${view.value.category.toLowerCase()}-category-report`,
  })
}

async function onRowDownload(product: Product) {
  if (!view.value) return
  showToast(`Preparing ${product.download_id}...`)
  const { generateReport } = await import('@/services/reportPdf')
  await generateReport({
    category: view.value.category,
    products: [product],
    totalTested: view.value.aggregate_stats.total_tested,
    fileName: product.download_id,
  })
}
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

    <!-- Keyed by plan: switching fades the old view out and the new one in.
         The explicit duration makes Vue use a timer, so a missed browser
         transition event can never leave the view stuck mid-switch -->
    <Transition name="tier-fade" mode="out-in" :duration="180">
    <div :key="tier">
    <KpiRow :stats="view.aggregate_stats" />
    <FeatureGate capability="view:charts">
      <ScoreChart
        ref="scoreChart"
        v-if="view.products"
        :products="view.products"
        :category-average="view.aggregate_stats.avg_score"
      />
      <FeatureGate capability="view:advanced-charts">
        <EfficiencyChart v-if="view.products" :products="view.products" />

        <template #locked>
          <EfficiencyChart :products="DECOY_PRODUCTS" />
        </template>

        <template #prompt>
          <UpgradePrompt
            title="The efficiency view is on Enterprise"
            body="See which brands deliver high scores fast. Enterprise adds the score versus time-to-result view and full PDF test reports."
            @action="setTier('enterprise')"
          />
        </template>
      </FeatureGate>
      <ProductTable
        v-if="view.products"
        :products="view.products"
        :total-tested="view.aggregate_stats.total_tested"
        @download="onRowDownload"
        @download-category="downloadCategoryReport"
      />

      <template #locked>
        <ScoreChart
          :products="DECOY_PRODUCTS"
          :category-average="view.aggregate_stats.avg_score"
        />
      </template>

      <template #prompt>
        <UpgradePrompt
          title="Model-level results are on Premium"
          body="Your plan includes category averages. Premium adds interactive score and time-to-result comparisons for all 15 tested models."
          @action="setTier('premium')"
        />
      </template>
    </FeatureGate>

    <p v-if="!can('view:charts')" class="plans-strip">
      Premium adds model-level results · Enterprise adds the efficiency view and PDF test reports.
    </p>
    </div>
    </Transition>
  </main>

  <main v-else class="page">
    <p class="load-error" role="alert">{{ loadError }}</p>
  </main>

  <!-- Announces plan changes to screen readers -->
  <p class="sr-only" aria-live="polite">Now viewing as {{ TIER_LABELS[tier] }} plan</p>
  <div v-if="toast" class="toast tnum" role="status">{{ toast }}</div>
</template>

<style scoped>
.page {
  max-width: 1140px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}
.masthead {
  border-bottom: 3px solid var(--accent);
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
  border: 1px solid var(--accent);
  color: var(--accent);
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
.plans-strip {
  margin: 12px 0 0;
  text-align: center;
  font-size: 13px;
  color: var(--muted);
}
.tier-fade-enter-active,
.tier-fade-leave-active {
  transition: opacity 0.18s ease;
}
.tier-fade-enter-from,
.tier-fade-leave-to {
  opacity: 0;
}
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--ink);
  color: #f4f6f8;
  font-size: 13px;
  padding: 9px 16px;
  border-radius: var(--radius);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
}
</style>
