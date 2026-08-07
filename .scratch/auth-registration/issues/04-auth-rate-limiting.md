# 04 — auth 限流

**What to build:** 保护登录与注册免于暴力破解与批量注册。给 `/api/auth/*` 加一层内存滑动窗口限流：登录每 IP 10 分钟内超过 10 次即被挡；注册每 IP 每小时超过 5 次即被挡；命中一律返回统一信封的 `rate_limited`(429)。阈值与窗口经 env 可调，避免开发/测试期自锁。单进程 `better-sqlite3` 服务器用内存计数即可，不引 Redis（与 ADR-0003「v1 单机」一致）。客户端对 `rate_limited` 的呈现（→ Toast）已由票 02 的映射承接，本票无需前端改动。

**Blocked by:** 01（需要统一信封与 `rate_limited` 枚举）。

**Status:** ready-for-agent

- [ ] 登录在窗口内超阈值返回 429 `rate_limited`（统一信封）；未超阈值的正常登录不受影响。
- [ ] 注册按 IP 超阈值返回 429 `rate_limited`。
- [ ] 阈值与窗口可经 env 配置。
- [ ] 服务端 app HTTP 缝覆盖：连续请求触发 429 及其信封形状，正常请求不被误伤。
