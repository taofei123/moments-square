<script setup lang="ts">
interface GlowBlob {
  top: string
  left: string
  size: string
  background: string
  delay: string
  duration: string
}

interface Sparkle {
  top: string
  left: string
  size: string
  delay: string
}

/** 3 个模糊光斑：紫蓝主调 + 青/粉点缀，只做 transform/opacity 动画 */
const blobs: GlowBlob[] = [
  {
    top: '-14%',
    left: '-16%',
    size: '44vmax',
    background:
      'radial-gradient(circle at 50% 50%, rgba(91, 108, 255, 0.45), rgba(91, 108, 255, 0) 70%)',
    delay: '0s',
    duration: '21s',
  },
  {
    top: '30%',
    left: '58%',
    size: '38vmax',
    background:
      'radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.34), rgba(34, 211, 238, 0) 70%)',
    delay: '-7s',
    duration: '25s',
  },
  {
    top: '56%',
    left: '-10%',
    size: '34vmax',
    background:
      'radial-gradient(circle at 50% 50%, rgba(251, 113, 133, 0.3), rgba(251, 113, 133, 0) 72%)',
    delay: '-13s',
    duration: '29s',
  },
]

/** 4 颗星点，延迟错开避免同步闪烁 */
const sparkles: Sparkle[] = [
  { top: '13%', left: '11%', size: '12px', delay: '0s' },
  { top: '24%', left: '79%', size: '9px', delay: '-1.4s' },
  { top: '61%', left: '18%', size: '8px', delay: '-2.6s' },
  { top: '78%', left: '69%', size: '14px', delay: '-3.8s' },
]
</script>

<template>
  <div class="ambient" data-test="ambient-decor" aria-hidden="true">
    <span
      v-for="(blob, index) in blobs"
      :key="`blob-${index}`"
      class="blob"
      data-test="glow-blob"
      :style="{
        top: blob.top,
        left: blob.left,
        width: blob.size,
        height: blob.size,
        background: blob.background,
        animationDelay: blob.delay,
        animationDuration: blob.duration,
      }"
    ></span>

    <span
      v-for="(sparkle, index) in sparkles"
      :key="`sparkle-${index}`"
      class="sparkle"
      data-test="sparkle"
      :style="{
        top: sparkle.top,
        left: sparkle.left,
        width: sparkle.size,
        height: sparkle.size,
        animationDelay: sparkle.delay,
      }"
    ></span>
  </div>
</template>

<style scoped>
.ambient {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(42px);
  animation-name: drift;
  animation-timing-function: var(--ease-out);
  animation-iteration-count: infinite;
  animation-direction: alternate;
  opacity: 0.85;
}

.sparkle {
  position: absolute;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.95), 0 0 22px rgba(132, 94, 247, 0.65);
  animation: twinkle 3.6s ease-in-out infinite;
}

@keyframes drift {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    transform: translate3d(4%, 5%, 0) scale(1.12);
  }
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.15;
    transform: scale(0.7);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 600px) {
  .blob {
    filter: blur(28px);
  }

  .sparkle {
    display: none;
  }
}
</style>
