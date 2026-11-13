<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { MAX_LEN } from '@/types/post'

const props = withDefaults(defineProps<{ submitting?: boolean }>(), { submitting: false })

const emit = defineEmits<{ submit: [text: string] }>()

/** 接近上限时开始提醒的字符阈值 */
const NEAR_LIMIT = 450
/** 数字弹跳动画时长，与 .count.bump 的 animation-duration 保持一致 */
const BUMP_DURATION = 320

const draft = ref('')
const bump = ref(false)
const length = computed(() => draft.value.length)
const nearLimit = computed(() => length.value >= NEAR_LIMIT && length.value <= MAX_LEN)
const overLimit = computed(() => length.value > MAX_LEN)
const canPublish = computed(
  () => draft.value.trim().length > 0 && !overLimit.value && !props.submitting,
)

let bumpTimer: ReturnType<typeof setTimeout> | undefined

watch(length, (value) => {
  // 清空（发布成功 reset / 全删）时计数归零，不需要再弹跳
  if (value === 0) {
    clearTimeout(bumpTimer)
    bump.value = false
    return
  }
  bump.value = true
  clearTimeout(bumpTimer)
  bumpTimer = setTimeout(() => {
    bump.value = false
  }, BUMP_DURATION)
})

onUnmounted(() => {
  clearTimeout(bumpTimer)
})

/** 只向上报意图，草稿的去留由父级（请求结果）决定 */
function submit(): void {
  if (!canPublish.value) return
  emit('submit', draft.value)
}

/** 发布成功后由父级调用，清空草稿并复位弹跳状态 */
function reset(): void {
  clearTimeout(bumpTimer)
  bump.value = false
  draft.value = ''
}

defineExpose({ reset })

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
        :class="{ near: nearLimit, over: overLimit, bump }"
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
  position: relative;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 16px;
  box-shadow: var(--shadow);
  transition: box-shadow 0.3s var(--ease-out), transform 0.3s var(--ease-out),
    border-color 0.3s var(--ease-out);
}

/* 聚焦时浮起并透出紫蓝柔光 */
.composer:focus-within {
  transform: translateY(-1px);
  border-color: rgba(132, 94, 247, 0.28);
  box-shadow: var(--shadow), 0 0 0 4px rgba(132, 94, 247, 0.1),
    0 18px 38px -22px rgba(91, 108, 255, 0.75);
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
  box-shadow: 0 8px 18px -10px rgba(255, 122, 89, 0.9);
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
  transition: color 0.25s var(--ease-out), transform 0.25s var(--ease-out);
}

.composer:focus-within textarea::placeholder {
  color: #c9c2ea;
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
  display: inline-block;
  font-size: 13px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
  transition: color 0.2s;
}

.count.near {
  color: var(--warn);
}

.count.over {
  color: var(--danger);
}

.count.bump {
  animation: countPop 0.32s var(--ease-out);
}

@keyframes countPop {
  0% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.18);
    color: var(--primary);
  }
  100% {
    transform: scale(1);
  }
}
</style>
