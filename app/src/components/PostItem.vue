<script setup lang="ts">
import { computed } from 'vue'
import type { Post } from '@/types/post'
import { avatarFor, firstChar } from '@/utils/avatar'
import { relTime } from '@/utils/time'

const props = defineProps<{ post: Post }>()
const emit = defineEmits<{ delete: [id: string] }>()

const gradient = computed(() => avatarFor(props.post.id))
const initial = computed(() => firstChar(props.post.text ?? ''))
const timeText = computed(() => relTime(props.post.ts) || props.post.time)
</script>

<template>
  <article class="post">
    <div class="post-head">
      <div class="avatar" data-test="post-avatar" :style="{ background: gradient }">
        {{ initial }}
      </div>
      <div class="post-meta">
        <span class="post-name" data-test="post-name">动态用户</span>
        <span class="post-time" data-test="post-time">{{ timeText }}</span>
      </div>
      <button
        class="post-del"
        data-test="post-delete"
        type="button"
        @click="emit('delete', props.post.id)"
      >
        删除
      </button>
    </div>
    <div class="post-body" data-test="post-body">{{ props.post.text }}</div>
  </article>
</template>

<style scoped>
.post {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px 16px;
  box-shadow: var(--shadow);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  animation: rise 0.35s ease both;
}

.post:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-hover);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.post-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.post-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
  flex: 1;
  min-width: 0;
}

.post-name {
  font-size: 14px;
  font-weight: 600;
}

.post-time {
  font-size: 12px;
  color: var(--muted);
}

.post-del {
  background: transparent;
  color: var(--muted);
  border: none;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.15s;
}

.post-del:hover {
  color: var(--danger);
  background: #fdeaea;
}

.post-body {
  font-size: 15px;
  color: #2b2f36;
  white-space: pre-wrap;
  word-break: break-word;
  padding-left: 50px;
}
</style>
