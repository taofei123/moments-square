import { readFile } from 'node:fs/promises'
import type { Post } from '../src/types/post'

/** 默认种子：仓库根 posts.json（app/server/ → ../../ 即 d:/Codebuddy） */
const DEFAULT_SEED_URL = new URL('../../posts.json', import.meta.url)

function isPost(value: unknown): value is Post {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.text === 'string' &&
    typeof candidate.time === 'string' &&
    typeof candidate.ts === 'number' &&
    Number.isFinite(candidate.ts)
  )
}

/**
 * 载入种子数据。文件缺失、JSON 非法、顶层不是数组、
 * 任一条目字段不合法 —— 一律降级为空数组，绝不抛错。
 * 参数化路径便于测试指向临时文件。
 */
export async function loadSeed(source: string | URL = DEFAULT_SEED_URL): Promise<Post[]> {
  try {
    const raw = await readFile(source, 'utf8')
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    if (!parsed.every(isPost)) return []

    return parsed.map((post) => ({
      id: post.id,
      text: post.text,
      time: post.time,
      ts: post.ts,
    }))
  } catch {
    return []
  }
}
