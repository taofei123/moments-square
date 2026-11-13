# 心情日志（Vue 3 + Pinia + Local Storage）

原 `d:/Codebuddy/index.html`（原生 JS）+ `server.py`（Python 后端读写 posts.json）的「动态广场」，
按 TDD 方式改写为纯前端工程：**Vue 3 + TypeScript + Pinia + Vite**，数据改为浏览器 **Local Storage**，
不再需要任何后端服务。当前已更名为「心情日志」，并加入极光背景与活泼微动效。

## 快速开始

```bash
cd d:/Codebuddy/app
npm install          # 安装依赖
npm run dev          # 启动开发服务器（默认 http://localhost:5173）
npm test             # 运行全部测试（98 个用例）
npm run typecheck    # vue-tsc 类型检查
npm run build        # 类型检查 + 生产构建到 dist/
```

## 功能

- **发布心情**：实时字数统计 `0 / 500`；达到 450 字转橙色提醒；超过 500 字转红色并禁用发布；
  空白内容不可发布；发布后新内容置顶、输入框清空；支持 `Ctrl/Cmd + Enter` 快捷发布。
- **心情列表**：渐变头像（由 id 稳定推导）、昵称「动态用户」、相对时间
  （刚刚 / X 分钟前 / X 小时前 / X 天前 / 日期）、正文保留换行。
- **删除**：即时删除并持久化。
- **导出备份**：下载 `posts-YYYY-MM-DD.json`，两空格缩进的格式化 JSON。
- **空状态**：无数据时展示插画与「还没有动态，发布第一条吧～」。
- **本地持久化**：所有变更写入 Local Storage（key 为 `moments.posts.v1`）；
  首次访问且本地为空时，用旧 `posts.json` 的两条动态作为种子数据；
  本地数据损坏 / 存储不可用时降级为空列表或提示写入失败，不会白屏。

## 视觉与动效

在紫蓝品牌色（`#5B6CFF` → `#845EF7`）不变的前提下，增加三层视觉：

| 层 | 实现 | 内容 |
| --- | --- | --- |
| 背景层 | `body::before` / `body::after` | 多层 `radial-gradient` 极光缓慢流动（22s）+ `aurora-glow.jpg` 以 `soft-light` 叠加、呼吸淡入（18s） |
| 装饰层 | `AmbientDecor.vue` | 3 个模糊光斑漂移（21-29s）+ 4 颗错峰闪烁星点；`position: fixed`、`pointer-events: none`、`aria-hidden="true"` |
| 内容层 | 各组件 scoped 样式 | 顶栏渐变流动 + logo 呼吸、卡片错峰浮入、hover 彩色光晕与头像放大、主按钮光泽扫过、计数器数字弹跳、空状态插画漂浮 |

素材说明：

- `src/assets/illustrations/empty-garden.jpg`（约 24 KB）—— 空状态插画，AI 生成后裁掉水印边角并压缩。
- `src/assets/textures/aurora-glow.jpg`（约 39 KB）—— 极光星尘纹理，用于背景与顶栏叠加。

动效全部由 CSS 驱动（AI 生成的是静态图，没有引入 GIF/视频），且遵循：

- 只有 `transform` / `opacity` / `box-shadow` 参与动画，避免触发布局重排；
- `prefers-reduced-motion: reduce` 时由 `main.css` 统一关闭动画与过渡；
- 移动端（≤600px）缩小光斑模糊半径并隐藏星点，减少合成开销。

## 目录结构

```
app/
├── index.html                 # Vite 入口（title: 心情日志）
├── vite.config.ts             # Vue 插件 + Vitest（jsdom）配置
├── tsconfig.json              # TS 严格配置
├── tests/
│   ├── setup.ts               # 每个用例前清空 localStorage
│   ├── unit/                  # time / avatar / id / format / download
│   ├── storage/               # postStorage 读写与降级
│   ├── stores/                # posts store（hydrate/publish/remove/export）
│   └── components/            # 组件与 App 集成测试（含 AmbientDecor）
└── src/
    ├── main.ts                # createApp + createPinia
    ├── App.vue                # 页面组装、装饰层、导出备份
    ├── assets/
    │   ├── main.css           # 设计变量、极光背景、按钮光泽、reduced-motion
    │   ├── illustrations/     # 空状态插画
    │   └── textures/          # 极光纹理
    ├── components/            # AppHeader / PostComposer / PostList / PostItem / EmptyState / AmbientDecor
    ├── stores/posts.ts        # 唯一数据源：校验、置顶插入、删除、持久化
    ├── storage/postStorage.ts # localStorage 适配层（安全解析 + 降级）
    ├── data/seedPosts.ts      # 首访种子数据（来自旧 posts.json）
    ├── types/post.ts          # Post / MAX_LEN / PublishResult
    └── utils/                 # time / avatar / id / format / download
```

## TDD 实践

分层由内向外，每层都先写失败测试再补实现：

1. `utils`：相对时间分档、头像哈希、id 规则、时间格式化、下载工具。
2. `storage`：缺失 key、损坏 JSON、非数组、脏条目、配额溢出、种子灌入一次性。
3. `stores`：hydrate 幂等、trim 校验、500 字边界、置顶顺序、删除、导出快照、写入失败降级。
4. `components`：字数分级与快捷键、相对时间渲染、HTML 注入防护、空状态、事件透传。
5. 视觉层：装饰层元素数量与 `aria-hidden`、插画 `src`/`alt`、计数弹跳类（fake timers）。
6. `App`：首屏种子、标题文本、发布/删除落盘、跨会话读回、导出下载、存储异常提示。

## 与旧版的关系

根目录的 `index.html`、`server.py`、`posts.json` **保持原样未改动**，可作为旧版本参考；
新工程完全独立在 `app/` 内，运行不依赖 Python 或 8000 端口。
