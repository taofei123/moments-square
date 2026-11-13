import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEY, loadPosts } from '@/storage/postStorage'
import { usePostsStore } from '@/stores/posts'
import { MAX_LEN, type Post } from '@/types/post'

const NOW = new Date(2026, 10, 13, 12, 0, 0).getTime()

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

function setup() {
  const store = usePostsStore()
  store.hydrate(seed)
  return store
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('hydrate', () => {
  it('首次启动灌入种子数据并持久化', () => {
    const store = setup()

    expect(store.posts).toHaveLength(2)
    expect(store.posts[0].id).toBe(seed[0].id)
    expect(loadPosts()).toHaveLength(2)
  })

  it('重复调用不会重复灌入或覆盖已有数据', () => {
    const store = setup()
    store.publish('新动态', NOW)

    store.hydrate(seed)

    expect(store.posts).toHaveLength(3)
  })

  it('本地已有数据时优先使用本地数据', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([seed[1]]))

    const store = usePostsStore()
    store.hydrate(seed)

    expect(store.posts.map((post) => post.id)).toEqual([seed[1].id])
  })

  it('hydrate 之前列表为空，hydrate 之后才可发布', () => {
    const store = usePostsStore()
    expect(store.isEmpty).toBe(true)

    store.hydrate(seed)
    expect(store.isEmpty).toBe(false)
  })
})

describe('publish', () => {
  it('新动态插入到列表头部，并补齐 id/time/ts', () => {
    const store = setup()

    const result = store.publish('  今天天气不错  ', NOW)

    expect(result.ok).toBe(true)
    expect(store.posts).toHaveLength(3)
    const [latest] = store.posts
    expect(latest.text).toBe('今天天气不错')
    expect(latest.ts).toBe(NOW)
    expect(latest.time).toBe('2026-11-13 12:00:00')
    expect(latest.id).toMatch(new RegExp(`^${NOW}[0-9a-f]{4}$`))
  })

  it('发布后立即写入 localStorage', () => {
    const store = setup()

    store.publish('会落盘的内容', NOW)

    expect(loadPosts()[0].text).toBe('会落盘的内容')
  })

  it('空白内容拒绝发布且不改变列表', () => {
    const store = setup()

    expect(store.publish('', NOW)).toEqual({ ok: false, error: 'EMPTY' })
    expect(store.publish('   \n  ', NOW)).toEqual({ ok: false, error: 'EMPTY' })
    expect(store.posts).toHaveLength(2)
  })

  it('超过 500 字拒绝发布且不落盘', () => {
    const store = setup()

    const result = store.publish('字'.repeat(MAX_LEN + 1), NOW)

    expect(result).toEqual({ ok: false, error: 'TOO_LONG' })
    expect(store.posts).toHaveLength(2)
    expect(loadPosts()).toHaveLength(2)
  })

  it('恰好 500 字可以发布', () => {
    const store = setup()

    const result = store.publish('字'.repeat(MAX_LEN), NOW)

    expect(result.ok).toBe(true)
    expect(store.posts[0].text).toHaveLength(MAX_LEN)
  })

  it('保留正文中的换行', () => {
    const store = setup()

    store.publish('第一行\n第二行', NOW)

    expect(store.posts[0].text).toBe('第一行\n第二行')
  })

  it('存储写入失败时置位 storageError，但当前会话内容不丢失', () => {
    const store = setup()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })

    const result = store.publish('超大内容', NOW)

    expect(result.ok).toBe(true)
    expect(store.posts).toHaveLength(3)
    expect(store.storageError).toBe(true)
  })

  it('后续写入成功后清除 storageError', () => {
    const store = setup()
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('quota', 'QuotaExceededError')
      })

    store.publish('失败一次', NOW)
    expect(store.storageError).toBe(true)

    setItem.mockRestore()
    store.publish('恢复后成功', NOW)

    expect(store.storageError).toBe(false)
  })
})

describe('remove', () => {
  it('按 id 删除并立即持久化', () => {
    const store = setup()

    expect(store.remove(seed[0].id)).toBe(true)
    expect(store.posts.map((post) => post.id)).toEqual([seed[1].id])
    expect(loadPosts().map((post) => post.id)).toEqual([seed[1].id])
  })

  it('删除不存在的 id 时返回 false 且列表不变', () => {
    const store = setup()

    expect(store.remove('not-exist')).toBe(false)
    expect(store.posts).toHaveLength(2)
  })

  it('可以删到空列表', () => {
    const store = setup()

    store.remove(seed[0].id)
    store.remove(seed[1].id)

    expect(store.isEmpty).toBe(true)
    expect(loadPosts()).toEqual([])
  })
})

describe('exportPosts', () => {
  it('导出当前全部动态，顺序与列表一致', () => {
    const store = setup()

    const exported = store.exportPosts()

    expect(exported.map((post) => post.id)).toEqual(store.posts.map((post) => post.id))
  })

  it('返回快照副本，外部修改不影响 store 状态', () => {
    const store = setup()

    const exported = store.exportPosts()
    exported[0].text = '被改坏了'

    expect(store.posts[0].text).toBe(seed[0].text)
  })
})

describe('computed', () => {
  it('count 与 isEmpty 随列表变化', () => {
    const store = usePostsStore()
    expect(store.count).toBe(0)
    expect(store.isEmpty).toBe(true)

    store.hydrate(seed)
    expect(store.count).toBe(2)
    expect(store.isEmpty).toBe(false)
  })
})
