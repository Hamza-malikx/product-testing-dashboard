<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { scoreBand } from '@/config/bands'
import { chartColors, chartFonts } from '@/config/chartTheme'
import '@/config/echarts'
import type { Product } from '@/types/models'

const props = defineProps<{
  products: Product[]
  categoryAverage: number
  totalTested: number
}>()

// Highest score first
const sorted = computed(() => [...props.products].sort((a, b) => b.score - a.score))

const option = computed(() => ({
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
          color: chartColors.muted,
          fontFamily: chartFonts.body,
          fontSize: 11,
        },
        data: [{ xAxis: props.categoryAverage }],
      },
    },
  ],
}))
</script>

<template>
  <section class="panel" aria-label="Performance by model">
    <div class="panel-head">
      <h2>Performance by model</h2>
      <p class="note tnum">
        Showing top {{ products.length }} of {{ totalTested }} tested products
      </p>
    </div>
    <VChart class="chart" :option="option" autoresize />
  </section>
</template>

<style scoped>
.panel {
  border: 1px solid var(--hairline);
  border-radius: var(--radius);
  padding: 20px 24px;
  margin-top: 28px;
  background: #fff;
}
.panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
h2 {
  font-size: 18px;
  font-weight: 700;
}
.note {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}
.chart {
  height: 240px;
}
</style>
