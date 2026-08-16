<script setup lang="ts">
defineProps<{
  title: string
  note?: string
}>()
</script>

<template>
  <section class="card" :aria-label="title">
    <div class="card-head">
      <div>
        <h2 class="card-title">{{ title }}</h2>
        <p v-if="note" class="card-note">{{ note }}</p>
      </div>
      <slot name="actions" />
    </div>
    <slot />
  </section>
</template>

<style scoped>
.card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  margin-top: 24px;
  padding: 32px;
}
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}
.card-title {
  font-size: 20px;
  font-weight: 600;
}
.card-note {
  margin: 4px 0 0;
  font-size: 12.5px;
  color: var(--ink-faint);
}

@media (max-width: 760px) {
  .card {
    padding: 20px;
  }
}
</style>
