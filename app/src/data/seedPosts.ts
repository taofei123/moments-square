import type { Post } from '@/types/post'

/**
 * 首次访问（本地无数据）时的初始动态。
 * 内容来自旧版 posts.json，保留原 id / ts 以维持头像与时间展示一致。
 */
export const SEED_POSTS: readonly Post[] = [
  {
    id: '1794537613095c8f2',
    text: "k'm'k'l",
    time: '2026-11-13 10:40:13',
    ts: 1794537613095,
  },
  {
    id: '1794536394087e30e',
    text: '你今天心情如何',
    time: '2026-11-13 10:19:54',
    ts: 1794536394087,
  },
]
