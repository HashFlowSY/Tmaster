# 01 — 统一 API 响应信封

**What to build:** 一份全仓一致、前后端共享的 API 数据契约。改造后，任何 API 调用成功都返回 `{ data: T }`、失败都返回 `{ error: { code, message, fields? } }`（二者互斥）；`code` 是 `@tianji/shared` 的联合枚举，`message` 为面向命主的中文，`fields` 承载字段级校验错误。zod 校验失败与未捕获异常也一律收进统一错误信封。客户端只在 `apiFetch` 一处解包 `.data`、并从错误信封抛出带 `fields` 的 `ApiError`——各屏成功调用代码零改动。聊天 SSE 流保留自身事件协议、不套信封。因客户端集中解包，这是一次**原子的宽重构**：须把全部 JSON 端点一次迁完，中途无法保持端到端可用。决策与取舍见 [ADR-0008](../../../docs/adr/0008-unified-api-response-envelope.md)。

**Blocked by:** None — can start immediately.

**Status:** done —— 全仓信封迁移落地；`pnpm -r typecheck` 通过，`pnpm -r test` 全绿（shared 9 / server 32 / mobile 133）。纯契约+逻辑改造，无真机软门槛，验收全部由自动化缝覆盖。

- [x] `@tianji/shared` 定义成功/错误信封类型（`ApiSuccess<T>` / `ApiErrorBody` + `apiErrorBody()` 构造器）与 `ApiErrorCode` 联合枚举。枚举含上列 7 码，另纳入既有领域码 `birth_required`（八字对话前置，见 ADR-0008 增补条目）。
- [x] 全部 11 个 JSON 端点成功响应包进 `{ data }`（第 12 个端点为 POST messages 的 SSE 流，见下 carve-out）；HTTP 状态码与业务语义不变。
- [x] 服务端 `zJson` 校验失败钩子 → 400 `validation` + `fields`（字段名 → 中文）；`app.onError` 全局兜底 → 500 `internal`；既有 `email_taken`(409) / `invalid_credentials`(401) / `unauthorized`(401) 全部经 `apiErrorBody` 纳入统一信封。
- [x] 客户端 `apiFetch`：2xx 解包 `.data` → `T`；非 2xx 解析 `.error` 抛 `ApiError(status, code, message, fields)`。各屏成功调用无需改动（`endpoints.ts` 未变）。
- [x] 聊天 SSE（`ChatStreamEvent` 的 `delta`/`done`/`error`）不套信封，对话功能不受影响。
- [x] 服务端 app HTTP 缝（`app.test.ts`）覆盖：代表性端点成功 `{data}`（`/me`、chart）、`validation` 400 + `fields`、`email_taken`、`invalid_credentials`、`unauthorized`；客户端 `apiFetch` 缝（新增 `client.test.ts`）覆盖解包与错误抛出（含 `fields` 与无 `fields` 两态）。既有断言旧响应形状的测试（`app.test.ts` / `messages.test.ts`）更新为新契约。
