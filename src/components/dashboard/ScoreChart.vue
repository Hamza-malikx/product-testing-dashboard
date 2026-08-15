<script setup lang="ts">
import { computed, ref } from 'vue'
import VChart from 'vue-echarts'
import { scoreBand } from '@/config/bands'
import { chartColors, chartFonts, prefersReducedMotion } from '@/config/chartTheme'
import '@/config/echarts'
import { useMediaQuery } from '@/composables/useMediaQuery'
import type { Product } from '@/types/models'
import DashPanel from './DashPanel.vue'

const props = defineProps<{
  products: Product[]
  categoryAverage: number
}>()

// Highest score first
const sorted = computed(() => [...props.products].sort((a, b) => b.score - a.score))

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
  animationDuration: 400,
  // Extra top room so the category-average label sits above the bars
  grid: { left: isNarrow.value ? 0 : 8, right: isNarrow.value ? 16 : 56, top: 30, bottom: 8, containLabel: true },
  xAxis: {
    type: 'value',
    max: 100,
    interval: 25, // ticks at 0 / 25 / 50 / 75 / 100
    axisLabel: { color: chartColors.muted, fontFamily: chartFonts.body, fontSize: 12 },
    splitLine: { lineStyle: { color: chartColors.hairline } },
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
      fontSize: 13,
    },
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
      label: isNarrow.value
        ? {
            // name and value printed inside the bar: '{b}' is the
            // category name, '{c}' is the value
            show: true,
            position: 'insideLeft',
            formatter: '{b}   {c}',
            color: '#fff',
            fontFamily: chartFonts.body,
            fontSize: 11,
            fontWeight: 600,
          }
        : {
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
          // Shorter text on phones so it cannot run off the right edge
          formatter: isNarrow.value ? `Avg ${props.categoryAverage}` : `Category avg ${props.categoryAverage}`,
          position: 'start', // horizontal text at the top of the line, above the bars
          distance: 6,
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
  <!-- The "3 of 15" caption lives on the table only, to avoid repeating it -->
  <DashPanel title="Performance by model">
    <!-- notMerge: each option update fully replaces the previous one,
         otherwise settings from the narrow layout stick after resizing -->
    <VChart
      ref="chartRef"
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
  height: 240px;
}
</style>
