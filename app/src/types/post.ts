/** 一条动态，字段与原后端 posts.json 保持一致 */
export interface Post {
  id: string
  text: string
  time: string
  ts: number
}

/** 单条动态的正文长度上限 */
export const MAX_LEN = 500

export type PublishErrorCode = 'EMPTY' | 'TOO_LONG'

export type PublishResult =
  | { ok: true; post: Post }
  | { ok: false; error: PublishErrorCode }
