<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { byScoreDesc, scoreBand } from '@/config/bands'
import { barGradient, chartColors, chartFonts, prefersReducedMotion } from '@/config/chartTheme'
import '@/config/echarts'
import { useMediaQuery } from '@/composables/useMediaQuery'
import type { Product } from '@/types/models'
import DashPanel from './DashPanel.vue'

const props = defineProps<{
  products: Product[]
  categoryAverage: number
}>()

// Highest score first
const sorted = computed(() => byScoreDesc(props.products))

// On narrow screens the long model names move from the axis into the
// bars, so the bars can use the full card width.
const isNarrow = useMediaQuery('(max-width: 640px)')

// The table below the chart is the full accessible alternative;
// this label gives screen readers the chart's own summary.
const chartLabel = computed(
  () =>
    'Bar chart of product scores. ' +
    sorted.value.map((p) => `${p.brand} ${p.model}: ${p.score}`).join(', ') +
    `. Category average ${props.categoryAverage}.`,
)

const option = computed(() => ({
  animation: !prefersReducedMotion,
  animationDuration: 500,
  grid: {
    left: isNarrow.value ? 0 : 4,
    right: 4,
    top: 24, // room for the average label above the plot
    bottom: 4,
  },
  xAxis: {
    type: 'value',
    max: 100,
    interval: 25, // ticks at 0 / 25 / 50 / 75 / 100
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: false }, // the reference keeps the plot clean
    axisLabel: { color: chartColors.faint, fontFamily: chartFonts.mono, fontSize: 11 },
  },
  yAxis: {
    type: 'category',
    inverse: true, // first item (best score) at the top
    data: sorted.value.map((p) => `${p.brand} ${p.model}`),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      show: !isNarrow.value,
      color: chartColors.ink,
      fontFamily: chartFonts.body,
      fontWeight: 600,
      fontSize: 13,
      margin: 16,
    },
  },
  tooltip: {
    trigger: 'item',
    backgroundColor: chartColors.ink,
    borderWidth: 0,
    borderRadius: 8,
    padding: [10, 14],
    textStyle: { color: '#edefec', fontFamily: chartFonts.body, fontSize: 13 },
    formatter: (params: { dataIndex: number }) => {
      const p = sorted.value[params.dataIndex]
      if (!p) return ''
      const delta = p.score - props.categoryAverage
      const sign = delta >= 0 ? '+' : ''
      return [
        `<strong>${p.brand} ${p.model}</strong>`,
        `Score ${p.score} · ${scoreBand(p.score).word}`,
        `Time to result ${p.ttr_days} days`,
        `${sign}${delta.toFixed(1)} vs category average`,
      ].join('<br/>')
    },
  },
  series: [
    {
      type: 'bar',
      cursor: 'default', // bars are not clickable, so no pointer cursor
      data: sorted.value.map((p, i) => ({
        value: p.score,
        // The leader gets the deepest gradient, so rank reads at a glance
        itemStyle: { color: barGradient(i === 0), borderRadius: 6 },
      })),
      barWidth: 34,
      // The value sits inside the bar, at its end, like the reference
      label: {
        show: true,
        position: 'insideRight',
        formatter: isNarrow.value ? '{b}   {c}' : '{c}',
        color: '#fff',
        fontFamily: chartFonts.mono,
        fontWeight: 600,
        fontSize: isNarrow.value ? 11 : 13,
      },
      markLine: {
        symbol: 'none',
        lineStyle: { type: 'dashed', color: chartColors.faint, width: 2 },
        label: {
          formatter: `avg ${props.categoryAverage}`,
          position: 'start',
          distance: 8,
          color: chartColors.inkSoft,
          fontFamily: chartFonts.mono,
          fontSize: 10.5,
        },
        data: [{ xAxis: props.categoryAverage }],
      },
    },
  ],
}))
</script>

<template>
  <!-- The "3 of 15" caption lives on the table only, to avoid repeating it -->
  <DashPanel title="Performance by model" note="Composite score out of 100, higher is better">
    <!-- notMerge: each option update fully replaces the previous one,
         otherwise settings from the narrow layout stick after resizing -->
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
  height: 230px;
}
</style>
