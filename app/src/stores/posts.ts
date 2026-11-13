import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { SEED_POSTS } from '@/data/seedPosts'
import { loadOrSeed, savePosts } from '@/storage/postStorage'
import { MAX_LEN, type Post, type PublishResult } from '@/types/post'
import { formatTime } from '@/utils/format'
import { createPostId } from '@/utils/id'

/**
 * 动态列表的唯一数据源：组件只读取 state / computed，
 * 所有校验与持久化都收敛在 action 内，便于独立单测。
 */
export const usePostsStore = defineStore('posts', () => {
  const posts = ref<Post[]>([])
  const hydrated = ref(false)
  const storageError = ref(false)

  const count = computed(() => posts.value.length)
  const isEmpty = computed(() => posts.value.length === 0)

  /** 整体落盘；失败时置位 storageError 但保留内存态，避免当前会话内容丢失 */
  function persist(): void {
    storageError.value = !savePosts(posts.value)
  }

  /** 启动时加载：只执行一次，本地无数据才灌入种子 */
  function hydrate(seed: readonly Post[] = SEED_POSTS): void {
    if (hydrated.value) return
    posts.value = loadOrSeed(seed)
    hydrated.value = true
  }

  function publish(rawText: string, now: number = Date.now()): PublishResult {
    const text = rawText.trim()
    if (!text) return { ok: false, error: 'EMPTY' }
    if (text.length > MAX_LEN) return { ok: false, error: 'TOO_LONG' }

    const post: Post = {
      id: createPostId(now),
      text,
      time: formatTime(now),
      ts: now,
    }
    posts.value = [post, ...posts.value]
    persist()
    return { ok: true, post }
  }

  function remove(id: string): boolean {
    const next = posts.value.filter((post) => post.id !== id)
    if (next.length === posts.value.length) return false

    posts.value = next
    persist()
    return true
  }

  /** 导出用快照，避免调用方误改 store 状态 */
  function exportPosts(): Post[] {
    return posts.value.map((post) => ({ ...post }))
  }

  return {
    posts,
    hydrated,
    storageError,
    count,
    isEmpty,
    hydrate,
    publish,
    remove,
    exportPosts,
  }
})
