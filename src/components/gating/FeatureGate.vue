<script setup lang="ts">
import { useTier } from '@/composables/useTier'
import type { Capability } from '@/config/tiers'

defineProps<{ capability: Capability }>()

const { can } = useTier()
</script>

<template>
  <!-- Allowed: render the real content -->
  <slot v-if="can(capability)" />

  <!-- Locked: a decoy visual underneath (fake data, hidden from
       assistive tech, not clickable) with a frosted prompt on top -->
  <div v-else class="locked-region">
    <div class="decoy" aria-hidden="true" inert>
      <slot name="locked" />
    </div>
    <div class="frost">
      <slot name="prompt" />
    </div>
  </div>
</template>

<style scoped>
.locked-region {
  position: relative;
}
.decoy {
  pointer-events: none;
  user-select: none;
}
.frost {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(245, 246, 243, 0.62);
  backdrop-filter: blur(7px) saturate(0.8);
  -webkit-backdrop-filter: blur(7px) saturate(0.8);
  border-radius: var(--radius-lg);
}
</style>
