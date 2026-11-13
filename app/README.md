# 动态广场（Vue 3 + Pinia + Local Storage）

原 `d:/Codebuddy/index.html`（原生 JS）+ `server.py`（Python 后端读写 posts.json）的「动态广场」，
按 TDD 方式改写为纯前端工程：**Vue 3 + TypeScript + Pinia + Vite**，数据改为浏览器 **Local Storage**，
不再需要任何后端服务。

## 快速开始

```bash
cd d:/Codebuddy/app
npm install          # 安装依赖
npm run dev          # 启动开发服务器（默认 http://localhost:5173）
npm test             # 运行全部测试（89 个用例）
npm run typecheck    # vue-tsc 类型检查
npm run build        # 类型检查 + 生产构建到 dist/
```

## 功能（与原页面完全对齐）

- **发布动态**：实时字数统计 `0 / 500`；达到 450 字转橙色提醒；超过 500 字转红色并禁用发布；
  空白内容不可发布；发布后新动态置顶、输入框清空；支持 `Ctrl/Cmd + Enter` 快捷发布。
- **动态列表**：渐变头像（由 id 稳定推导）、昵称「动态用户」、相对时间
  （刚刚 / X 分钟前 / X 小时前 / X 天前 / 日期）、正文保留换行。
- **删除动态**：即时删除并持久化。
- **导出备份**：下载 `posts-YYYY-MM-DD.json`，两空格缩进的格式化 JSON。
- **空状态**：无数据时展示「还没有动态，发布第一条吧～」。
- **本地持久化**：所有变更写入 Local Storage（key 为 `moments.posts.v1`）；
  首次访问且本地为空时，用旧 `posts.json` 的两条动态作为种子数据；
  本地数据损坏 / 存储不可用时降级为空列表或提示写入失败，不会白屏。

## 目录结构

```
app/
├── index.html                 # Vite 入口
├── vite.config.ts             # Vue 插件 + Vitest（jsdom）配置
├── tsconfig.json              # TS 严格配置
├── tests/
│   ├── setup.ts               # 每个用例前清空 localStorage
│   ├── unit/                  # time / avatar / id / format / download
│   ├── storage/               # postStorage 读写与降级
│   ├── stores/                # posts store（hydrate/publish/remove/export）
│   └── components/            # 组件与 App 集成测试
└── src/
    ├── main.ts                # createApp + createPinia
    ├── App.vue                # 页面组装、导出备份
    ├── assets/main.css        # 设计变量与基础样式（迁移自旧页面）
    ├── components/            # AppHeader / PostComposer / PostList / PostItem / EmptyState
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
5. `App`：首屏种子、发布/删除落盘、跨会话读回、导出下载、存储异常提示。

## 与旧版的关系

根目录的 `index.html`、`server.py`、`posts.json` **保持原样未改动**，可作为旧版本参考；
新工程完全独立在 `app/` 内，运行不依赖 Python 或 8000 端口。
