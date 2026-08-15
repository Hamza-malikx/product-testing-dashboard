<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { scoreBand } from '@/config/bands'
import { chartColors, chartFonts } from '@/config/chartTheme'
import '@/config/echarts'
import type { Product } from '@/types/models'

const props = defineProps<{ products: Product[] }>()

const option = computed(() => ({
  animationDuration: 400,
  grid: { left: 8, right: 24, top: 28, bottom: 44, containLabel: true },
  xAxis: {
    type: 'value',
    name: 'Time to result (days)',
    nameLocation: 'middle',
    nameGap: 30,
    nameTextStyle: { color: chartColors.muted, fontFamily: chartFonts.body, fontSize: 12 },
    scale: true,
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
    backgroundColor: chartColors.paper,
    borderColor: chartColors.hairline,
    padding: [10, 14],
    textStyle: { color: chartColors.ink, fontFamily: chartFonts.body, fontSize: 13 },
    formatter: (params: { dataIndex: number }) => {
      const p = props.products[params.dataIndex]
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
      data: props.products.map((p) => [p.ttr_days, p.score]),
      symbolSize: 14,
      itemStyle: { color: chartColors.blue, borderColor: chartColors.paper, borderWidth: 2 },
      label: {
        show: true,
        position: 'top',
        formatter: (params: { dataIndex: number }) => {
          const p = props.products[params.dataIndex]
          return `${p.brand} ${p.model}`
        },
        color: chartColors.ink,
        fontFamily: chartFonts.body,
        fontSize: 11,
      },
    },
  ],
}))
</script>

<template>
  <DashPanel title="Score vs time to result" note="Top left is best: high score, fast turnaround">
    <VChart class="chart" :option="option" autoresize />
  </DashPanel>
</template>

<style scoped>
.chart {
  height: 280px;
}
</style>
