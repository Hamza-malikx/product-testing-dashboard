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

const chartLabel = computed(
  () =>
    'Scatter chart of score against time to result. ' +
    props.products
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
  animationDuration: 400,
  grid: { left: 8, right: 24, top: 28, bottom: 44 },
  xAxis: {
    type: 'value',
    name: 'Time to result (days)',
    nameLocation: 'middle',
    nameGap: 30,
    nameTextStyle: { color: chartColors.muted, fontFamily: chartFonts.body, fontSize: 12 },
    min: xBounds.value.min,
    max: xBounds.value.max,
    interval: 0.5,
    axisLabel: { color: chartColors.muted, fontFamily: chartFonts.body, fontSize: 12 },
    splitLine: { lineStyle: { color: chartColors.hairline } },
  },
  yAxis: {
    type: 'value',
    name: 'Score',
    min: 50,
    max: 100,
    nameTextStyle: { color: chartColors.muted, fontFamily: chartFonts.body, fontSize: 12 },
    axisLabel: { color: chartColors.muted, fontFamily: chartFonts.body, fontSize: 12 },
    splitLine: { lineStyle: { color: chartColors.hairline } },
  },
  tooltip: {
    trigger: 'item',
    backgroundColor: chartColors.ink,
    borderWidth: 0,
    borderRadius: 6,
    padding: [10, 14],
    textStyle: { color: '#f4f6f8', fontFamily: chartFonts.body, fontSize: 13 },
    formatter: (params: { dataIndex: number }) => {
      const p = props.products[params.dataIndex]
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
      data: props.products.map((p) => [p.ttr_days, p.score]),
      symbolSize: 14,
      itemStyle: { color: chartColors.blue, borderColor: chartColors.paper, borderWidth: 2 },
      label: {
        show: true,
        position: 'top',
        formatter: (params: { dataIndex: number }) => {
          const p = props.products[params.dataIndex]
          return p ? `${p.brand} ${p.model}` : ''
        },
        color: chartColors.ink,
        fontFamily: chartFonts.body,
        fontSize: isNarrow.value ? 10 : 11,
      },
    },
  ],
}))
</script>

<template>
  <DashPanel title="Score vs time to result" note="Top left is best: high score, fast turnaround">
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
  height: 280px;
}
</style>
