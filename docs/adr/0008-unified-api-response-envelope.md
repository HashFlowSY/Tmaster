# 统一 API 响应信封:成功 {data} / 错误 {error{code,message,fields?}}

全仓 API 采用统一响应信封:成功一律 `{ data: T }`,错误一律 `{ error: { code, message, fields? } }`,二者互斥。`code` 是 `@tianji/shared` 里的联合枚举(`validation·email_taken·invalid_credentials·unauthorized·not_found·rate_limited·internal`,外加既有领域码 `birth_required`,见下),`message` 为面向命主的中文文案,`fields`(可选)承载字段级校验错误(字段名 → 中文)。服务端补 `zValidator` 失败钩子(把 `ZodError` 扁平化为 `validation` + `fields`,400)与 `app.onError`(兜底 `internal`,500),把此前漏走 `@hono/zod-validator` 默认 `{success,error}` 形状的校验错误也收进信封。客户端只在 `apiFetch` 一处解包 `.data`、并从错误信封抛出带 `fields` 的 `ApiError`。聊天 SSE 流(`ChatStreamEvent` 的 `delta`/`done`/`error`)保留自身事件协议,不套信封。

## Considered Options

- **维持现状(裸 body + 错误信封有破口):被否。** 成功响应是各式裸对象,错误大多是 `{error:{code,message}}` 但 zod 校验 400 漏走库默认的 `{success,error}`,客户端 `ApiError` 解析不到真实信息,「字段级内联错误」无从做起。
- **仅统一错误、成功保持裸 body(方案 A):被否(作为更小改动曾被推荐)。** 能以最小面解决错误不一致,但前后端契约仍不对称,不满足「一份可依赖的统一数据格式」的诉求。
- **全信封(选中)。** 成功也包 `{data}`。代价是触及全部 12 个 JSON 端点 + 共享契约;但客户端集中在 `apiFetch` 解包,使各屏成功路径零改动,把客户端爆炸半径压到一处,迁移因此可控。换来前后端对称、类型安全、单一可依赖契约。

## Consequences

- 改造覆盖 6 个路由文件、12 个 JSON 端点及其在 `@tianji/shared` 的响应 schema;作为独立前置基础工单先行,后续功能建立其上。
- 客户端仅 `apiFetch` 一处改动(解包 `.data` / 解析 `.error`),`endpoints.ts` 与各屏成功调用不变。
- `code` 联合枚举 + `fields` 字段级错误成为前后端共识,直接支撑注册/登录的字段内联错误 UX。
- **SSE 不套信封**——流式事件本就有 `type` 判别的自有协议,强套信封反而割裂;明确排除。
- **`birth_required`(409)一并纳入 `code` 枚举**:它是既有领域前置码(八字对话需先完善生辰,见 `conversations` 路由与 chat 屏对 `err.code` 的分支),不在上列 7 个通用码内。本次信封迁移属「纯外层包裹、不改无关业务语义」,故保留该码并纳入联合枚举以维持类型安全、不留裸魔法串——而非删改它。此后领域码亦按此惯例入枚举。
- 这是一次性全仓约定:此后新端点须遵循信封;若反悔,需再做一次全仓迁移。
- 回归成本低:服务端「app HTTP 缝」一处即可回归全部端点的信封行为(见 `.scratch/auth-registration/spec.md` 测试决策)。
