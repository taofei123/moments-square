import type { Post } from '@/types/post'

/** 后端错误码到中文提示的映射，未知错误码退回服务端 message */
const ERROR_MESSAGES: Record<string, string> = {
  EMPTY: '内容不能为空',
  TOO_LONG: '内容超出 500 字上限',
  INVALID_JSON: '请求内容格式有误',
  NOT_FOUND: '这条动态已不存在',
}

/** 网络层不可达时的统一文案 */
const NETWORK_MESSAGE = '无法连接后端服务'

/**
 * 统一的接口错误：`status` 为 0 表示请求根本没发出去（网络不通 / 后端未启动），
 * `code` 为后端返回的 `{ error }` 业务码（若有）。
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** 发请求；仅在网络层失败时抛 ApiError，HTTP 状态由调用方判定 */
async function send(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`/api${path}`, init)
  } catch {
    throw new ApiError(NETWORK_MESSAGE, 0)
  }
}

/** 把非 2xx 响应翻译成带中文文案的 ApiError */
async function toApiError(response: Response): Promise<ApiError> {
  let body: { error?: unknown; message?: unknown } | null = null
  try {
    const parsed: unknown = await response.json()
    if (typeof parsed === 'object' && parsed !== null) {
      body = parsed as { error?: unknown; message?: unknown }
    }
  } catch {
    body = null
  }

  if (!body) {
    // 非 JSON 的 5xx 来自 Vite 代理 / 网关（后端不可达时它们返回 HTML 错误页），
    // 语义上等价于「请求根本没到达后端」，统一归一为 status 0。
    if (response.status >= 500) return new ApiError(NETWORK_MESSAGE, 0)
    return new ApiError(`请求失败（HTTP ${response.status}）`, response.status)
  }

  const code = typeof body.error === 'string' ? body.error : undefined
  const serverMessage = typeof body.message === 'string' ? body.message : ''
  const known = code ? ERROR_MESSAGES[code] : undefined
  const message = known ?? (serverMessage || `请求失败（HTTP ${response.status}）`)
  return new ApiError(message, response.status, code)
}

/** 拉取全部动态（后端已按新的在前排序） */
export async function fetchPosts(): Promise<Post[]> {
  const response = await send('/posts')
  if (!response.ok) throw await toApiError(response)

  const body: unknown = await response.json()
  // 后端异常返回对象时在这里拦住，避免列表拿到非数组在渲染期炸开
  if (!Array.isArray(body)) throw new ApiError('响应格式异常', response.status)
  return body as Post[]
}

/** 新建一条动态，成功时返回后端补全 id/time/ts 后的实体 */
export async function createPost(text: string): Promise<Post> {
  const response = await send('/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!response.ok) throw await toApiError(response)
  return (await response.json()) as Post
}

/** 删除一条动态，成功返回 200 `{ ok: true }` 即可 */
export async function deletePost(id: string): Promise<void> {
  const response = await send(`/posts/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!response.ok) throw await toApiError(response)
}
