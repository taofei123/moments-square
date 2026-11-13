import { describe, expect, it, vi } from 'vitest'
import {
  STORAGE_KEY,
  loadOrSeed,
  loadPosts,
  savePosts,
  clearPosts,
} from '@/storage/postStorage'
import type { Post } from '@/types/post'

const postA: Post = {
  id: '1794537613095c8f2',
  text: "k'm'k'l",
  time: '2026-11-13 10:40:13',
  ts: 1794537613095,
}
const postB: Post = {
  id: '1794536394087e30e',
  text: '你今天心情如何',
  time: '2026-11-13 10:19:54',
  ts: 1794536394087,
}

describe('STORAGE_KEY', () => {
  it('使用带版本号的固定 key，避免后续格式演进踩坑', () => {
    expect(STORAGE_KEY).toBe('moments.posts.v1')
  })
})

describe('loadPosts', () => {
  it('未写入过数据时返回空数组', () => {
    expect(loadPosts()).toEqual([])
  })

  it('读回已保存的动态，保持顺序与字段', () => {
    savePosts([postA, postB])
    expect(loadPosts()).toEqual([postA, postB])
  })

  it('空字符串视为无数据', () => {
    window.localStorage.setItem(STORAGE_KEY, '')
    expect(loadPosts()).toEqual([])
  })

  it('JSON 损坏时降级为空数组而不抛错', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not-json')
    expect(() => loadPosts()).not.toThrow()
    expect(loadPosts()).toEqual([])
  })

  it('内容不是数组时降级为空数组', () => {
    window.localStorage.setItem(STORAGE_KEY, '{"posts":[]}')
    expect(loadPosts()).toEqual([])
  })

  it('过滤掉结构非法的条目，保留合法动态', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([postA, { id: 2 }, 'oops', null, { id: 'x', text: 'y' }]),
    )
    expect(loadPosts()).toEqual([postA])
  })

  it('缺少 time 字段时用 ts 推导，保证视图可渲染', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'abc', text: '无时间', ts: new Date(2026, 10, 13, 10, 40, 13).getTime() }]),
    )
    expect(loadPosts()[0].time).toBe('2026-11-13 10:40:13')
  })

  it('读取本身抛错（如隐私模式）时降级为空数组', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    expect(loadPosts()).toEqual([])
  })
})

describe('savePosts', () => {
  it('写入成功返回 true 并落到 localStorage', () => {
    expect(savePosts([postA])).toBe(true)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify([postA]))
  })

  it('写入超额时返回 false 且不抛错', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    expect(savePosts([postA])).toBe(false)
  })
})

describe('clearPosts', () => {
  it('清除后列表为空', () => {
    savePosts([postA])
    clearPosts()
    expect(loadPosts()).toEqual([])
  })
})

describe('loadOrSeed', () => {
  const seed: Post[] = [postA, postB]

  it('首次访问时写入种子数据并返回', () => {
    const loaded = loadOrSeed(seed)

    expect(loaded).toEqual(seed)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(seed))
  })

  it('已有数据时使用本地数据，不被种子覆盖', () => {
    savePosts([postB])

    expect(loadOrSeed(seed)).toEqual([postB])
  })

  it('用户把列表清空后不会再次灌入种子数据', () => {
    savePosts([])

    expect(loadOrSeed(seed)).toEqual([])
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('[]')
  })

  it('本地数据损坏时返回空数组，且不覆盖用户数据', () => {
    window.localStorage.setItem(STORAGE_KEY, 'broken')

    expect(loadOrSeed(seed)).toEqual([])
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('broken')
  })

  it('返回的是副本，修改不会污染存储内容', () => {
    const loaded = loadOrSeed(seed)
    loaded[0].text = '被改坏了'

    expect(loadPosts()[0].text).toBe(postA.text)
  })
})
