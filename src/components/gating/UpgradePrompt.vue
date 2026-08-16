<script setup lang="ts">
// actionLabel is required, so a gate can never fall back to a generic
// label that does not describe what the button actually does
defineProps<{
  title: string
  body: string
  actionLabel: string
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
    <!-- h2 keeps the heading order intact: the card headings around it
         are h2, and on Basic they sit inside the aria-hidden decoy -->
    <h2>{{ title }}</h2>
    <p>{{ body }}</p>
    <button type="button" class="cta" @click="$emit('action')">
      {{ actionLabel }}
    </button>
  </div>
</template>

<style scoped>
.prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  max-width: 400px;
  padding: 26px;
}
.lock-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--teal-500), var(--teal-900));
  color: #fff;
}
h2 {
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0;
}
p {
  margin: 0;
  font-size: 14px;
  color: var(--ink-soft);
}
.cta {
  margin-top: 4px;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: var(--teal-900);
  border: none;
  border-radius: var(--radius);
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.cta:hover {
  background: var(--teal-700);
}
.cta:active {
  transform: translateY(1px);
}
</style>
