const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * 把时间戳格式化为相对时间，`now` 可注入以便测试。
 * 无时间戳时返回空字符串，由调用方回退到原始时间文本。
 */
export function relTime(
  ts: number | null | undefined,
  now: number = Date.now(),
): string {
  if (!ts) return ''

  const diff = now - ts
  if (diff < MINUTE) return '刚刚'

  const minutes = Math.floor(diff / MINUTE)
  if (minutes < 60) return `${minutes} 分钟前`

  const hours = Math.floor(diff / HOUR)
  if (hours < 24) return `${hours} 小时前`

  const days = Math.floor(diff / DAY)
  if (days < 30) return `${days} 天前`

  return new Date(ts).toLocaleDateString('zh-CN')
}
