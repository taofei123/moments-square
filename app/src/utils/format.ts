function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** 本地时间 YYYY-MM-DD HH:mm:ss，与原后端 time 字段格式一致 */
export function formatTime(ts: number): string {
  const date = new Date(ts)
  const ymd = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const hms = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  return `${ymd} ${hms}`
}
