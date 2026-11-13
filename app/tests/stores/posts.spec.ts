import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, createPost, deletePost, fetchPosts } from '@/api/posts'
import { usePostsStore } from '@/stores/posts'
import { MAX_LEN, type Post } from '@/types/post'

// 保留真实的 ApiError，只替换三个请求函数，便于用同一个类构造错误
vi.mock('@/api/posts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/posts')>()
  return {
    ...actual,
    fetchPosts: vi.fn(),
    createPost: vi.fn(),
    deletePost: vi.fn(),
  }
})

const fetchPostsMock = vi.mocked(fetchPosts)
const createPostMock = vi.mocked(createPost)
const deletePostMock = vi.mocked(deletePost)

const seed: Post[] = [
  {
    id: '1794537613095c8f2',
    text: "k'm'k'l",
    time: '2026-11-13 10:40:13',
    ts: 1794537613095,
  },
  {
    id: '1794536394087e30e',
    text: '你今天心情如何',
    time: '2026-11-13 10:19:54',
    ts: 1794536394087,
  },
]

function freshSeed(): Post[] {
  return seed.map((post) => ({ ...post }))
}

beforeEach(() => {
  setActivePinia(createPinia())
  fetchPostsMock.mockResolvedValue(freshSeed())
})

describe('初始状态', () => {
  it('未调用 load 时为空列表且 status 为 idle', () => {
    const store = usePostsStore()

    expect(store.posts).toEqual([])
    expect(store.status).toBe('idle')
    expect(store.errorMessage).toBe('')
    expect(store.count).toBe(0)
    expect(store.isEmpty).toBe(true)
  })
})

describe('load', () => {
  it('成功时用后端数据填充列表并切到 ready', async () => {
    const store = usePostsStore()

    const loading = store.load()
    expect(store.status).toBe('loading')
    await loading

    expect(fetchPostsMock).toHaveBeenCalledTimes(1)
    expect(store.posts.map((post) => post.id)).toEqual(seed.map((post) => post.id))
    expect(store.status).toBe('ready')
    expect(store.errorMessage).toBe('')
    expect(store.count).toBe(2)
    expect(store.isEmpty).toBe(false)
  })

  it('失败时 status 为 error 且写入可读错误信息，列表不变', async () => {
    const store = usePostsStore()
    fetchPostsMock.mockRejectedValue(new Error('无法连接后端服务'))

    await store.load()

    expect(store.status).toBe('error')
    expect(store.errorMessage).toBe('无法连接后端服务')
    expect(store.posts).toEqual([])
  })

  it('失败后再次成功会清空上一次的错误信息', async () => {
    const store = usePostsStore()
    fetchPostsMock.mockRejectedValueOnce(new Error('服务异常，请稍后重试'))

    await store.load()
    expect(store.errorMessage).toBe('服务异常，请稍后重试')

    await store.load()

    expect(store.status).toBe('ready')
    expect(store.errorMessage).toBe('')
    expect(store.posts).toHaveLength(2)
  })
})

describe('publish', () => {
  it('空白内容直接返回 EMPTY，不请求后端', async () => {
    const store = usePostsStore()
    await store.load()

    await expect(store.publish('')).resolves.toEqual({ ok: false, error: 'EMPTY' })
    await expect(store.publish('   \n  ')).resolves.toEqual({ ok: false, error: 'EMPTY' })

    expect(createPostMock).not.toHaveBeenCalled()
    expect(store.posts).toHaveLength(2)
  })

  it('超过 500 字返回 TOO_LONG，不请求后端', async () => {
    const store = usePostsStore()
    await store.load()

    const result = await store.publish('字'.repeat(MAX_LEN + 1))

    expect(result).toEqual({ ok: false, error: 'TOO_LONG' })
    expect(createPostMock).not.toHaveBeenCalled()
    expect(store.posts).toHaveLength(2)
  })

  it('成功时把后端返回的动态置顶并返回 post', async () => {
    const store = usePostsStore()
    await store.load()
    const created: Post = {
      id: '1794538000000abcd',
      text: '全新的动态',
      time: '2026-11-13 12:00:00',
      ts: 1794538000000,
    }
    createPostMock.mockResolvedValue(created)

    const result = await store.publish('  全新的动态  ')

    expect(createPostMock).toHaveBeenCalledWith('全新的动态')
    expect(result).toEqual({ ok: true, post: created })
    expect(store.posts[0].id).toBe(created.id)
    expect(store.posts).toHaveLength(3)
  })

  it('恰好 500 字可以发布', async () => {
    const store = usePostsStore()
    await store.load()
    createPostMock.mockResolvedValue({
      id: 'x',
      text: '字'.repeat(MAX_LEN),
      time: '2026-11-13 12:00:00',
      ts: 1794538000000,
    })

    const result = await store.publish('字'.repeat(MAX_LEN))

    expect(result.ok).toBe(true)
    expect(store.posts[0].text).toHaveLength(MAX_LEN)
  })

  it('请求失败时返回 NETWORK 并保留原列表、写入错误信息', async () => {
    const store = usePostsStore()
    await store.load()
    createPostMock.mockRejectedValue(new Error('无法连接后端服务'))

    const result = await store.publish('发不出去的内容')

    expect(result).toEqual({ ok: false, error: 'NETWORK' })
    expect(store.errorMessage).toBe('无法连接后端服务')
    expect(store.posts).toHaveLength(2)
  })
})

