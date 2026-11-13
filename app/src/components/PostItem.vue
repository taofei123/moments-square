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
  position: relative;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px 16px;
  box-shadow: var(--shadow);
  transition: transform 0.22s var(--ease-out), box-shadow 0.28s var(--ease-out),
    border-color 0.28s var(--ease-out);
  animation: rise 0.5s var(--ease-out) both;
}

/* 错峰入场：前 6 张依次延迟 */
.post:nth-child(1) {
  animation-delay: 0.02s;
}
.post:nth-child(2) {
  animation-delay: 0.08s;
}
.post:nth-child(3) {
  animation-delay: 0.14s;
}
.post:nth-child(4) {
  animation-delay: 0.2s;
}
.post:nth-child(5) {
  animation-delay: 0.26s;
}
.post:nth-child(6) {
  animation-delay: 0.32s;
}

.post:hover {
  transform: translateY(-3px);
  border-color: rgba(132, 94, 247, 0.22);
  box-shadow: var(--shadow-hover), 0 0 0 4px rgba(132, 94, 247, 0.07);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
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
  box-shadow: 0 8px 18px -10px rgba(91, 108, 255, 0.85);
  transition: transform 0.28s var(--ease-out), box-shadow 0.28s var(--ease-out),
    filter 0.28s var(--ease-out);
}

.post:hover .avatar {
  transform: scale(1.08) rotate(-3deg);
  filter: saturate(1.15) brightness(1.04);
  box-shadow: 0 12px 24px -10px rgba(91, 108, 255, 1);
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
  transition: all 0.15s var(--ease-out);
}

.post-del:hover {
  color: var(--danger);
  background: #fdeaea;
  transform: translateY(-1px);
}

.post-body {
  font-size: 15px;
  color: #2b2f36;
  white-space: pre-wrap;
  word-break: break-word;
  padding-left: 50px;
}
</style>
