<script setup lang="ts">
defineProps<{
  title: string
  note?: string
}>()
</script>

<template>
  <section class="panel" :aria-label="title">
    <div class="panel-head">
      <h2>{{ title }}</h2>
      <div class="head-right">
        <p v-if="note" class="note tnum">{{ note }}</p>
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </section>
</template>

<style scoped>
.panel {
  border: 1px solid var(--hairline);
  border-radius: var(--radius);
  padding: 20px 24px;
  margin-top: 28px;
  background: #fff;
}
.panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
h2 {
  font-size: 18px;
  font-weight: 700;
}
.note {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}
.head-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
</style>
