<script setup lang="ts">
import type { AggregateStats } from '@/types/models'
import ScoreBadge from './ScoreBadge.vue'

defineProps<{ stats: AggregateStats }>()
</script>

<template>
  <section class="kpis" aria-label="Category summary">
    <div class="cell">
      <p class="label">Average score</p>
      <p class="value tnum">
        {{ stats.avg_score }}<span class="unit">/100</span>
        <ScoreBadge :score="stats.avg_score" show-label />
      </p>
    </div>
    <div class="cell">
      <p class="label">Models tested</p>
      <p class="value tnum">{{ stats.total_tested }}</p>
    </div>
    <div class="cell">
      <p class="label">Average time to result</p>
      <p class="value tnum">{{ stats.avg_ttr_days }}<span class="unit">days</span></p>
    </div>
  </section>
</template>

<style scoped>
.kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid var(--hairline);
  border-bottom: 1px solid var(--hairline);
  padding: 20px 0;
}
.cell {
  padding: 0 24px;
}
.cell + .cell {
  border-left: 1px solid var(--hairline);
}
.cell:first-child {
  padding-left: 0;
}
.label {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}
.value {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-family: var(--font-display);
  font-size: 40px;
  font-weight: 700;
  line-height: 1.1;
}
.unit {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 400;
  color: var(--muted);
}

/* Small screens: stack the cells */
@media (max-width: 640px) {
  .kpis {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .cell + .cell {
    border-left: none;
    border-top: 1px solid var(--hairline);
    padding-top: 16px;
  }
  .cell {
    padding-left: 0;
  }
}
</style>
