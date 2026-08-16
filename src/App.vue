<script setup lang="ts">
import { computed, ref } from 'vue'
import { SCORE_BANDS } from '@/config/bands'
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

// Feedback toast for downloads
const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | undefined

function showToast(message: string) {
  toast.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2500)
}

// One path for both downloads: check the capability, say something,
// load the report code, build the file.
//
// The capability guard runs even though the buttons are already gated,
// because the UI must never be the only thing standing in the way. The
// PDF code is imported here rather than at the top of the file, so a
// plan that cannot download never fetches that chunk at all.
async function runReport(message: string, build: () => Promise<void>) {
  if (!can('download:reports')) return
  showToast(message)
  try {
    await build()
  } catch {
    // The chunk failed to load, or the document failed to build. Say so
    // rather than leaving the toast promising a file that never arrives.
    showToast('Could not build the report. Please try again.')
  }
}

async function downloadCategoryReport() {
  const data = view.value
  const products = data?.products
  if (!data || !products) return
  await runReport('Preparing category report...', async () => {
    const { generateReport } = await import('@/services/reportPdf')
    await generateReport({
      category: data.category,
      stats: data.aggregate_stats,
      products,
      totalTested: data.aggregate_stats.total_tested,
      withChart: true,
      fileName: `${data.category.toLowerCase()}-category-report`,
    })
  })
}

async function onRowDownload(product: Product) {
  const data = view.value
  if (!data) return
  await runReport(`Preparing ${product.download_id}...`, async () => {
    const { generateReport } = await import('@/services/reportPdf')
    await generateReport({
      category: data.category,
      products: [product],
      totalTested: data.aggregate_stats.total_tested,
      fileName: product.download_id,
    })
  })
}
</script>

<template>
  <TierSelect />

  <main v-if="view" class="page">
    <header class="hero">
      <div>
        <p class="eyebrow">Category report</p>
        <h1>{{ view.category }}</h1>
        <p class="hero-sub">
          <span class="mono tnum">{{ view.aggregate_stats.total_tested }}</span> models tested ·
          independent lab data
        </p>
      </div>
      <span class="plan-badge mono">{{ TIER_LABELS[tier] }} plan</span>
    </header>

    <!-- Keyed by plan: switching fades the old view out and the new one in.
         The explicit duration makes Vue use a timer, so a missed browser
         transition event can never leave the view stuck mid-switch -->
    <Transition name="tier-fade" mode="out-in" :duration="180">
      <div :key="tier">
        <KpiRow :stats="view.aggregate_stats" />

        <FeatureGate capability="view:charts">
          <ScoreChart
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
                action-label="Preview Enterprise"
                @action="setTier('enterprise')"
              />
            </template>
          </FeatureGate>
          <!-- The table sits inside the chart gate, so Basic never
               reaches it, and it also states its own capability so the
               requirement is visible here rather than inferred. One
               frosted panel covers the whole model-level area, which is
               why the table has no separate locked state. -->
          <ProductTable
            v-if="can('view:products') && view.products"
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
              :body="`Your plan includes category averages. Premium adds interactive score and time-to-result comparisons for all ${view.aggregate_stats.total_tested} tested models.`"
              action-label="Preview Premium"
              @action="setTier('premium')"
            />
          </template>
        </FeatureGate>

        <p v-if="!can('view:charts')" class="plans-strip">
          Premium adds model-level results · Enterprise adds the efficiency view and PDF test
          reports.
        </p>
      </div>
    </Transition>

    <!-- The report's closing key: constant on every plan, so it sits
         outside the fade. The band thresholds come from bands.ts -->
    <footer class="colophon">
      <div class="scale">
        <span class="microlabel">Rating scale</span>
        <span v-for="band in SCORE_BANDS" :key="band.css" class="scale-item">
          <span class="swatch" :class="band.css" aria-hidden="true"></span>{{ band.range }}
        </span>
      </div>
      <p class="colophon-note">Illustrative sample data · technical demonstration</p>
    </footer>
  </main>

  <main v-else class="page">
    <p class="load-error" role="alert">{{ loadError }}</p>
  </main>

  <!-- Announces plan changes to screen readers -->
  <p class="sr-only" aria-live="polite">Now viewing as {{ TIER_LABELS[tier] }} plan</p>
  <div v-if="toast" class="toast mono" role="status">{{ toast }}</div>
</template>

<style scoped>
.page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 44px 40px 80px;
}

/* HERO */
.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 24px;
  border-bottom: 2px solid var(--ink);
}
/* The short rule before the eyebrow is the page's one flourish */
.eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--teal-700);
}
.eyebrow::before {
  content: '';
  width: 16px;
  height: 2px;
  background: var(--teal-700);
}
h1 {
  font-size: 56px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
  margin: 0 0 10px;
}
.hero-sub {
  margin: 0;
  font-size: 15px;
  color: var(--ink-soft);
}
.hero-sub .mono {
  color: var(--ink);
  font-weight: 600;
}
.plan-badge {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 8px 14px;
  border: 1px solid var(--ink);
  border-radius: var(--radius-pill);
  white-space: nowrap;
}

.plans-strip {
  margin: 20px 0 0;
  text-align: center;
  font-size: 13px;
  color: var(--ink-soft);
}
.load-error {
  color: var(--red);
}

/* COLOPHON */
.colophon {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}
.scale {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}
.scale-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--ink-soft);
}
.swatch {
  width: 9px;
  height: 9px;
  border-radius: 3px;
}
.swatch.excellent {
  background: var(--teal-900);
}
.swatch.good {
  background: var(--teal-300);
}
.swatch.fair {
  background: var(--amber);
}
.swatch.poor {
  background: var(--red);
}
.colophon-note {
  margin: 0;
  font-size: 12px;
  font-style: italic;
  color: var(--ink-faint);
}

/* MOTION AND FEEDBACK */
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
  color: #edefec;
  font-size: 13px;
  padding: 10px 18px;
  border-radius: var(--radius);
  box-shadow: 0 8px 24px -8px rgba(16, 22, 26, 0.5);
}

@media (max-width: 760px) {
  .page {
    padding: 28px 18px 60px;
  }
  .hero {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }
  h1 {
    font-size: 38px;
  }
}
</style>
