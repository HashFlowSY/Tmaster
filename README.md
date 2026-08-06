# 天机 (Tmaster)

四柱八字 / 奇门遁甲 命理 App。pnpm monorepo，TypeScript 全栈。

- `apps/mobile` — Expo SDK 57 + Expo Router 移动端（Android APK 经 EAS 构建）
- `apps/server` — Hono + better-sqlite3 + Drizzle 后端
- `packages/shared` — 前后端共用的 zod schema（单一真源）与真太阳时校正

领域语言见 [`CONTEXT.md`](./CONTEXT.md)，关键架构决策见 [`docs/adr/`](./docs/adr/)。

## 环境要求

- Node **22**（见 `.nvmrc`）。原生模块 `better-sqlite3` 需与 Node 版本匹配；
  仓库锁定 `better-sqlite3@13`（Node-API 预编译，跨 Node 版本可用）。
- pnpm 11+

## 快速开始

```bash
pnpm install
```

### 后端

```bash
cp apps/server/.env.example apps/server/.env   # 填入 DEEPSEEK_API_KEY、JWT_SECRET 等
pnpm --filter @tianji/server db:generate        # 生成迁移（schema 变更后）
pnpm server                                     # 启动，默认 http://0.0.0.0:8787
```

启动顺序：校验 env → 打开 SQLite(WAL) → 自动跑迁移 → 挂路由 → 监听。

### 移动端

```bash
cp apps/mobile/.env.example apps/mobile/.env    # EXPO_PUBLIC_API_URL 指向后端局域网地址
pnpm mobile                                     # expo start
```

手机与后端需在同一 WiFi。生产 APK 的地址由 `apps/mobile/eas.json` 各 profile 的
`EXPO_PUBLIC_API_URL` 注入；IP 变更需重新构建（见 ADR 0002）。

## 校验

```bash
pnpm -r typecheck
pnpm -r test
```

## 待定

- DeepSeek 历史注入窗口与每用户用量上限（代码中标记 `TODO(Q13)`）。
