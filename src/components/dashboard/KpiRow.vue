<script setup lang="ts">
import { computed } from 'vue'
import type { AggregateStats } from '@/types/models'
import ScoreBadge from './ScoreBadge.vue'

const props = defineProps<{ stats: AggregateStats }>()

// The gauge is one SVG circle. Its outline is 207.3pt long, and we
// hide the part that represents the missing score.
const GAUGE_LENGTH = 207.3
const gaugeOffset = computed(() => GAUGE_LENGTH * (1 - props.stats.avg_score / 100))
</script>

<template>
  <section class="stats" aria-label="Category summary">
    <div class="stat">
      <span class="gauge" aria-hidden="true">
        <svg width="78" height="78" viewBox="0 0 78 78">
          <circle class="gauge-bg" cx="39" cy="39" r="33" />
          <circle
            class="gauge-fg"
            cx="39"
            cy="39"
            r="33"
            :stroke-dasharray="GAUGE_LENGTH"
            :stroke-dashoffset="gaugeOffset"
          />
        </svg>
      </span>
      <div>
        <p class="stat-label microlabel">Average score</p>
        <p class="stat-value tnum">
          {{ stats.avg_score }}<span class="unit">/100</span>
        </p>
        <ScoreBadge :score="stats.avg_score" variant="word" />
      </div>
    </div>

    <div class="stat">
      <div>
        <p class="stat-label microlabel">Models tested</p>
        <p class="stat-value mono tnum">{{ stats.total_tested }}</p>
      </div>
    </div>

    <div class="stat">
      <div>
        <p class="stat-label microlabel">Average time to result</p>
        <p class="stat-value mono tnum">
          {{ stats.avg_ttr_days }}<span class="unit">days</span>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* The 1px grid gap shows the border color through, so the cells are
   divided by hairlines without any extra border rules */
.stats {
  display: grid;
  grid-template-columns: 1.3fr 1fr 1fr;
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-top: 28px;
}
.stat {
  background: var(--paper);
  padding: 26px 28px;
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0; /* lets a grid cell shrink below its content width */
}
.gauge {
  width: 78px;
  height: 78px;
  flex-shrink: 0;
}
.gauge svg {
  transform: rotate(-90deg); /* start the arc at twelve o'clock */
}
.gauge-bg {
  fill: none;
  stroke: var(--line);
  stroke-width: 8;
}
.gauge-fg {
  fill: none;
  stroke: var(--teal-700);
  stroke-width: 8;
  stroke-linecap: round;
}
.stat-label {
  margin: 0 0 10px;
}
.stat-value {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
  font-family: var(--font-display);
  font-size: 38px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.1;
}
.stat-value .unit {
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 500;
  color: var(--ink-soft);
}

@media (max-width: 760px) {
  .stats {
    grid-template-columns: 1fr;
  }
  .stat {
    padding: 20px 22px;
  }
}
</style>
