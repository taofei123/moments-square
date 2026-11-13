import { describe, expect, it } from 'vitest'
import { formatTime } from '@/utils/format'

describe('formatTime', () => {
  it('输出本地时间 YYYY-MM-DD HH:mm:ss', () => {
    const ts = new Date(2026, 10, 13, 10, 40, 13).getTime()
    expect(formatTime(ts)).toBe('2026-11-13 10:40:13')
  })

  it('月/日/时/分/秒均补零', () => {
    const ts = new Date(2026, 0, 5, 9, 3, 4).getTime()
    expect(formatTime(ts)).toBe('2026-01-05 09:03:04')
  })

  it('使用本地时区而非 UTC', () => {
    const date = new Date(2026, 6, 1, 0, 30, 0)
    expect(formatTime(date.getTime())).toBe('2026-07-01 00:30:00')
  })
})
