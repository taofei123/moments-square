import type { Post } from '@/types/post'
import { formatTime } from '@/utils/format'

/** 本地存储 key，带版本号便于后续数据格式演进 */
export const STORAGE_KEY = 'moments.posts.v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** 只接受字段类型合法的条目，避免脏数据导致渲染崩溃 */
function toPost(value: unknown): Post | null {
  if (!isRecord(value)) return null
  const { id, text, ts } = value
  if (typeof id !== 'string' || id === '') return null
  if (typeof text !== 'string') return null
  if (typeof ts !== 'number' || !Number.isFinite(ts)) return null

  const time = typeof value.time === 'string' && value.time ? value.time : formatTime(ts)
  return { id, text, time, ts }
}

/**
 * 读取全部动态。缺失 / 解析失败 / 结构非法 / 存储不可用时一律降级为空数组，
 * 保证坏数据不会白屏。
 */
export function loadPosts(): Post[] {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return []
  }
  if (!raw) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  return parsed.map(toPost).filter((post): post is Post => post !== null)
}

/** 覆盖写入全部动态，写入失败（如超出配额）时返回 false 而不抛错 */
export function savePosts(posts: Post[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
    return true
  } catch {
    return false
  }
}

/** 删除本地动态数据 */
export function clearPosts(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* 存储不可用时忽略，UI 会以空列表呈现 */
  }
}

/**
 * 启动时加载数据：本地从未写入过则灌入种子数据；
 * 已有数据（哪怕是空数组或损坏内容）以本地为准，不覆盖用户数据。
 */
export function loadOrSeed(seed: readonly Post[]): Post[] {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return []
  }

  if (raw !== null) return loadPosts()

  const initial = seed.map((post) => ({ ...post }))
  savePosts(initial)
  return initial
}
