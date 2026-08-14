<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  score: number
  /** also print the band word ("Good") next to the badge */
  showLabel?: boolean
}>()

// One verdict system for the whole app.
// The badge always shows the number, so color is never the only signal.
const band = computed(() => {
  if (props.score >= 85) return { word: 'Excellent', css: 'excellent' }
  if (props.score >= 70) return { word: 'Good', css: 'good' }
  if (props.score >= 55) return { word: 'Fair', css: 'fair' }
  return { word: 'Poor', css: 'poor' }
})
</script>

<template>
  <span class="wrap">
    <span class="badge tnum" :class="band.css">{{ score }}</span>
    <span v-if="showLabel" class="word">{{ band.word }}</span>
  </span>
</template>

<style scoped>
.wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.badge {
  display: inline-block;
  padding: 1px 7px;
  border-radius: var(--radius-badge);
  font-weight: 600;
  font-size: 0.9em;
  color: #fff;
}
.excellent {
  background: var(--band-excellent);
}
.good {
  background: var(--band-good);
}
.fair {
  background: var(--band-fair);
  color: var(--ink); /* amber needs dark text to stay readable */
}
.poor {
  background: var(--band-poor);
}
.word {
  color: var(--muted);
  font-size: 0.85em;
}
</style>
