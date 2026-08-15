<script setup lang="ts">
import { useTier } from '@/composables/useTier'
import { TIERS, TIER_LABELS } from '@/config/tiers'

const { tier } = useTier()
</script>

<template>
  <div class="simulation-bar">
    <label class="sim-label" for="tier-select">Simulating:</label>
    <select id="tier-select" v-model="tier" class="sim-select">
      <option v-for="t in TIERS" :key="t" :value="t">{{ TIER_LABELS[t] }} plan</option>
    </select>
  </div>
</template>

<style scoped>
.simulation-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  background: var(--ink);
  color: #f4f6f8;
  /* Aligns the dropdown to the 1140px content grid on wide screens,
     and falls back to plain 24px padding on narrow ones */
  padding: 8px max(24px, calc((100% - 1140px) / 2 + 24px));
  font-size: 13px;
}
.sim-label {
  color: #aeb7bf;
}
.sim-select {
  font: inherit;
  color: var(--ink);
  background: #fff;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-badge);
  padding: 4px 8px;
  cursor: pointer;
}
/* The global petrol focus ring is invisible on this dark bar,
   so the first tab stop gets a light ring of its own */
.sim-select:focus-visible {
  outline: 2px solid #f4f6f8;
  outline-offset: 2px;
}
</style>
