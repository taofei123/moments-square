import { MAX_LEN, type Post, type PublishResult } from '../src/types/post'

/**
 * 进程内单例仓库：模块级数组即"数据库"。
 * 纯数据模块，不依赖 Hono，便于单独单测与替换实现。
 */
let posts: Post[] = []

const HEX_SUFFIX_LENGTH = 4
const HEX_SUFFIX_RANGE = 0x10000

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** 本地时间 YYYY-MM-DD HH:mm:ss，与 posts.json 的 time 字段格式一致 */
function formatTime(ts: number): string {
  const date = new Date(ts)
  const ymd = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const hms = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  return `${ymd} ${hms}`
}

/** 动态 id：毫秒时间戳 + 4 位小写十六进制 */
function createId(now: number): string {
  const suffix = Math.floor(Math.random() * HEX_SUFFIX_RANGE)
    .toString(16)
    .padStart(HEX_SUFFIX_LENGTH, '0')
  return `${now}${suffix}`
}

/** 复制单条，避免调用方拿到仓库内部对象的引用 */
function clone(post: Post): Post {
  return { ...post }
}

/** 返回快照副本，防止外部直接篡改内部数组 */
export function listPosts(): Post[] {
  return posts.map(clone)
}

export function getPost(id: string): Post | undefined {
  const found = posts.find((post) => post.id === id)
  return found ? clone(found) : undefined
}

/**
 * 发布一条动态：trim 后校验空/超长，成功则插入数组头部。
 * 失败返回错误码，由路由层映射为 400。
 */
export function addPost(text: string, now: number = Date.now()): PublishResult {
  const trimmed = text.trim()
  if (!trimmed) return { ok: false, error: 'EMPTY' }
  if (trimmed.length > MAX_LEN) return { ok: false, error: 'TOO_LONG' }

  const post: Post = {
    id: createId(now),
    text: trimmed,
    time: formatTime(now),
    ts: now,
  }
  posts = [post, ...posts]
  return { ok: true, post: clone(post) }
}

/** 删除一条动态，未命中返回 false 以便路由层回 404 */
export function removePost(id: string): boolean {
  const next = posts.filter((post) => post.id !== id)
  if (next.length === posts.length) return false

  posts = next
  return true
}

/** 用给定内容整体替换仓库（默认清空），测试隔离与重载用 */
export function resetStore(initial: Post[] = []): void {
  posts = initial.map(clone)
}

/** 灌入种子数据，并保证"新的在前" */
export function seedStore(initial: Post[]): void {
  posts = initial.map(clone).sort((left, right) => right.ts - left.ts)
}
