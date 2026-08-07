# 04 — auth 限流

**What to build:** 保护登录与注册免于暴力破解与批量注册。给 `/api/auth/*` 加一层内存滑动窗口限流：登录每 IP 10 分钟内超过 10 次即被挡；注册每 IP 每小时超过 5 次即被挡；命中一律返回统一信封的 `rate_limited`(429)。阈值与窗口经 env 可调，避免开发/测试期自锁。单进程 `better-sqlite3` 服务器用内存计数即可，不引 Redis（与 ADR-0003「v1 单机」一致）。客户端对 `rate_limited` 的呈现（→ Toast）已由票 02 的映射承接，本票无需前端改动。

**Blocked by:** 01（需要统一信封与 `rate_limited` 枚举）。

**Status:** done — `http/rateLimit.ts` 内存滑动窗口中间件 + `routes/auth.ts` 登录/注册各挂独立限流器；阈值/窗口经 env 可调（`env.ts`）；`app.test.ts` 新增「集成：auth 限流」两例覆盖。

- [x] 登录在窗口内超阈值返回 429 `rate_limited`（统一信封）；未超阈值的正常登录不受影响。限流器在校验前跑，命中即 `apiErrorBody('rate_limited', …)`(429)、不触达业务逻辑；测试以 `LOGIN_RATE_LIMIT_MAX=2` 断言前 2 次 200、第 3 次 429。
- [x] 注册按 IP 超阈值返回 429 `rate_limited`。注册用独立计数器与独立阈值（`REGISTER_RATE_LIMIT_MAX`），测试断言超阈值 429 且另一 IP 不受株连。
- [x] 阈值与窗口可经 env 配置。`LOGIN_RATE_LIMIT_MAX/_WINDOW_MS`、`REGISTER_RATE_LIMIT_MAX/_WINDOW_MS`，默认对应 spec（登录 10min/10、注册 1h/5）；`.env.example` 已注记「调大即可开发/压测期放行」。
- [x] 服务端 app HTTP 缝覆盖：连续请求触发 429 及其信封形状，正常请求不被误伤。经既有 `app.test.ts`（`app.request()` 打整应用），用 `x-forwarded-for` 模拟不同来源 IP；断言 429 信封 `error.code==='rate_limited'`、`data` 互斥缺省，阈值内正常请求 200。

> **实现取舍**：按 IP 计的滑动窗口日志（sliding-window log），只记录*放行*的请求——被拒的不占坑，窗口滑过后自然恢复、不会把命主永久锁死。计数含成功请求（限流器在凭证校验前跑），与本票验收「超阈值即挡 / 未超阈值不受影响」及 spec G「10 次」一致；**注意** spec 用户故事 20 措辞为「失败尝试」，与 G 节 / 本票不一致，已留待作者裁定（当前按 G 节实现，不区分成败）。IP 解析优先真实 socket（`getConnInfo`），LAN 无代理故不信任 `x-forwarded-for`，仅在无 socket（测试）时回退。
