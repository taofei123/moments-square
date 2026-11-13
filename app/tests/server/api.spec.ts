// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_LEN, type Post } from '../../src/types/post'
import { app, createApp } from '../../server/app'
import { listPosts, resetStore, seedStore } from '../../server/store'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

function sample(id: string, ts: number, text = `内容-${id}`): Post {
  return { id, text, time: '2026-11-13 00:00:00', ts }
}

function publish(body: string) {
  return app.request('/api/posts', {
    method: 'POST',
    headers: JSON_HEADERS,
    body,
  })
}

describe('GET /health', () => {
  it('返回 200 与 { ok: true }', async () => {
    const res = await app.request('/health')

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })
  })
})

describe('GET /api/posts', () => {
  beforeEach(() => {
    resetStore([])
  })

  it('没有数据时返回 200 与空数组', async () => {
    const res = await app.request('/api/posts')

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual([])
  })

  it('按新的在前的顺序返回全部动态', async () => {
    seedStore([sample('older', 1_000), sample('newer', 2_000)])

    const res = await app.request('/api/posts')

    expect(res.status).toBe(200)
    const body = (await res.json()) as Post[]
    expect(body.map((post) => post.id)).toEqual(['newer', 'older'])
  })

  it('底层仓库抛错时返回 500 固定文案，不泄漏异常原文，并记录一次日志', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const broken = createApp({
      listPosts: () => {
        throw new Error('boom-secret')
      },
      getPost: () => undefined,
      addPost: () => ({ ok: false, error: 'EMPTY' }),
      removePost: () => false,
    })

    const res = await broken.request('/api/posts')

    expect(res.status).toBe(500)
    const body = (await res.json()) as { error: string; message: string }
    expect(body).toEqual({ error: 'INTERNAL', message: '服务内部错误' })
    expect(JSON.stringify(body)).not.toContain('boom-secret')

    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls[0]![0]).toBe('[api]')
  })

  it('其它路由抛错同样走统一的 onError 兜底', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const broken = createApp({
      listPosts: () => [],
      getPost: () => {
        throw new Error('detail-boom-secret')
      },
      addPost: () => ({ ok: false, error: 'EMPTY' }),
      removePost: () => false,
    })

    const res = await broken.request('/api/posts/any-id')

    expect(res.status).toBe(500)
    const body = (await res.json()) as { error: string; message: string }
    expect(body).toEqual({ error: 'INTERNAL', message: '服务内部错误' })
    expect(JSON.stringify(body)).not.toContain('detail-boom-secret')
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })
})

describe('POST /api/posts', () => {
  beforeEach(() => {
    resetStore([])
  })

  it('发布成功返回 201 与新 Post，并置于列表头部', async () => {
    seedStore([sample('existing', 1)])

    const res = await publish(JSON.stringify({ text: '新动态' }))

    expect(res.status).toBe(201)
    const post = (await res.json()) as Post
    expect(post.text).toBe('新动态')
    expect(post.id).toMatch(/^\d+[0-9a-f]{4}$/)
    expect(post.time).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    expect(typeof post.ts).toBe('number')

    expect(listPosts().map((item) => item.id)).toEqual([post.id, 'existing'])
  })

  it('发布时对正文 trim', async () => {
    const res = await publish(JSON.stringify({ text: '  两端有空格  ' }))

    expect(res.status).toBe(201)
    const post = (await res.json()) as Post
    expect(post.text).toBe('两端有空格')
  })

  it('空白正文返回 400 EMPTY', async () => {
    const res = await publish(JSON.stringify({ text: '   ' }))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: 'EMPTY' })
    expect(listPosts()).toEqual([])
  })

  it(`超过 ${MAX_LEN} 字返回 400 TOO_LONG`, async () => {
    const res = await publish(JSON.stringify({ text: 'a'.repeat(MAX_LEN + 1) }))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: 'TOO_LONG' })
    expect(listPosts()).toEqual([])
  })

  it(`恰好 ${MAX_LEN} 字返回 201`, async () => {
    const res = await publish(JSON.stringify({ text: 'a'.repeat(MAX_LEN) }))

    expect(res.status).toBe(201)
    const post = (await res.json()) as Post
    expect(post.text).toHaveLength(MAX_LEN)
  })

  it('非法 JSON 返回 400 INVALID_JSON', async () => {
    const res = await publish('{ oops')

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: 'INVALID_JSON' })
  })

  it('缺少 text 字段返回 400 INVALID_JSON', async () => {
    const res = await publish(JSON.stringify({ notText: 'x' }))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: 'INVALID_JSON' })
  })
})

describe('GET /api/posts/:id', () => {
  beforeEach(() => {
    resetStore([sample('a', 1, '唯一一条')])
  })

  it('命中返回 200 与 Post', async () => {
    const res = await app.request('/api/posts/a')

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual(sample('a', 1, '唯一一条'))
  })

  it('未命中返回 404 NOT_FOUND', async () => {
    const res = await app.request('/api/posts/missing')

    expect(res.status).toBe(404)
    await expect(res.json()).resolves.toEqual({ error: 'NOT_FOUND' })
  })
})

describe('DELETE /api/posts/:id', () => {
  beforeEach(() => {
    resetStore([sample('a', 1), sample('b', 2)])
  })

  it('删除成功返回 200 与 { ok: true }', async () => {
    const res = await app.request('/api/posts/a', { method: 'DELETE' })

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })
    expect(listPosts().map((post) => post.id)).toEqual(['b'])
  })

  it('id 不存在返回 404 NOT_FOUND', async () => {
    const res = await app.request('/api/posts/missing', { method: 'DELETE' })

    expect(res.status).toBe(404)
    await expect(res.json()).resolves.toEqual({ error: 'NOT_FOUND' })
    expect(listPosts()).toHaveLength(2)
  })
})
