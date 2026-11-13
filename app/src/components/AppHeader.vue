<template>
  <header class="topbar">
    <span class="veil" aria-hidden="true"></span>
    <div class="logo">心</div>
    <h1>心情日志</h1>
    <p>极简心情记录 · 数据存于后端 · 实时同步</p>
  </header>
</template>

<style scoped>
.topbar {
  position: relative;
  z-index: 1;
  overflow: hidden;
  padding: 28px 16px 26px;
  text-align: center;
  color: #fff;
  background: linear-gradient(
    118deg,
    var(--primary),
    var(--primary2) 42%,
    var(--primary3) 68%,
    var(--primary2)
  );
  background-size: 220% 220%;
  animation: gradientFlow 16s var(--ease-out) infinite alternate;
  box-shadow: 0 8px 28px rgba(91, 108, 255, 0.3);
}

/* AI 生成的柔光星尘纹理，叠加在品牌渐变上 */
.veil {
  position: absolute;
  inset: 0;
  background: url('../assets/textures/aurora-glow.jpg') center / cover no-repeat;
  mix-blend-mode: soft-light;
  opacity: 0.55;
  pointer-events: none;
}

.logo {
  position: relative;
  width: 56px;
  height: 56px;
  margin: 0 auto 10px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  backdrop-filter: blur(4px);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25),
    0 10px 26px -12px rgba(255, 255, 255, 0.8);
  animation: logoBreath 4.8s ease-in-out infinite;
}

h1 {
  position: relative;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 12px rgba(40, 20, 90, 0.22);
}

p {
  position: relative;
  font-size: 13px;
  opacity: 0.85;
  margin-top: 4px;
}

@keyframes gradientFlow {
  from {
    background-position: 0% 50%;
  }
  to {
    background-position: 100% 50%;
  }
}

@keyframes logoBreath {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25),
      0 10px 26px -12px rgba(255, 255, 255, 0.7);
  }
  50% {
    transform: translateY(-3px) rotate(-2deg);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4),
      0 16px 32px -12px rgba(255, 255, 255, 0.95);
  }
}
</style>
