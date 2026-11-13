<script setup lang="ts">
import emptyGarden from '@/assets/illustrations/empty-garden.jpg'

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
    <div class="illustration-wrap">
      <img
        class="illustration"
        data-test="empty-illustration"
        :src="emptyGarden"
        alt="一株破土而出的小芽"
      />
      <span class="emoji" data-test="empty-icon">{{ props.icon }}</span>
    </div>
    <span data-test="empty-message">{{ props.message }}</span>
  </div>
</template>

<style scoped>
.empty {
  position: relative;
  text-align: center;
  color: var(--muted);
  padding: 34px 20px 44px;
  border: 1px solid transparent;
  border-radius: 20px;
  /* 柔和渐变描边：内层白底 padding-box + 外层渐变 border-box */
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.97), rgba(246, 243, 255, 0.97)) padding-box,
    linear-gradient(
        135deg,
        rgba(91, 108, 255, 0.45),
        rgba(132, 94, 247, 0.22) 45%,
        rgba(34, 211, 238, 0.38)
      )
      border-box;
  box-shadow: var(--shadow), var(--ring-soft);
  overflow: hidden;
}

.illustration-wrap {
  position: relative;
  width: 132px;
  height: 132px;
  margin: 0 auto 16px;
  animation: floaty 5.4s ease-in-out infinite;
}

.illustration {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 18px 34px -16px rgba(91, 108, 255, 0.75),
    0 0 0 6px rgba(132, 94, 247, 0.08);
}

/* 保留原有 emoji 图标，作为插画右下角的小徽标 */
.emoji {
  position: absolute;
  right: -2px;
  bottom: 2px;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 8px 18px -8px rgba(91, 108, 255, 0.8);
  animation: swing 3.2s ease-in-out infinite;
}

[data-test='empty-message'] {
  display: inline-block;
  font-size: 13px;
}

@keyframes floaty {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes swing {
  0%,
  100% {
    transform: rotate(-6deg);
  }
  50% {
    transform: rotate(8deg);
  }
}
</style>
