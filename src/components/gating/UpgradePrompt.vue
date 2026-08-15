<script setup lang="ts">
defineProps<{
  title: string
  body: string
  actionLabel?: string
}>()

defineEmits<{ action: [] }>()
</script>

<template>
  <div class="prompt">
    <span class="lock-box" aria-hidden="true">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </span>
    <h3>{{ title }}</h3>
    <p>{{ body }}</p>
    <button type="button" class="cta" @click="$emit('action')">
      {{ actionLabel ?? 'Compare plans' }}
    </button>
  </div>
</template>

<style scoped>
.prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  max-width: 380px;
  padding: 24px;
}
.lock-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--hairline);
  border-radius: var(--radius);
  background: #fff;
  color: var(--ink);
}
h3 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}
p {
  margin: 0;
  font-size: 14px;
  color: var(--muted);
}
.cta {
  margin-top: 6px;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: var(--brand-red);
  border: none;
  border-radius: var(--radius);
  padding: 8px 18px;
  cursor: pointer;
}
.cta:hover {
  background: #a90d27;
}
</style>
