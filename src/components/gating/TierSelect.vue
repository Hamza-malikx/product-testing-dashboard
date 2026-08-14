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
  padding: 8px 24px;
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
}
</style>
