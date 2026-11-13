# 心情日志（Vue 3 + Pinia + Hono）

前后端分离的极简心情记录应用：**Vue 3 + TypeScript + Pinia** 前端，**Hono** 后端提供 RESTful API，
数据存放在**服务进程内存**中。界面保留紫蓝品牌色、极光背景与微动效。

> 历史沿革：最初是原生 JS + Python 后端读写 `posts.json`，后改写为纯前端 + Local Storage，
> 现在升级为 Hono 内存存储后端（Local Storage 实现已完全移除）。

## 快速开始

```bash
cd d:/Codebuddy/app
npm install      # 安装依赖
npm run dev      # 一条命令同时启动 API(8787) 与前端(5173)
```

打开 http://localhost:5173 即可，`/api` 请求由 Vite 代理到 `http://127.0.0.1:8787`。

其它脚本：

| 命令 | 说明 |
| --- | --- |
| `npm run dev:api` | 只启动后端（`tsx watch server/index.ts`） |
| `npm run dev:web` | 只启动前端（`vite`） |
| `npm run start:api` | 以非 watch 模式启动后端 |
| `npm test` | 运行全部测试（16 个文件 / 131 个用例） |
| `npm run typecheck` | `vue-tsc` 类型检查 |
| `npm run build` | 类型检查 + 生产构建 |

## 数据存储与生命周期（重要）

- 后端启动时从仓库根 `d:/Codebuddy/posts.json` 载入种子数据到**内存数组**（当前 3 条）。
  文件缺失、JSON 非法、条目字段不合法时静默降级为空列表。
- 运行期的发布 / 删除只改内存，**不落盘**：**重启后端进程后数据会回到种子数据**。
- 前端不再使用 Local Storage；刷新页面不会丢数据（数据在服务端内存里），但重启服务会丢。

## API 契约

| 方法 | 路径 | 成功 | 失败 |
| --- | --- | --- | --- |
| GET | `/api/posts` | 200 `Post[]`（新的在前） | 500 `{ error: 'INTERNAL', message }` |
| GET | `/api/posts/:id` | 200 `Post` | 404 `{ error: 'NOT_FOUND' }` |
| POST | `/api/posts` | 201 `Post` | 400 `{ error: 'EMPTY' \| 'TOO_LONG' \| 'INVALID_JSON' }` |
| DELETE | `/api/posts/:id` | 200 `{ ok: true }` | 404 `{ error: 'NOT_FOUND' }` |
| GET | `/health` | 200 `{ ok: true }` | — |

`Post = { id: string; text: string; time: string; ts: number }`；`id` 为毫秒时间戳 + 4 位十六进制，
`time` 为本地时间 `YYYY-MM-DD HH:mm:ss`。校验规则（trim 后非空、≤ 500 字）在前后端共用
`src/types/post.ts` 的 `MAX_LEN`，前端先做一次本地校验以省掉一次请求。

错误处理：路由层 `app.onError` 统一兜底 —— 异常原文只写日志（`console.error('[api]', error)`），
响应固定为 `500 { error: 'INTERNAL', message: '服务内部错误' }`，不向前端泄漏内部细节。

## 功能

- **发布心情**：实时字数统计 `0 / 500`；450 字转橙色提醒，超 500 字转红并禁用；空白拒绝；
  `Ctrl/Cmd + Enter` 快捷发布；**请求成功才清空草稿**，失败时保留输入；提交中按钮禁用防重复。
- **心情列表**：渐变头像、昵称、相对时间、正文保留换行。
- **删除**：调后端成功后从列表移除。
- **导出备份**：把当前列表导出为 `posts-YYYY-MM-DD.json`（两空格缩进）。
- **错误态**：请求失败展示真实原因（如「这条动态已不存在」）；网络不可达时额外提示
  「请确认后端已启动（npm run dev:api）」，并提供「重试」按钮重新拉取。

## 视觉与动效

紫蓝品牌色（`#5B6CFF` → `#845EF7`）不变，三层视觉：

| 层 | 实现 | 内容 |
| --- | --- | --- |
| 背景层 | `body::before` / `body::after` | 多层径向渐变极光缓慢流动（22s）+ `aurora-glow.jpg` 以 `soft-light` 叠加（18s） |
| 装饰层 | `AmbientDecor.vue` | 3 个模糊光斑漂移 + 4 颗错峰闪烁星点；`pointer-events: none`、`aria-hidden="true"` |
| 内容层 | 组件 scoped 样式 | 顶栏渐变流动与 logo 呼吸、卡片错峰浮入、hover 光晕、按钮光泽、计数弹跳、空状态插画漂浮 |

素材：`src/assets/illustrations/empty-garden.jpg`（24 KB）、`src/assets/textures/aurora-glow.jpg`（39 KB），
均为 AI 生成后裁掉水印边角并压缩。全部动效由 CSS 驱动，`prefers-reduced-motion: reduce` 时静音。

## 目录结构

```
app/
├── index.html                     # Vite 入口（title: 心情日志）
├── vite.config.ts                 # Vue 插件 + /api 代理 + Vitest(jsdom) 配置
├── tsconfig.json                  # TS 严格配置（含 server/）
├── server/                        # 后端（Hono + 内存存储）
│   ├── store.ts                   # 内存仓库：list/get/add/remove/reset/seed，校验与 id/time 生成
│   ├── seed.ts                    # 读取仓库根 posts.json，异常降级为空数组
│   ├── app.ts                     # 路由与错误码映射，onError 统一兜底
│   └── index.ts                   # 监听 127.0.0.1:8787（PORT 可覆盖），启动前播种
├── src/
│   ├── api/posts.ts               # fetch 封装 + ApiError（含"代理 5xx 非 JSON → 服务不可用"归一）
│   ├── stores/posts.ts            # 异步 store：status/errorMessage/isNetworkError + load/publish/remove
│   ├── components/                # AppHeader / PostComposer / PostList / PostItem / EmptyState / AmbientDecor
│   ├── types/post.ts              # Post / MAX_LEN / PublishResult（前后端共享）
│   ├── assets/                    # main.css（设计变量与极光背景）、插画、纹理
│   └── utils/                     # time / avatar / id / format / download
└── tests/
    ├── setup.ts                   # localStorage 清理（带 node 环境守卫）
    ├── server/                    # store / api / seed（@vitest-environment node）
    ├── api/                       # API 客户端（stub fetch）
    ├── stores/                    # store 状态机与错误分支
    ├── components/                # 组件与 App 集成
    └── unit/                      # 工具函数
```

## TDD 实践

严格「先写失败测试再实现」：工具函数 → API 客户端 → store 状态机 → 组件 → 页面集成；
后端按「内存仓库 → 种子加载 → HTTP 路由」由内向外推进，路由层用 Hono 的 `app.request()`
直接断言状态码与响应体，无需监听端口。

## 与旧版的关系

根目录的 `index.html`、`server.py`、`posts.json` 中的前两个文件**保持原样未改动**，可作为早期版本参考；
`posts.json` 现在仅作为后端启动的种子数据源。
