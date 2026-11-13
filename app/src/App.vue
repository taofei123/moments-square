<script setup lang="ts">
import AmbientDecor from '@/components/AmbientDecor.vue'
import AppHeader from '@/components/AppHeader.vue'
import PostComposer from '@/components/PostComposer.vue'
import PostList from '@/components/PostList.vue'
import { usePostsStore } from '@/stores/posts'
import { downloadJson } from '@/utils/download'

const store = usePostsStore()
store.hydrate()

function handleSubmit(text: string): void {
  store.publish(text)
}

function handleDelete(id: string): void {
  store.remove(id)
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
    <PostComposer @submit="handleSubmit" />

    <div class="toolbar">
      <button class="btn-ghost" data-test="export" type="button" @click="exportBackup">
        ⬇ 导出备份
      </button>
    </div>

    <p v-if="store.storageError" class="storage-error" data-test="storage-error">
      本地存储写入失败，当前内容仅保留在本次会话中
    </p>

    <PostList :posts="store.posts" @delete="handleDelete" />

    <footer>
      数据自动保存在 <code>Local Storage</code>，刷新或重开浏览器都不会丢失
    </footer>
  </div>
</template>

<style scoped>
.storage-error {
  margin-bottom: 14px;
  padding: 10px 14px;
  font-size: 13px;
  color: #b45309;
  background: linear-gradient(120deg, #fef6e7, #fff8f0);
  border: 1px solid #fbe2b7;
  border-radius: 12px;
  animation: fadeUp 0.4s var(--ease-out) both;
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
