const HEX_SUFFIX_LENGTH = 4
const HEX_SUFFIX_RANGE = 0x10000

/** 动态 id：毫秒时间戳 + 4 位随机十六进制，保持与原后端生成规则一致 */
export function createPostId(
  now: number = Date.now(),
  random: () => number = Math.random,
): string {
  const suffix = Math.floor(random() * HEX_SUFFIX_RANGE)
    .toString(16)
    .padStart(HEX_SUFFIX_LENGTH, '0')
  return `${now}${suffix}`
}
