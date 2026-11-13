<script setup lang="ts">
import { computed, ref } from 'vue'
import { MAX_LEN } from '@/types/post'

const emit = defineEmits<{ submit: [text: string] }>()

/** 接近上限时开始提醒的字符阈值 */
const NEAR_LIMIT = 450

const draft = ref('')
const length = computed(() => draft.value.length)
const nearLimit = computed(() => length.value >= NEAR_LIMIT && length.value <= MAX_LEN)
const overLimit = computed(() => length.value > MAX_LEN)
const canPublish = computed(() => draft.value.trim().length > 0 && !overLimit.value)

function submit(): void {
  if (!canPublish.value) return
  emit('submit', draft.value)
  draft.value = ''
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    submit()
  }
}
</script>

<template>
  <section class="composer">
    <div class="composer-row">
      <div class="me-avatar">我</div>
      <textarea
        v-model="draft"
        data-test="composer-input"
        :maxlength="MAX_LEN"
        placeholder="此刻想说点什么？"
        @keydown="onKeydown"
      ></textarea>
    </div>
    <div class="composer-bar">
      <span
        class="count"
        data-test="composer-count"
        :class="{ near: nearLimit, over: overLimit }"
        >{{ length }} / {{ MAX_LEN }}</span
      >
      <button
        class="btn-primary"
        data-test="composer-submit"
        type="button"
        :disabled="!canPublish"
        @click="submit"
      >
        发布
      </button>
    </div>
  </section>
</template>

<style scoped>
.composer {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 16px;
  box-shadow: var(--shadow);
}

.composer-row {
  display: flex;
  gap: 12px;
}

.me-avatar {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffb86c, #ff7a59);
  color: #fff;
  font-weight: 700;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

textarea {
  flex: 1;
  border: none;
  resize: vertical;
  min-height: 70px;
  font-size: 15px;
  font-family: inherit;
  outline: none;
  background: transparent;
  color: var(--text);
  padding-top: 8px;
}

textarea::placeholder {
  color: #b7bdc9;
}

.composer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px dashed var(--border);
}

.count {
  font-size: 13px;
  color: var(--muted);
  transition: color 0.2s;
}

.count.near {
  color: #f59e0b;
}

.count.over {
  color: var(--danger);
}
</style>
