<script setup lang="ts">
import { computed, ref } from 'vue'
import VChart from 'vue-echarts'
import { scoreBand } from '@/config/bands'
import { chartColors, chartFonts, prefersReducedMotion } from '@/config/chartTheme'
import '@/config/echarts'
import type { Product } from '@/types/models'
import DashPanel from './DashPanel.vue'

const props = defineProps<{
  products: Product[]
  categoryAverage: number
  totalTested: number
}>()

// Highest score first
const sorted = computed(() => [...props.products].sort((a, b) => b.score - a.score))

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
  animationDuration: 400,
  grid: { left: 8, right: 56, top: 8, bottom: 8, containLabel: true },
  xAxis: {
    type: 'value',
    max: 100,
    splitNumber: 4,
    axisLabel: { color: chartColors.muted, fontFamily: chartFonts.body, fontSize: 12 },
    splitLine: { lineStyle: { color: chartColors.hairline } },
  },
  yAxis: {
    type: 'category',
    inverse: true, // first item (best score) at the top
    data: sorted.value.map((p) => `${p.brand} ${p.model}`),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: chartColors.ink, fontFamily: chartFonts.body, fontSize: 13 },
  },
  tooltip: {
    trigger: 'item',
    backgroundColor: chartColors.paper,
    borderColor: chartColors.hairline,
    padding: [10, 14],
    textStyle: { color: chartColors.ink, fontFamily: chartFonts.body, fontSize: 13 },
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
      data: sorted.value.map((p) => p.score),
      barWidth: 28,
      itemStyle: { color: chartColors.blue, borderRadius: [0, 4, 4, 0] },
      emphasis: { itemStyle: { color: chartColors.blueHover } },
      label: {
        show: true,
        position: 'right',
        color: chartColors.ink,
        fontFamily: chartFonts.body,
        fontWeight: 600,
      },
      markLine: {
        symbol: 'none',
        lineStyle: { type: 'dashed', color: chartColors.muted, width: 1 },
        label: {
          formatter: `Category avg ${props.categoryAverage}`,
          position: 'insideEndTop', // keeps it off the axis numbers
          color: chartColors.muted,
          fontFamily: chartFonts.body,
          fontSize: 11,
        },
        data: [{ xAxis: props.categoryAverage }],
      },
    },
  ],
}))
const chartRef = ref<InstanceType<typeof VChart> | null>(null)

// Lets App.vue pull a PNG of the chart for the PDF report.
// This needs the canvas renderer: SVG cannot export this way.
function getImage(): string | undefined {
  return chartRef.value?.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' })
}

defineExpose({ getImage })
</script>

<template>
  <DashPanel
    title="Performance by model"
    :note="`Showing top ${products.length} of ${totalTested} tested products`"
  >
    <VChart ref="chartRef" class="chart" :option="option" autoresize role="img" :aria-label="chartLabel" />
  </DashPanel>
</template>

<style scoped>
.chart {
  height: 240px;
}
</style>
