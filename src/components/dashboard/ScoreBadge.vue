<script setup lang="ts">
import { computed } from 'vue'
import { scoreBand } from '@/config/bands'

const props = defineProps<{
  score: number
  /** also print the band word ("Good") next to the badge */
  showLabel?: boolean
  /** 'number' (default) puts the score in the chip; 'word' puts the band word in it */
  variant?: 'number' | 'word'
}>()

const band = computed(() => scoreBand(props.score))
</script>

<template>
  <span class="wrap">
    <span class="badge" :class="[band.css, variant === 'word' ? 'is-word' : 'tnum']">
      {{ variant === 'word' ? band.word : score }}
    </span>
    <span v-if="showLabel && variant !== 'word'" class="word">{{ band.word }}</span>
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
/* Word chips sit next to large numbers, so they keep their own size */
.is-word {
  font-size: 12px;
  font-weight: 600;
}
.word {
  color: var(--muted);
  font-size: 0.85em;
}
</style>
