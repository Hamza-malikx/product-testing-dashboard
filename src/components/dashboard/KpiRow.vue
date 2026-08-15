<script setup lang="ts">
import type { AggregateStats } from '@/types/models'
import ScoreBadge from './ScoreBadge.vue'

defineProps<{ stats: AggregateStats }>()
</script>

<template>
  <section class="kpis" aria-label="Category summary">
    <div class="cell">
      <p class="label microlabel">Average score</p>
      <p class="value">
        <span class="figure tnum">{{ stats.avg_score }}<span class="unit">/100</span></span>
        <ScoreBadge :score="stats.avg_score" variant="word" />
      </p>
    </div>
    <div class="cell">
      <p class="label microlabel">Models tested</p>
      <p class="value tnum">{{ stats.total_tested }}</p>
    </div>
    <div class="cell">
      <p class="label microlabel">Average time to result</p>
      <p class="value">
        <span class="figure tnum">{{ stats.avg_ttr_days }}<span class="unit">days</span></span>
      </p>
    </div>
  </section>
</template>

<style scoped>
/* The masthead's petrol rule frames this strip from above,
   so it only needs its own closing hairline below */
.kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-bottom: 1px solid var(--hairline);
  padding: 22px 0 20px;
}
.cell {
  padding: 0 24px;
  min-width: 0; /* lets a grid cell shrink below its content width */
}
.cell + .cell {
  border-left: 1px solid var(--hairline);
}
.cell:first-child {
  padding-left: 0;
}
.label {
  margin: 0 0 6px;
}
.value {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  font-family: var(--font-display);
  font-size: 40px;
  font-weight: 700;
  line-height: 1.1;
}
/* The average score is the page's conclusion; the other two are context */
.cell:first-child .value {
  font-size: 56px;
  letter-spacing: -0.01em;
}
.cell:first-child .value :deep(.is-word) {
  font-size: 13px;
}
/* The unit clings to its numeral; the flex gap only separates the chip */
.unit {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 400;
  color: var(--muted);
  margin-left: 3px;
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