describe('remove', () => {
  it('成功后调用 DELETE 并移除该条，返回 true', async () => {
    const store = usePostsStore()
    await store.load()
    deletePostMock.mockResolvedValue(undefined)

    await expect(store.remove(seed[0].id)).resolves.toBe(true)

    expect(deletePostMock).toHaveBeenCalledWith(seed[0].id)
    expect(store.posts.map((post) => post.id)).toEqual([seed[1].id])
  })

  it('失败时返回 false、保留列表并写入错误信息', async () => {
    const store = usePostsStore()
    await store.load()
    deletePostMock.mockRejectedValue(new Error('这条动态已不存在'))

    await expect(store.remove(seed[0].id)).resolves.toBe(false)

    expect(store.errorMessage).toBe('这条动态已不存在')
    expect(store.posts).toHaveLength(2)
  })

  it('可以删到空列表', async () => {
    const store = usePostsStore()
    await store.load()
    deletePostMock.mockResolvedValue(undefined)

    await store.remove(seed[0].id)
    await store.remove(seed[1].id)

    expect(store.isEmpty).toBe(true)
    expect(store.count).toBe(0)
  })
})

describe('exportPosts', () => {
  it('导出当前全部动态，顺序与列表一致', async () => {
    const store = usePostsStore()
    await store.load()

    const exported = store.exportPosts()

    expect(exported).toEqual(seed)
    expect(exported.map((post) => post.id)).toEqual(store.posts.map((post) => post.id))
  })

  it('返回深拷贝快照，外部修改不影响 store 状态', async () => {
    const store = usePostsStore()
    await store.load()

    const exported = store.exportPosts()
    exported[0].text = '被改坏了'

    expect(store.posts[0].text).toBe(seed[0].text)
  })
})

describe('isNetworkError', () => {
  it('网络层失败（status 0）时为 true', async () => {
    const store = usePostsStore()
    fetchPostsMock.mockRejectedValue(new ApiError('无法连接后端服务', 0))

    await store.load()

    expect(store.isNetworkError).toBe(true)
  })

  it('服务端返回错误码时为 false，用于区分运维提示', async () => {
    const store = usePostsStore()
    fetchPostsMock.mockRejectedValue(new ApiError('服务异常，请稍后重试', 500))

    await store.load()

    expect(store.status).toBe('error')
    expect(store.isNetworkError).toBe(false)
  })

  it('非 ApiError 的意外异常按连接问题处理', async () => {
    const store = usePostsStore()
    fetchPostsMock.mockRejectedValue(new TypeError('boom'))

    await store.load()

    expect(store.isNetworkError).toBe(true)
  })

  it('删除返回 404 时为 false，发布网络失败时为 true', async () => {
    const store = usePostsStore()
    await store.load()

    deletePostMock.mockRejectedValue(new ApiError('这条动态已不存在', 404, 'NOT_FOUND'))
    await store.remove(seed[0].id)
    expect(store.isNetworkError).toBe(false)

    createPostMock.mockRejectedValue(new ApiError('无法连接后端服务', 0))
    await store.publish('发不出去')
    expect(store.isNetworkError).toBe(true)
  })
})

describe('clearError', () => {
  it('清空错误信息', async () => {
    const store = usePostsStore()
    fetchPostsMock.mockRejectedValue(new Error('无法连接后端服务'))
    await store.load()

    store.clearError()

    expect(store.errorMessage).toBe('')
  })
})
