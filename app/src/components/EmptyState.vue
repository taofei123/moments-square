<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    icon?: string
    message?: string
  }>(),
  {
    icon: '🌱',
    message: '还没有动态，发布第一条吧～',
  },
)
</script>

<template>
  <div class="empty" data-test="empty-state">
    <span class="emoji" data-test="empty-icon">{{ props.icon }}</span>
    <span data-test="empty-message">{{ props.message }}</span>
  </div>
</template>

<style scoped>
.empty {
  text-align: center;
  color: var(--muted);
  padding: 48px 0;
  background: var(--card);
  border: 1px dashed var(--border);
  border-radius: 16px;
}

.emoji {
  font-size: 40px;
  display: block;
  margin-bottom: 10px;
  filter: grayscale(0.2);
}
</style>
