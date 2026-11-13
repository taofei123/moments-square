<template>
  <header class="topbar">
    <div class="logo">广</div>
    <h1>动态广场</h1>
    <p>极简动态发布 · 自动本地存储 · 无需联网</p>
  </header>
</template>

<style scoped>
.topbar {
  background: linear-gradient(135deg, var(--primary), var(--primary2));
  color: #fff;
  padding: 28px 16px 26px;
  text-align: center;
  box-shadow: 0 6px 20px rgba(91, 108, 255, 0.25);
}

.logo {
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
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
}

h1 {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

p {
  font-size: 13px;
  opacity: 0.85;
  margin-top: 4px;
}
</style>
