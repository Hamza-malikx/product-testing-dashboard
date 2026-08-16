<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { scoreBand } from '@/config/bands'
import { chartColors, chartFonts, prefersReducedMotion } from '@/config/chartTheme'
import '@/config/echarts'
import { useMediaQuery } from '@/composables/useMediaQuery'
import type { Product } from '@/types/models'
import DashPanel from './DashPanel.vue'

const props = defineProps<{ products: Product[] }>()

const isNarrow = useMediaQuery('(max-width: 640px)')

// Ranked colors: the strongest performer gets the deepest teal
const RANK_COLORS = [chartColors.teal900, chartColors.teal500, chartColors.teal300]

const ranked = computed(() => [...props.products].sort((a, b) => b.score - a.score))

const chartLabel = computed(
  () =>
    'Scatter chart of score against time to result. ' +
    ranked.value
      .map((p) => `${p.brand} ${p.model}: score ${p.score}, ${p.ttr_days} days`)
      .join(', ') +
    '.',
)

// Pad the x axis past the data so no point sits on the edge with a
// clipped label, and snap the ends to the 0.5-day tick steps.
const xBounds = computed(() => {
  const days = props.products.map((p) => p.ttr_days)
  return {
    min: Math.floor((Math.min(...days) - 0.1) * 2) / 2,
    max: Math.ceil((Math.max(...days) + 0.1) * 2) / 2,
  }
})

const option = computed(() => ({
  animation: !prefersReducedMotion,
  animationDuration: 500,
  grid: { left: 46, right: 24, top: 30, bottom: 56 },
  xAxis: {
    type: 'value',
    name: 'Time to result (days)',
    nameLocation: 'middle',
    nameGap: 34,
    nameTextStyle: { color: chartColors.inkSoft, fontFamily: chartFonts.body, fontSize: 12.5 },
    min: xBounds.value.min,
    max: xBounds.value.max,
    interval: 0.5,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: chartColors.faint, fontFamily: chartFonts.mono, fontSize: 11.5 },
    splitLine: { lineStyle: { color: chartColors.lineSoft } },
  },
  yAxis: {
    type: 'value',
    min: 50,
    max: 100,
    interval: 10,
    axisLabel: { color: chartColors.faint, fontFamily: chartFonts.mono, fontSize: 11.5 },
    splitLine: { lineStyle: { color: chartColors.lineSoft } },
  },
  tooltip: {
    trigger: 'item',
    backgroundColor: chartColors.ink,
    borderWidth: 0,
    borderRadius: 8,
    padding: [10, 14],
    textStyle: { color: '#edefec', fontFamily: chartFonts.body, fontSize: 13 },
    formatter: (params: { dataIndex: number }) => {
      const p = ranked.value[params.dataIndex]
      if (!p) return ''
      return [
        `<strong>${p.brand} ${p.model}</strong>`,
        `Score ${p.score} · ${scoreBand(p.score).word}`,
        `Time to result ${p.ttr_days} days`,
      ].join('<br/>')
    },
  },
  series: [
    {
      type: 'scatter',
      cursor: 'default',
      data: ranked.value.map((p, i) => ({
        value: [p.ttr_days, p.score],
        itemStyle: { color: RANK_COLORS[i] ?? chartColors.teal300 },
      })),
      symbolSize: 18,
      label: {
        show: true,
        position: 'top',
        distance: 10,
        formatter: (params: { dataIndex: number }) => {
          const p = ranked.value[params.dataIndex]
          return p ? `${p.brand} ${p.model}` : ''
        },
        color: chartColors.ink,
        fontFamily: chartFonts.body,
        fontWeight: 600,
        fontSize: isNarrow.value ? 10 : 13,
      },
    },
  ],
}))
</script>

<template>
  <DashPanel title="Score vs. time to result" note="Each point is one tested model">
    <template #actions>
      <span class="legend-quadrant">Top left is best</span>
    </template>
    <VChart
      class="chart"
      :option="option"
      :update-options="{ notMerge: true }"
      autoresize
      role="img"
      :aria-label="chartLabel"
    />
  </DashPanel>
</template>

<style scoped>
.chart {
  height: 300px;
}
/* A quiet teal pill that names the winning corner of the plot */
.legend-quadrant {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--teal-100);
  color: var(--teal-700);
  font-size: 11.5px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
}
.legend-quadrant::before {
  content: '↖';
}
</style>
