<script setup lang="ts">
import { computed } from 'vue'
import { scoreBand } from '@/config/bands'

const props = defineProps<{
  score: number
  /** 'pill' (default) shows the number in a mono chip; 'word' shows the band word */
  variant?: 'pill' | 'word'
}>()

const band = computed(() => scoreBand(props.score))
</script>

<template>
  <!-- A rounded chip with a dot, used beside the big stat numbers -->
  <span v-if="variant === 'word'" class="rating-chip" :class="band.css">{{ band.word }}</span>

  <!-- A square mono chip with the number, used in the table -->
  <span v-else class="wrap">
    <span class="score-pill mono tnum" :class="band.css">{{ score }}</span>
    <span class="word">{{ band.word }}</span>
  </span>
</template>

<style scoped>
.rating-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 10px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: var(--radius-pill);
}
/* The dot inherits the text color, so one rule covers every band */
.rating-chip::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}
.wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.score-pill {
  font-weight: 700;
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 6px;
}
.word {
  font-size: 13.5px;
  color: var(--ink-soft);
}

/* Verdict bands. The chip always prints a number or a word,
   so color is never the only signal. */
.excellent {
  background: var(--teal-900);
  color: #fff;
}
.good {
  background: var(--teal-100);
  color: var(--teal-900);
}
.fair {
  background: var(--amber-100);
  color: #7a5308;
}
.poor {
  background: var(--red-100);
  color: #7c2a1d;
}
</style>
