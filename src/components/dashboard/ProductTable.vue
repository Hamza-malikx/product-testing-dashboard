<script setup lang="ts">
import { computed } from 'vue'
import { byScoreDesc } from '@/config/bands'
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
const sorted = computed(() => byScoreDesc(props.products))
const bestId = computed(() => sorted.value[0]?.id)
</script>

<template>
  <DashPanel
    title="Tested models"
    :note="`Showing top ${products.length} of ${totalTested} tested products`"
  >
    <template #actions>
      <!-- Enterprise: the active report action -->
      <button
        v-if="can('download:reports')"
        type="button"
        class="download-all"
        @click="emit('downloadCategory')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Download PDF Report
      </button>

      <!-- Premium: the same action, present but disabled, so the plan
           difference reads as locked versus unlocked rather than the
           control appearing out of nowhere on the higher plan -->
      <span v-else class="tip-wrap">
        <button
          type="button"
          class="download-all locked"
          aria-disabled="true"
          aria-describedby="dl-tip-category"
        >
          <svg
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
          Download PDF Report
        </button>
        <span id="dl-tip-category" role="tooltip" class="tip">
          Full PDF test reports are available on the Enterprise plan.
        </span>
      </span>
    </template>

    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col" class="microlabel">Brand and model</th>
            <th scope="col" class="microlabel">Score</th>
            <th scope="col" class="microlabel">Time to result</th>
            <th scope="col" class="microlabel report-col">Report</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in sorted" :key="p.id">
            <th scope="row" class="name-cell">
              <span class="model-name">{{ p.brand }}</span>
              <span class="model-code mono">{{ p.model }}</span>
              <span v-if="p.id === bestId" class="best-tag">★ Best in test</span>
            </th>
            <td><ScoreBadge :score="p.score" /></td>
            <td class="time-val mono tnum">{{ p.ttr_days }} days</td>
            <td class="report-col">
              <!-- Enterprise: a real, working download button -->
              <button
                v-if="can('download:reports')"
                type="button"
                class="pdf-btn"
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
                  class="pdf-btn locked"
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
.download-all {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--ink);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 13px;
  padding: 11px 18px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.download-all:hover {
  background: #000;
}
.download-all:active {
  transform: translateY(1px);
}
/* Locked variant: still visible and still focusable, so the tooltip
   can explain the gate, but it carries no click handler */
.download-all.locked {
  background: transparent;
  color: var(--ink-faint);
  border: 1px solid var(--line);
  cursor: not-allowed;
}
.download-all.locked:hover {
  background: transparent;
}
.download-all.locked:active {
  transform: none;
}

/* Scrolling clips the focus tooltips, so the table only becomes
   scrollable on narrow screens where it truly needs to. */
.table-scroll {
  overflow: visible;
}
@media (max-width: 720px) {
  .table-scroll {
    overflow-x: auto;
  }
}
table {
  width: 100%;
  border-collapse: collapse;
}
th {
  text-align: left;
  padding-bottom: 12px;
  border-bottom: 1.5px solid var(--ink);
}
td,
tbody th {
  text-align: left;
  padding: 18px 0;
  border-bottom: 1px solid var(--line-soft);
  font-size: 14.5px;
  vertical-align: middle;
  font-weight: 400;
}
/* The panel's own border closes the table; no floating last rule */
tbody tr:last-child td,
tbody tr:last-child th {
  border-bottom: none;
}
.report-col {
  text-align: right;
}
.model-name {
  font-weight: 700;
  font-size: 15px;
}
.model-code {
  color: var(--ink-soft);
  font-weight: 500;
  font-size: 13px;
  margin-left: 6px;
}
/* The one editorial award on the page, set like a paper seal */
.best-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: #fff7e0;
  color: #8a5a00;
  border: 1px solid #f0d68a;
  padding: 3px 8px;
  border-radius: 5px;
  margin-left: 10px;
  white-space: nowrap;
}
.time-val {
  color: var(--ink-soft);
}
.pdf-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 7px;
  color: var(--ink);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 12.5px;
  padding: 8px 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.pdf-btn:hover {
  border-color: var(--ink);
  background: var(--ink);
  color: #fff;
}
.pdf-btn:not(.locked):active {
  transform: translateY(1px);
}
.pdf-btn.locked {
  color: var(--ink-faint);
  cursor: not-allowed;
}
.pdf-btn.locked:hover {
  background: transparent;
  border-color: var(--line);
  color: var(--ink-faint);
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
  color: #edefec;
  font-size: 12.5px;
  font-weight: 400;
  line-height: 1.4;
  text-align: left;
  padding: 9px 12px;
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
