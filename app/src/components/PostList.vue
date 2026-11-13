<script setup lang="ts">
import EmptyState from '@/components/EmptyState.vue'
import PostItem from '@/components/PostItem.vue'
import type { Post } from '@/types/post'

const props = defineProps<{ posts: Post[] }>()
const emit = defineEmits<{ delete: [id: string] }>()
</script>

<template>
  <main class="feed" data-test="post-list">
    <EmptyState v-if="props.posts.length === 0" />
    <PostItem
      v-for="post in props.posts"
      :key="post.id"
      :post="post"
      @delete="emit('delete', $event)"
    />
  </main>
</template>

<style scoped>
.feed {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
