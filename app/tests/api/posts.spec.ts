import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, createPost, deletePost, fetchPosts } from '@/api/posts'
import type { Post } from '@/types/post'

const post: Post = {
  id: '1794537613095c8f2',
  text: "k'm'k'l",
  time: '2026-11-13 10:40:13',
  ts: 1794537613095,
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchPosts', () => {
  it('GET /api/posts 并返回数组', async () => {
    fetchMock.mockResolvedValue(jsonResponse([post]))

    await expect(fetchPosts()).resolves.toEqual([post])
    expect(fetchMock).toHaveBeenCalledWith('/api/posts', undefined)
  })

  it('响应不是数组时抛「响应格式异常」，避免渲染期拿到非数组', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ posts: [post] }))

    const error = await fetchPosts().catch((reason: unknown) => reason)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ message: '响应格式异常', status: 200 })
  })

  it('网络不可达时抛 status 为 0 的 ApiError', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(fetchPosts()).rejects.toMatchObject({
      message: '无法连接后端服务',
      status: 0,
    })
  })

  it('500 且响应为 JSON 时保留 500 状态与后端 message（不误判为连接失败）', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'INTERNAL', message: '服务内部错误' }, 500))

    await expect(fetchPosts()).rejects.toMatchObject({
      message: '服务内部错误',
      status: 500,
      code: 'INTERNAL',
    })
  })

  it('后端未启动：代理返回 5xx 非 JSON 时归一为 status 0 的连接失败', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>proxy error</html>', {
        status: 500,
        headers: { 'content-type': 'text/html' },
      }),
    )

    const error = await fetchPosts().catch((reason: unknown) => reason)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ message: '无法连接后端服务', status: 0 })
  })
})

describe('createPost', () => {
  it('POST 正文为 { text }，201 时返回新建实体', async () => {
    fetchMock.mockResolvedValue(jsonResponse(post, 201))

    await expect(createPost('你好')).resolves.toEqual(post)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/posts',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: '你好' }),
      }),
    )
  })

  it('400 EMPTY 翻译成中文提示并带上 code', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'EMPTY' }, 400))

    await expect(createPost('')).rejects.toMatchObject({
      message: '内容不能为空',
      status: 400,
      code: 'EMPTY',
    })
  })
})

describe('deletePost', () => {
  it('DELETE /api/posts/:id，200 时不抛错', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }))

    await expect(deletePost('a1')).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith('/api/posts/a1', { method: 'DELETE' })
  })

  it('404 NOT_FOUND 翻译成「这条动态已不存在」', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'NOT_FOUND' }, 404))

    await expect(deletePost('a1')).rejects.toMatchObject({
      message: '这条动态已不存在',
      status: 404,
      code: 'NOT_FOUND',
    })
  })
})
