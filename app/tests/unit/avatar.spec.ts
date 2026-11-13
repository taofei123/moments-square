import { describe, expect, it } from 'vitest'
import { AVATAR_GRADIENTS, avatarFor, firstChar } from '@/utils/avatar'

/** 与原 index.html 完全一致的哈希实现，用于交叉验证 */
function hashOf(id: string): number {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

describe('avatarFor', () => {
  it('同一个 id 永远得到相同的渐变', () => {
    const id = '1794537613095c8f2'
    expect(avatarFor(id)).toBe(avatarFor(id))
  })

  it('取值为预设渐变之一，且下标与哈希取模一致', () => {
    const id = '1794536394087e30e'
    const expected = AVATAR_GRADIENTS[hashOf(id) % AVATAR_GRADIENTS.length]
    expect(avatarFor(id)).toBe(expected)
  })

  it('不同 id 会分布到不同渐变上', () => {
    const used = new Set(
      ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => avatarFor(id)),
    )
    expect(used.size).toBeGreaterThan(1)
  })

  it('空 id 回退到第一个渐变而不是 undefined', () => {
    expect(avatarFor('')).toBe(AVATAR_GRADIENTS[0])
  })

  it('渐变库固定为 6 个，保持与原页面一致', () => {
    expect(AVATAR_GRADIENTS).toHaveLength(6)
    expect(AVATAR_GRADIENTS[0]).toBe('linear-gradient(135deg,#ff9a9e,#fad0c4)')
    expect(AVATAR_GRADIENTS[5]).toBe('linear-gradient(135deg,#f6d365,#fda085)')
  })
})

describe('firstChar', () => {
  it('取正文首字符', () => {
    expect(firstChar('你今天心情如何')).toBe('你')
  })

  it('正文为空时回退为「动」', () => {
    expect(firstChar('')).toBe('动')
  })
})
