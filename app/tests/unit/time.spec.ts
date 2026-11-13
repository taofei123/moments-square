import { describe, expect, it } from 'vitest'
import { relTime } from '@/utils/time'

const NOW = new Date('2026-11-13T12:00:00+08:00').getTime()
const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe('relTime', () => {
  it('没有时间戳时返回空字符串', () => {
    expect(relTime(undefined, NOW)).toBe('')
    expect(relTime(0, NOW)).toBe('')
  })

  it('60 秒内显示「刚刚」', () => {
    expect(relTime(NOW, NOW)).toBe('刚刚')
    expect(relTime(NOW - 59 * SECOND, NOW)).toBe('刚刚')
  })

  it('1 分钟到 1 小时内显示「X 分钟前」', () => {
    expect(relTime(NOW - MINUTE, NOW)).toBe('1 分钟前')
    expect(relTime(NOW - 59 * MINUTE, NOW)).toBe('59 分钟前')
  })

  it('1 小时到 1 天内显示「X 小时前」', () => {
    expect(relTime(NOW - HOUR, NOW)).toBe('1 小时前')
    expect(relTime(NOW - 23 * HOUR, NOW)).toBe('23 小时前')
  })

  it('1 天到 30 天内显示「X 天前」', () => {
    expect(relTime(NOW - DAY, NOW)).toBe('1 天前')
    expect(relTime(NOW - 29 * DAY, NOW)).toBe('29 天前')
  })

  it('超过 30 天回退为本地日期文本', () => {
    const ts = new Date('2026-09-01T08:00:00+08:00').getTime()
    expect(relTime(ts, NOW)).toBe(new Date(ts).toLocaleDateString('zh-CN'))
  })
})
