<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AmbientDecor from '@/components/AmbientDecor.vue'
import AppHeader from '@/components/AppHeader.vue'
import PostComposer from '@/components/PostComposer.vue'
import PostList from '@/components/PostList.vue'
import { usePostsStore } from '@/stores/posts'
import { downloadJson } from '@/utils/download'

const store = usePostsStore()
/** 只用得到 reset，声明最小结构避免耦合组件内部实现 */
const composerRef = ref<{ reset: () => void } | null>(null)
/** 发布请求在飞时禁用发布按钮，避免重复提交 */
const submitting = ref(false)

onMounted(() => {
  void store.load()
})

async function handleSubmit(text: string): Promise<void> {
  if (submitting.value) return
  submitting.value = true
  try {
    const result = await store.publish(text)
    // 只有后端确认写入成功才清空草稿，失败时保留用户输入
    if (result.ok) composerRef.value?.reset()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: string): Promise<void> {
  await store.remove(id)
}

function retry(): void {
  void store.load()
}

function exportBackup(): void {
  const date = new Date().toISOString().slice(0, 10)
  downloadJson(`posts-${date}.json`, store.exportPosts())
}
</script>

<template>
  <AmbientDecor />
  <AppHeader />

  <div class="container">
    <PostComposer ref="composerRef" :submitting="submitting" @submit="handleSubmit" />

    <div class="toolbar">
      <button class="btn-ghost" data-test="export" type="button" @click="exportBackup">
        ⬇ 导出备份
      </button>
    </div>

    <p v-if="store.errorMessage" class="storage-error" data-test="storage-error">
      <span>
        {{ store.errorMessage
        }}<template v-if="store.isNetworkError">，请确认后端已启动（npm run dev:api）</template>
      </span>
      <button class="retry" data-test="retry" type="button" @click="retry">重试</button>
    </p>

    <PostList :posts="store.posts" @delete="handleDelete" />

    <footer>
      数据保存在 <code>后端服务</code>，刷新页面不会丢失
    </footer>
  </div>
</template>

<style scoped>
.storage-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  padding: 10px 14px;
  font-size: 13px;
  color: #b45309;
  background: linear-gradient(120deg, #fef6e7, #fff8f0);
  border: 1px solid #fbe2b7;
  border-radius: 12px;
  animation: fadeUp 0.4s var(--ease-out) both;
}

.retry {
  flex: 0 0 auto;
  padding: 4px 12px;
  font-size: 12px;
  font-family: inherit;
  color: #b45309;
  background: #fff;
  border: 1px solid #fbe2b7;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.18s var(--ease-out);
}

.retry:hover {
  color: #fff;
  background: #b45309;
  border-color: #b45309;
  transform: translateY(-1px);
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
