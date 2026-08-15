<script setup lang="ts">
import { computed } from 'vue'
import { useTier } from '@/composables/useTier'
import type { Product } from '@/types/models'
import ScoreBadge from './ScoreBadge.vue'
import DashPanel from './DashPanel.vue'

const props = defineProps<{
  products: Product[]
  totalTested: number
}>()

const emit = defineEmits<{ download: [product: Product]; downloadCategory: [] }>()

const { can } = useTier()

// Highest score first, same order as the chart
const sorted = computed(() => [...props.products].sort((a, b) => b.score - a.score))
const bestId = computed(() => sorted.value[0]?.id)
</script>

<template>
  <DashPanel
    title="Tested models"
    :note="`Showing top ${products.length} of ${totalTested} tested products`"
  >
    <template #actions>
      <button
        v-if="can('download:reports')"
        type="button"
        class="primary-btn"
        @click="emit('downloadCategory')"
      >
        Download category report (PDF)
      </button>
    </template>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">Brand and model</th>
            <th scope="col">Score</th>
            <th scope="col">Time to result</th>
            <th scope="col">Report</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in sorted" :key="p.id">
            <th scope="row" class="name-cell">
              <span class="brand">{{ p.brand }}</span>
              <span class="model">{{ p.model }}</span>
              <span v-if="p.id === bestId" class="best-flag">Best in test</span>
            </th>
            <td><ScoreBadge :score="p.score" show-label /></td>
            <td class="tnum">{{ p.ttr_days }} days</td>
            <td>
              <!-- Enterprise: a real, working download button -->
              <button
                v-if="can('download:reports')"
                type="button"
                class="dl-btn"
                :aria-label="`Download report ${p.download_id} for ${p.brand} ${p.model}`"
                @click="emit('download', p)"
              >
                Download PDF
              </button>

              <!-- Premium: visible but locked, still reachable by keyboard,
                   with a tooltip that works on hover AND on focus -->
              <span v-else class="tip-wrap">
                <button
                  type="button"
                  class="dl-btn locked"
                  aria-disabled="true"
                  :aria-describedby="`dl-tip-${p.id}`"
                >
                  <svg
                    class="lock"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Download PDF
                </button>
                <span :id="`dl-tip-${p.id}`" role="tooltip" class="tip">
                  Full PDF test reports are available on the Enterprise plan.
                </span>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </DashPanel>
</template>

<style scoped>
.primary-btn {
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: var(--brand-red);
  border: none;
  border-radius: var(--radius);
  padding: 7px 14px;
  cursor: pointer;
}
.primary-btn:hover {
  background: #a90d27;
}
.table-scroll {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
thead th {
  text-align: left;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
  padding: 10px 12px;
  border-bottom: 2px solid var(--ink);
}
tbody th,
tbody td {
  text-align: left;
  padding: 12px;
  border-bottom: 1px solid var(--hairline);
  vertical-align: middle;
}
.name-cell {
  font-weight: 600;
}
.model {
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--muted);
  margin-left: 8px;
}
.best-flag {
  margin-left: 10px;
  border: 1px solid var(--ink);
  border-radius: var(--radius-badge);
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.dl-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  background: #fff;
  border: 1px solid var(--ink);
  border-radius: var(--radius);
  padding: 5px 12px;
  cursor: pointer;
}
.dl-btn:hover {
  background: var(--ink);
  color: #fff;
}
.dl-btn.locked {
  color: var(--muted);
  border-color: var(--hairline);
  cursor: not-allowed;
}
.dl-btn.locked:hover {
  background: #fff;
  color: var(--muted);
}
/* Tooltip: appears on mouse hover and on keyboard focus */
.tip-wrap {
  position: relative;
  display: inline-block;
}
.tip {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  z-index: 5;
  width: 210px;
  background: var(--ink);
  color: #f4f6f8;
  font-size: 12.5px;
  line-height: 1.4;
  padding: 8px 10px;
  border-radius: var(--radius);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s ease;
}
.tip-wrap:hover .tip,
.tip-wrap:focus-within .tip {
  opacity: 1;
  visibility: visible;
}
</style>
