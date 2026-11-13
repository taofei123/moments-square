import { afterEach, beforeEach, vi } from 'vitest'

beforeEach(() => {
  // 后端用例运行在 node 环境，没有 window，需要守卫
  if (typeof window !== 'undefined') {
    window.localStorage.clear()
  }
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
