import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ApiError, createPost, deletePost, fetchPosts } from '@/api/posts'
import { MAX_LEN, type Post, type PublishResult } from '@/types/post'

/** 列表加载状态机：idle → loading → ready | error */
export type PostsStatus = 'idle' | 'loading' | 'ready' | 'error'

const FALLBACK_ERROR = '无法连接后端服务'

/** 把任意异常收敛成可展示的中文文案 */
function toMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return FALLBACK_ERROR
}

/**
 * 动态列表的唯一数据源：远端 REST API 是唯一持久化层，
 * 所有校验、请求与状态流转都收敛在 action 内，便于独立单测。
 */
export const usePostsStore = defineStore('posts', () => {
  const posts = ref<Post[]>([])
  const status = ref<PostsStatus>('idle')
  const errorMessage = ref('')
  /** 最近一次失败的响应状态；0 表示请求没发出去（网络不可达），null 表示当前无错误 */
  const lastErrorStatus = ref<number | null>(null)

  const count = computed(() => posts.value.length)
  const isEmpty = computed(() => posts.value.length === 0)
  /** 仅网络层失败为 true：界面据此展示「后端是否已启动」的运维提示 */
  const isNetworkError = computed(() => lastErrorStatus.value === 0)

  function setError(error: unknown): void {
    errorMessage.value = toMessage(error)
    // 非 ApiError 的意外异常（如 TypeError）同样视为连接问题
    lastErrorStatus.value = error instanceof ApiError ? error.status : 0
  }

  function clearErrorState(): void {
    errorMessage.value = ''
    lastErrorStatus.value = null
  }

  /** 首屏 / 重试：全量拉取，失败时保留既有列表并暴露错误文案 */
  async function load(): Promise<void> {
    status.value = 'loading'
    clearErrorState()
    try {
      posts.value = await fetchPosts()
      status.value = 'ready'
    } catch (error) {
      status.value = 'error'
      setError(error)
    }
  }

  /** 先做本地校验省一次请求，再交给后端生成 id/time/ts 并置顶 */
  async function publish(rawText: string): Promise<PublishResult> {
    const text = rawText.trim()
    if (!text) return { ok: false, error: 'EMPTY' }
    if (text.length > MAX_LEN) return { ok: false, error: 'TOO_LONG' }

    try {
      const post = await createPost(text)
      posts.value = [post, ...posts.value]
      clearErrorState()
      return { ok: true, post }
    } catch (error) {
      setError(error)
      return { ok: false, error: 'NETWORK' }
    }
  }

  /** 删除：后端成功后才改内存态，保证两端一致 */
  async function remove(id: string): Promise<boolean> {
    try {
      await deletePost(id)
      posts.value = posts.value.filter((post) => post.id !== id)
      clearErrorState()
      return true
    } catch (error) {
      setError(error)
      return false
    }
  }

  /** 导出用深拷贝快照，避免调用方误改 store 状态 */
  function exportPosts(): Post[] {
    return posts.value.map((post) => ({ ...post }))
  }

  function clearError(): void {
    clearErrorState()
  }

  return {
    posts,
    status,
    errorMessage,
    isNetworkError,
    count,
    isEmpty,
    load,
    publish,
    remove,
    exportPosts,
    clearError,
  }
})
