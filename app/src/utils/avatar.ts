export const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#ff9a9e,#fad0c4)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#84fab0,#8fd3f4)',
  'linear-gradient(135deg,#ffecd2,#fcb69f)',
  'linear-gradient(135deg,#5b6cff,#845ef7)',
  'linear-gradient(135deg,#f6d365,#fda085)',
] as const

const FALLBACK_CHAR = '动'

/** 由 id 稳定推导头像渐变，保证同一条动态每次渲染颜色一致 */
export function avatarFor(id: string): string {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length] ?? AVATAR_GRADIENTS[0]
}

/** 头像里展示的字符：正文首字，正文为空时回退 */
export function firstChar(text: string): string {
  return text.charAt(0) || FALLBACK_CHAR
}
