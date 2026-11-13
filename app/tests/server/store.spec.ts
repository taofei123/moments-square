// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import { MAX_LEN, type Post, type PublishResult } from '../../src/types/post'
import {
  addPost,
  getPost,
  listPosts,
  removePost,
  resetStore,
  seedStore,
} from '../../server/store'

/** 收敛类型：断言发布成功并取回新 Post */
function expectOk(result: PublishResult): Post {
  if (!result.ok) throw new Error(`期望发布成功，实际失败：${result.error}`)
  return result.post
}

function sample(id: string, ts: number, text = `内容-${id}`): Post {
  return { id, text, time: '2026-11-13 00:00:00', ts }
}

describe('server/store', () => {
  beforeEach(() => {
    resetStore([])
  })

  it('初始为空数组', () => {
    expect(listPosts()).toEqual([])
  })

  it('listPosts 返回副本，外部改动不污染内部状态', () => {
    seedStore([sample('a', 1)])

    const first = listPosts()
    first.push(sample('injected', 999))
    first[0]!.text = '被篡改'

    const second = listPosts()
    expect(second).toHaveLength(1)
    expect(second[0]!.text).toBe('内容-a')
  })

  it('getPost 命中返回副本，未命中返回 undefined', () => {
    seedStore([sample('a', 1)])

    const found = getPost('a')
    expect(found).toEqual(sample('a', 1))
    found!.text = '被篡改'
    expect(getPost('a')!.text).toBe('内容-a')

    expect(getPost('missing')).toBeUndefined()
  })

  it('addPost 生成 id / time / ts 并返回新 Post', () => {
    const now = new Date(2026, 0, 2, 3, 4, 5).getTime()
    const post = expectOk(addPost('你好', now))

    expect(post.text).toBe('你好')
    expect(post.ts).toBe(now)
    expect(post.time).toBe('2026-01-02 03:04:05')
    expect(post.id).toMatch(new RegExp(`^${now}[0-9a-f]{4}$`))
    expect(post.id).toHaveLength(String(now).length + 4)
  })

  it('addPost 插入到数组头部（新的在前）', () => {
    const now = 1_800_000_000_000
    expectOk(addPost('第一条', now))
    expectOk(addPost('第二条', now + 1_000))

    expect(listPosts().map((post) => post.text)).toEqual(['第二条', '第一条'])
  })

  it('addPost 对正文做 trim 后入库', () => {
    const post = expectOk(addPost('  有内容  ', 1_800_000_000_000))
    expect(post.text).toBe('有内容')
    expect(listPosts()[0]!.text).toBe('有内容')
  })

  it('addPost 拒绝空白正文并返回 EMPTY', () => {
    expect(addPost('   ')).toEqual({ ok: false, error: 'EMPTY' })
    expect(addPost('')).toEqual({ ok: false, error: 'EMPTY' })
    expect(listPosts()).toEqual([])
  })

  it(`addPost 拒绝超过 ${MAX_LEN} 字的正文并返回 TOO_LONG`, () => {
    const result = addPost('a'.repeat(MAX_LEN + 1))
    expect(result).toEqual({ ok: false, error: 'TOO_LONG' })
    expect(listPosts()).toEqual([])
  })

  it(`addPost 恰好 ${MAX_LEN} 字可通过`, () => {
    const post = expectOk(addPost('a'.repeat(MAX_LEN)))
    expect(post.text).toHaveLength(MAX_LEN)
  })

  it('removePost 命中返回 true，重复删除返回 false', () => {
    seedStore([sample('a', 1), sample('b', 2)])

    expect(removePost('a')).toBe(true)
    expect(listPosts().map((post) => post.id)).toEqual(['b'])
    expect(removePost('a')).toBe(false)
  })

  it('resetStore 覆盖为给定内容并能清空', () => {
    seedStore([sample('a', 1)])
    resetStore([sample('b', 2)])
    expect(listPosts().map((post) => post.id)).toEqual(['b'])

    resetStore()
    expect(listPosts()).toEqual([])
  })

  it('seedStore 按 ts 从新到旧排序', () => {
    const older = sample('older', 1_000)
    const newer = sample('newer', 2_000)
    seedStore([older, newer])

    expect(listPosts().map((post) => post.id)).toEqual(['newer', 'older'])
  })
})
