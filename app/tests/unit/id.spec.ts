import { describe, expect, it, vi } from 'vitest'
import { createPostId } from '@/utils/id'

describe('createPostId', () => {
  it('格式为毫秒时间戳 + 4 位小写十六进制', () => {
    const id = createPostId(1794537613095)
    expect(id).toMatch(/^1794537613095[0-9a-f]{4}$/)
    expect(id).toHaveLength(17)
  })

  it('随机因子可注入，便于确定性断言', () => {
    expect(createPostId(1794537613095, () => 0)).toBe('17945376130950000')
    expect(createPostId(1794537613095, () => 0.5)).toBe('17945376130958000')
  })

  it('默认使用当前时间，可据此保证新旧动态排序', () => {
    const before = Date.now()
    const id = createPostId()
    const ts = Number(id.slice(0, -4))
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(Date.now())
  })

  it('相同毫秒内也不会生成重复 id', () => {
    let step = 0
    const ids = new Set(
      Array.from({ length: 200 }, () => createPostId(1794537613095, () => step++ / 1000)),
    )
    expect(ids.size).toBe(200)
  })

  it('默认从 Math.random 取随机后缀', () => {
    const spy = vi.spyOn(Math, 'random')
    createPostId(1)
    expect(spy).toHaveBeenCalled()
  })
})
