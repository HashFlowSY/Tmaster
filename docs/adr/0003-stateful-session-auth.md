# 有状态会话认证:JWT + 服务端 session 表

采用单个 JWT(存 Expo SecureStore),但在服务端维护 `sessions` 表。每个受保护请求校验 JWT 且查对应 session 未被吊销,同时刷新其 `last_activity`,实现「6 小时闲置滑动过期」。登出时删除该 session 记录以真正吊销 token。

## Considered Options

- 纯无状态 JWT(不查库):被否。无法支持登出吊销 —— 泄露的 token 在过期前始终有效。因需求明确要「logout 调后端注销」,故引入服务端 session。

## Consequences

- 每次受保护请求多一次本地 SQLite 查询/更新(`better-sqlite3` 同步、本地,开销可忽略)。
- 登出、被盗 token 可即时作废。
- 认证不再是纯无状态,水平扩容时需共享 session 存储 —— v1 单机无此问题。
