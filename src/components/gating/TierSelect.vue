<script setup lang="ts">
import { useTier } from '@/composables/useTier'
import { TIERS, TIER_LABELS, type Tier } from '@/config/tiers'

const { tier, setTier } = useTier()

// The plan ref is read-only, so changes go through setTier
function onChange(event: Event) {
  setTier((event.target as HTMLSelectElement).value as Tier)
}
</script>

<template>
  <header class="nav">
    <div class="brand">
      <span class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M4 3v6a2 2 0 0 0 .6 1.4l4 4a2 2 0 0 1 .6 1.4V21M20 3v6a2 2 0 0 1-.6 1.4l-4 4a2 2 0 0 0-.6 1.4V21M2 3h20M8 21h8"
            stroke="#fff"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </span>
      <span class="brand-name">Testing Labs</span>
    </div>

    <div class="nav-right">
      <label class="sim-label" for="tier-select">Simulating:</label>
      <span class="plan-field">
        <span class="plan-dot" aria-hidden="true"></span>
        <select id="tier-select" :value="tier" class="sim-select" @change="onChange">
          <option v-for="t in TIERS" :key="t" :value="t">{{ TIER_LABELS[t] }} plan</option>
        </select>
      </span>
    </div>
  </header>
</template>

<style scoped>
.nav {
  background: var(--ink);
  color: #edefec;
  padding: 14px max(20px, calc((100% - 1180px) / 2 + 40px));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand-mark {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: linear-gradient(135deg, var(--teal-500), var(--teal-900));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.brand-mark svg {
  width: 14px;
  height: 14px;
}
.brand-name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 0.02em;
}
.nav-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sim-label {
  font-size: 13px;
  color: #9fadb0;
}
/* The dot and the select share one field, so the control reads as
   a status pill rather than a bare form input */
.plan-field {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #1b2327;
  border: 1px solid #333f43;
  border-radius: var(--radius);
  padding: 7px 12px;
}
/* One focus ring for the whole field, so the select inside does not
   draw a second box. It is light, not brand teal: on this near-black
   bar a teal ring is too low-contrast to be a reliable indicator. */
.plan-field:focus-within {
  border-color: #edefec;
  box-shadow: 0 0 0 3px rgba(237, 239, 236, 0.45);
}
.plan-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--teal-500);
  flex-shrink: 0;
}
.sim-select {
  font-family: var(--font-body);
  font-size: 13px;
  color: #edefec;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}
.sim-select option {
  color: var(--ink); /* the opened list is drawn by the OS on white */
}
.sim-select:focus-visible {
  outline: none; /* the field wrapper carries the focus ring */
}
</style>
