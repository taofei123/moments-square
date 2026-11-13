import { Hono } from 'hono'
import type { Post, PublishResult } from '../src/types/post'
import { addPost, getPost, listPosts, removePost } from './store'

/** 路由层依赖的最小仓库契约：默认用内存实现，测试可注入异常实现 */
export interface PostStore {
  listPosts(): Post[]
  getPost(id: string): Post | undefined
  addPost(text: string, now?: number): PublishResult
  removePost(id: string): boolean
}

const memoryStore: PostStore = { listPosts, getPost, addPost, removePost }

/** 创建 Hono 应用：薄 HTTP 层，只做参数解析、状态码与错误码映射 */
export function createApp(store: PostStore = memoryStore): Hono {
  const app = new Hono()

  // 统一兜底：异常原文只进日志，响应体固定文案，避免泄漏内部实现细节
  app.onError((error, c) => {
    console.error('[api]', error)
    return c.json({ error: 'INTERNAL', message: '服务内部错误' }, 500)
  })

  app.get('/health', (c) => c.json({ ok: true }))

  app.get('/api/posts', (c) => c.json(store.listPosts()))

  app.get('/api/posts/:id', (c) => {
    const post = store.getPost(c.req.param('id'))
    if (!post) return c.json({ error: 'NOT_FOUND' }, 404)
    return c.json(post)
  })

  app.post('/api/posts', async (c) => {
    let payload: unknown
    try {
      payload = await c.req.json()
    } catch {
      return c.json({ error: 'INVALID_JSON' }, 400)
    }

    if (typeof payload !== 'object' || payload === null) {
      return c.json({ error: 'INVALID_JSON' }, 400)
    }

    const text = (payload as { text?: unknown }).text
    if (typeof text !== 'string') return c.json({ error: 'INVALID_JSON' }, 400)

    const result = store.addPost(text)
    if (!result.ok) return c.json({ error: result.error }, 400)
    return c.json(result.post, 201)
  })

  app.delete('/api/posts/:id', (c) => {
    if (!store.removePost(c.req.param('id'))) return c.json({ error: 'NOT_FOUND' }, 404)
    return c.json({ ok: true })
  })

  return app
}

/** 与 server/index.ts 共用的默认实例 */
export const app = createApp()
