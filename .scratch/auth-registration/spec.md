---
title: 天机 · 注册/登录交互重做 + 统一 API 数据格式 Spec
description: 在一层统一的前后端 API 数据信封之上，重做注册与登录两屏的交互与手机端布局——客户端校验、字段内联错误、键盘避让、可点法务页、密码显隐、auth 限流——并把「1:1」澄清为仅约束视觉语言。
---

# 天机 · 注册/登录交互重做 + 统一 API 数据格式 Spec

Status: ready-for-agent

> 相关决策：[ADR-0002 局域网明文部署](../../docs/adr/0002-local-lan-cleartext-deployment.md) · [ADR-0003 有状态会话认证](../../docs/adr/0003-stateful-session-auth.md) · [ADR-0004 对话按系统分型 / 八字卡 onboarding](../../docs/adr/0004-conversation-typed-by-system.md) · [ADR-0005 原生 StyleSheet + token](../../docs/adr/0005-native-stylesheet-design-tokens.md) · **[ADR-0008 统一 API 响应信封](../../docs/adr/0008-unified-api-response-envelope.md)（本 spec 附带新增）** · 术语见 [CONTEXT.md](../../CONTEXT.md) · 视觉真源 `docs/ui/tianji-app-design.html`

## Problem Statement

注册与登录已经端到端跑通（`User` + 登录 `Session` 均能正确创建），但**交互不合理、手机端上下布局太挤**，且底层的前后端数据格式并不统一，具体体现为：

- **命主视角**：报错以 `Alert.alert` 弹窗打断（密码不一致、未勾选同意），而不是就地告诉我哪个输入框错了；输入非法邮箱或过短密码时，App 不当场提示，而是白跑一趟服务器再弹一个笼统错误；密码框写着「含字母与数字」，但其实并不强制，是在骗我；《用户协议》《隐私政策》是死链接，我根本读不到自己在同意什么；键盘弹起时表单被顶得很挤、字段被遮挡；页面整体上下留白不足，观感局促。
- **安全视角**：登录/注册**零限流**，可无限撞密码或批量注册。
- **开发者视角**：服务端错误大多是 `{error:{code,message}}` 信封，但 zod 校验失败的 400 却漏走了 `@hono/zod-validator` 默认的 `{success,error}` 形状，客户端 `ApiError` 解析不到真实信息；成功响应又是各式裸对象。**前后端没有一致、可依赖的数据契约**，导致「字段级内联错误」这类体验根本无从做起。

更深一层：这些交互缺陷的共同根因，是当初把 `apps/mobile` 的注册/登录**严格 1:1 移植自 HTML 原型**——原型是定宽的桌面浏览器 mock，用固定 margin、无法表达键盘避让与小屏 flex，而「1:1」的初衷本只针对视觉语言，从未打算约束交互与布局人机工程。

## Solution

分两层解决。

**地基层——统一 API 数据信封（前置，全仓）**：确立一份前后端共享的响应契约——成功一律 `{ data: T }`，错误一律 `{ error: { code, message, fields? } }`，二者互斥；`code` 收敛为 `@tianji/shared` 的联合枚举。服务端补 `zValidator` 失败钩子与 `app.onError` 兜底，把所有错误（含 zod 校验 400、未捕获 500）都收进信封，并在校验失败时回填字段级 `fields`。客户端只在 `apiFetch` **一处集中解包** `.data` 并抛出带 `fields` 的 `ApiError`，因此各屏成功路径不变。SSE 聊天流（`ChatStreamEvent`）保留自身事件协议、不套信封。

**体验层——在契约之上重做注册/登录两屏**：客户端复用共享 zod 做**失焦 + 提交**校验，把错误**就地画进字段**（`Field` 新增错误态），彻底替掉 `Alert`；无法归到单一字段的错误（凭证错、限流、网络）落到密码框下方或 `Toast`。布局改为 `flexGrow` 的 flex 列 + 键盘避让（`Screen` 新增 `avoidKeyboard`），并在 auth 两屏补回呼吸留白（不动全局 `Screen`，避免波及已验收的其余 8 屏）。密码框内建显/隐切换、软化文案与实际规则对齐；《用户协议》《隐私政策》改为可点的静态页；登录页 `LoginHero` 在聚焦时收缩让位。后端为 `/api/auth/*` 加内存滑窗限流。

命主由此得到一个当场校验、错误就地、键盘友好、留白从容、能真正读到条款的注册/登录流；开发者得到一份全仓一致、类型安全、可依赖的 API 数据契约。

## User Stories

1. 作为一名**命主**，我希望输入邮箱格式错误时输入框下方当场标红提示，而不是等我点了注册才弹窗，以便我能立刻改正。
2. 作为一名**命主**，我希望密码太短时当场在密码框下看到「密码至少 8 位」，以便我不必来回试。
3. 作为一名**命主**，我希望两次密码不一致时在「确认密码」框下就地提示、并随我输入实时更新，而不是提交后才用弹窗打断我。
4. 作为一名**命主**，我希望「该邮箱已注册」直接标在邮箱框上，以便我知道是这一项出了问题（而不是笼统的「注册失败」）。
5. 作为一名**命主**，我希望登录凭证错误时在表单里就地提示「邮箱或密码错误」，而不是一个系统弹窗。
6. 作为一名**命主**，我希望能点一下眼睛图标查看自己刚输入的密码，以便确认没打错。
7. 作为一名**命主**，我希望键盘弹起时表单会自动上移、当前输入框不被遮挡，以便我能看到自己在填什么。
8. 作为一名**命主**，我希望注册页在手机上有从容的上下留白、不再挤成一团，以便整个流程看起来可信、精致。
9. 作为一名**命主**，我希望在矮屏手机上表单能自然滚动、在高屏手机上又有呼吸感，以便各种机型下都舒适。
10. 作为一名**命主**，我希望能真正点开《用户协议》和《隐私政策》读到正文，以便我知道自己在同意什么。
11. 作为一名**命主**，我希望密码框的说明文字与实际规则一致（不再承诺一个并不强制的「含字母与数字」），以便我不被误导。
12. 作为一名**命主**，我希望在提交注册前必须勾选同意条款，且未勾选时的提示是就地的、克制的，而不是弹窗。
13. 作为一名**命主**，我希望注册成功后被顺畅带到生辰引导（onboarding），以便我可以接着排盘。
14. 作为一名**命主**，我希望登录成功后自动进入对话主页，无需任何额外操作。
15. 作为一名**命主**，我希望登录页顶部的品牌动画在我点进输入框时优雅收缩、把空间让给表单，以便小屏上也够用。
16. 作为一名**命主**，我希望注册与登录两屏的交互、间距、错误呈现完全一致，以便体验连贯、不割裂。
17. 作为一名**命主**，我希望提交过程中按钮进入加载态、不能重复点击，以便我不会误触两次。
18. 作为一名**命主**，我希望网络异常或服务器错误时看到一个清晰、非技术性的中文提示（Toast），以便我知道该重试。
19. 作为一名关注安全的**命主**，我希望我的账号在短时间内被反复猜测密码时会被限流保护，以便降低被撞库的风险。
20. 作为一名**开发者/运维**，我希望登录在 10 分钟内超过 10 次失败尝试（按 IP）即返回 429，以便挡住暴力破解。
21. 作为一名**开发者/运维**，我希望同一 IP 每小时最多注册 5 次、超出返回 429，以便挡住批量注册。
22. 作为一名被限流的**命主**，我希望看到一个明确的「操作过于频繁，请稍后再试」提示，以便我理解发生了什么。
23. 作为一名**开发者**，我希望所有 API 成功响应统一为 `{ data: T }`、错误统一为 `{ error: { code, message, fields? } }`，以便前端有一份可依赖的契约。
24. 作为一名**开发者**，我希望错误 `code` 是 `@tianji/shared` 里的联合枚举，以便前后端对错误分类类型安全、不写魔法字符串。
25. 作为一名**开发者**，我希望 zod 校验失败也走统一错误信封并带上字段级 `fields`，以便前端能把每条错误画到对应输入框。
26. 作为一名**开发者**，我希望未捕获异常由 `app.onError` 兜底成 `internal` 信封，以便客户端永远不会收到裸崩溃响应。
27. 作为一名**开发者**，我希望客户端只在 `apiFetch` 一处解包 `.data`，以便各屏的成功调用代码无需改动。
28. 作为一名**开发者**，我希望 SSE 聊天流保留自身事件协议、不被信封改造波及，以便对话功能不受影响。
29. 作为一名**开发者**，我希望校验规则由 `@tianji/shared` 的 zod 单一真源提供、前后端共用，以便客户端校验与服务端校验永不漂移。
30. 作为一名**开发者**，我希望 `Field` primitive 承载错误态（红边 + 错误行）与显/隐切换，以便注册两个密码框与登录都能复用，不各写一套。
31. 作为一名**开发者**，我希望 `Screen` primitive 提供可选的 `avoidKeyboard`，以便 auth 屏乃至将来其他表单屏都能一键获得键盘避让。
32. 作为一名**开发者**，我希望注册/登录屏把校验与「错误→字段」映射抽成纯函数，以便这部分逻辑可单测、屏幕保持薄接线。
33. 作为一名**开发者**，我希望呼吸留白只作用于 auth 两屏、不动全局 `Screen`，以便不回归今天已真机验收过的其余 8 屏。
34. 作为一名**开发者**，我希望「1:1 仅约束视觉语言、交互与布局按原生人机工程走」被明确写进设计系统 spec，以便未来读者不会把这次布局偏离误当成 bug。
35. 作为一名**开发者**，我希望「注册 Registration」作为术语被钉进 CONTEXT.md（= 创建 User + Session，不含出生信息），以便注册与 onboarding 的边界不再含糊。

## Implementation Decisions

### A. 统一 API 数据信封（地基，最先做，全仓一次迁完）

- **契约形状**（在 `@tianji/shared` 定义，作为单一真源；下述类型来自本次设计定稿）：

  ```ts
  // 成功与错误互斥
  type ApiSuccess<T> = { data: T };
  type ApiErrorBody = {
    error: {
      code: ApiErrorCode;
      message: string;                   // 面向命主的中文文案
      fields?: Record<string, string>;   // 字段级校验错误：字段名 → 中文错误
    };
  };
  type ApiErrorCode =
    | 'validation'          // 400 —— zValidator 失败，带 fields
    | 'email_taken'         // 409
    | 'invalid_credentials' // 401
    | 'unauthorized'        // 401 —— 缺/无效凭证或会话过期
    | 'not_found'           // 404
    | 'rate_limited'        // 429
    | 'internal';           // 500 —— app.onError 兜底
  ```

- **服务端**：改造全部 **12 个 JSON 端点**（`auth` / `account` / `birth` / `chart` / `conversations` / `messages` 六个路由文件）——成功响应包进 `{ data }`；新增全局 `zValidator` 失败钩子（把 `ZodError` 扁平化为 `{ code:'validation', message, fields }`，400）与 `app.onError`（兜底 `{ code:'internal' }`，500）。会话/JWT 逻辑（ADR-0003）与既有的 `email_taken`(409)/`invalid_credentials`(401) 语义**不变**，只是套进统一信封。
- **SSE carve-out**：`messages` 的 `streamSSE`（`ChatStreamEvent` 的 `delta`/`done`/`error`）**不套信封**，维持事件协议原样。
- **客户端**：仅改 `apiFetch` 一处——2xx 时返回解包后的 `.data as T`；非 2xx 时解析 `.error` 抛出 `ApiError(status, code, message, fields)`。`endpoints.ts` 与各屏拿到的仍是 `T`，成功路径零改动。
- **落地结构**：作为**独立的前置基础工单**先行（本 spec 的 ticket 01），注册/登录功能工单建立在其上。理由与取舍见 **ADR-0008**（本 spec 附带新增）。

### B. 错误 → UI 呈现映射（客户端）

| 场景 | HTTP / code | 落点 |
| --- | --- | --- |
| 字段校验失败 | 400 `validation`（带 `fields`） | 各字段就地内联（邮箱 / 密码 / 确认密码）|
| 邮箱已注册 | 409 `email_taken` | 邮箱字段内联「该邮箱已注册」|
| 凭证错误（登录）| 401 `invalid_credentials` | 密码字段下方就地提示「邮箱或密码错误」|
| 限流 | 429 `rate_limited` | `Toast` |
| 网络 / 500 | 网络异常 / `internal` | `Toast` |

- **精简裁定（对应 grilling Q11=a）**：只用 `Field` 的内联错误态，**不新造顶部表单错误条**；无法归到字段的错误走密码框下方或既有 `Toast`。**全面移除注册/登录里的 `Alert.alert`**。

### C. 设计系统 primitive 改造（附加式，保留默认行为）

- **`Field`**：新增 `error?: string`（有值即进错误态：危险色 `semantic.danger` 边框 + 错误行，占位/叠加于 `helper`）；为 `secureTextEntry` 字段内建**显/隐眼睛切换**（复用 `Icon`）。均为可选 prop，不传则行为与现状一致。
- **`Screen`**：新增 `avoidKeyboard?: boolean`，为真时用 `KeyboardAvoidingView` 包裹内容（iOS `padding` / Android 恰当行为 + 让开 header 偏移）。

### D. 注册 / 登录两屏重做

- **布局**：内容容器 `contentContainerStyle={{ flexGrow: 1 }}` + flex 列，头部 / 表单 / 页脚在高屏有呼吸、矮屏自然滚动；auth 两屏各自补回上下呼吸留白（经各屏 `contentStyle`，**不动全局 `Screen`**）；两屏 `Screen` 开 `avoidKeyboard`。
- **校验时机**：字段**失焦**校验 + 提交**总**校验；确认密码在两框都碰过后**实时**比对。校验规则复用 `@tianji/shared` 的 `RegisterInputSchema` / `LoginInputSchema`。
- **登录 hero**：`LoginHero` 在输入聚焦时**收缩 / 淡出**让位表单（尊重 reduce-motion）。
- **提交态**：`busy` 期间按钮加载态、禁重复提交（沿用现状并接入错误映射）。
- **导航不变**：注册成功 `router.replace('/onboarding')`；登录成功由 `RootNav` 依 auth 态自动跳转（ADR-0004 的 onboarding 门槛不变）。

### E. 密码策略

- **改软文案**：保留 `passwordSchema` 的 `min(8)`/`max(72)`**不变**，**去掉**密码框「含字母与数字」的强承诺文案，helper 改为与实际一致的建议性表述。不引入复杂度正则。

### F. 法务静态页

- 新增 auth 路由页 `(auth)/legal`（用 `Screen` + `TitleBar` 渲染），承载《用户协议》与《隐私政策》正文；注册/登录处的链接接上 `router.push`。
- 正文为**本次生成的占位文案**，明确标注「非律师审阅 · v1 占位」，针对本 App 实际数据面（邮箱、出生信息、与 AI 的对话）撰写；日后可替换为真实法务文本。不新造 modal primitive。

### G. auth 限流

- 内存滑动窗口中间件，挂 `/api/auth/*`：**登录** 每 IP 10 分钟 10 次 → 429；**注册** 每 IP 每小时 5 次 → 429。命中返回统一信封 `{ error: { code:'rate_limited', ... } }`。
- 单进程 `better-sqlite3` 服务器用内存 `Map` 计数即可，不引 Redis（与 ADR-0003「v1 单机」一致）。窗口/阈值经 env 可调，避免开发期自锁。

### H. 文档与领域

- **ADR-0008**：记录「统一 API 响应信封（全信封 B）」的取舍——选全信封而非仅错误统一（A）或裸 body、`code` 枚举、SSE carve-out、客户端集中解包。
- **设计系统 spec 注记**：在 `.scratch/design-system/spec.md` 追加澄清——**1:1 仅约束视觉语言 / token，交互与垂直间距 / 键盘行为按原生端人机工程走**。
- **CONTEXT.md 新增术语**：**注册 Registration** —— 创建一个 `User`（邮箱 + 密码）与一条登录 `Session`；不含出生信息（那属 onboarding，见 ADR-0004）。

## Testing Decisions

好的测试**只断言外部可观察行为，不耦合实现细节**（例如断言「校验失败返回带 `fields` 的 400 信封」，而非断言某内部函数被调用；断言 `Field` 在有 `error` 时渲染出错误文本，而非断言其边框色值）。四条缝，尽量用最高、最少、优先复用既有：

1. **服务端 app HTTP 缝（复用既有）** —— `apps/server/src/app.test.ts`，用 `app.request()` 打整个组装好的 Hono app（临时 SQLite）。**一缝覆盖全部服务端行为**：各端点成功 `{ data }`、失败 `{ error }`；zod 校验失败的 `validation` 400 + `fields`；`email_taken`(409)、`invalid_credentials`(401)；限流 `rate_limited`(429)。优先于逐个 route handler 单测。**Prior art**：现有 `app.test.ts`、`routes/messages.test.ts`。
2. **客户端 `apiFetch` 缝（新，纯函数级）** —— mock 全局 `fetch`：断言 2xx 解包 `.data`→`T`；错误信封抛 `ApiError(status, code, message, fields)`。一缝钉死客户端侧契约。
3. **客户端表单逻辑纯模块（新，最高缝）** —— 把「客户端校验（复用共享 zod）+ 服务端错误→字段映射」抽成纯函数单测；屏幕只做接线、不单测。
4. **`Field` 组件缝（复用既有）** —— 扩测 `Field.test.tsx`：有 `error` 时渲染错误文本 / 进错误态；显 / 隐切换翻转 `secureTextEntry`。**只断行为**（回调 / 文本），不断样式光环——沿本仓既有组件测试约定。**Prior art**：现有 `Field.test.tsx`、`Button.test.tsx`、`Checkbox.test.tsx`。

**共享 schema**：`@tianji/shared` 的信封类型与 `code` 枚举以类型 + 编译保证为主；密码文案软化不涉及 schema 改动，无需新增 schema 测试。

**不进自动化测试（交给真机人工软门槛）**：`Screen.avoidKeyboard` 的键盘避让、auth 两屏的布局 / 视觉留白、`LoginHero` 聚焦收缩——RN 原生 + 视觉，jsdom 内断言等同测实现细节。改版后按本仓既有软门槛做一次 **iOS + Android 真机人工视觉核对**（建议、不阻断）。

## Out of Scope

- **onboarding（生辰引导 `/onboarding`）**本身的任何改造——注册止于「账号 + 会话已建、交接给 onboarding」。
- **会话 / JWT 模型**（ADR-0003）：sessions 表、6h 滑动过期、登出吊销、JWT 载荷一律不动，仅套信封。
- **公网部署 / TLS / HTTPS**（ADR-0002 维持 LAN 明文）。
- **邮箱验证 / 激活邮件**（LAN v1 无邮件设施）。
- **忘记密码 / 密码重置**：登录页 `忘记密码` suffix 维持惰性占位（同「其他登录方式」OAuth 占位约定），本次不接。
- **第三方 / OAuth 登录**：「其他登录方式」仍 `Toast`「敬请期待」。
- **昵称 / 显示名**：schema 与 DB 无此字段，profile 继续以邮箱代显示名，本次不新增。
- **成功响应改造之外的重构**：不趁机改动无关端点的业务逻辑；信封是纯外层包裹。
- **SSE 事件套信封**：明确排除。
- **顶部表单错误条组件**：按 Q11=a 不做。

## Further Notes

- **工单路线图**（已落地为 `.scratch/auth-registration/issues/` 下六张票，依赖序编号、blocker 在前）：
  1. `01-api-response-envelope` —— 统一信封全仓迁移（12 端点 + shared 契约 + `apiFetch` 集中解包 + `zValidator` 钩子 + `app.onError` + `code` 枚举，SSE carve-out，更新既有测试）。**Blocked by**：无。
  2. `02-auth-shared-enablers` —— `Field` 加 `error?` + 显/隐；`Screen` 加 `avoidKeyboard`；客户端「校验 + 错误→字段映射」纯模块；三者单测。**Blocked by**：无。
  3. `03-legal-static-pages` —— auth 内法务静态页 + 生成的协议/隐私正文。**Blocked by**：无。
  4. `04-auth-rate-limiting` —— `/api/auth/*` 内存滑窗限流 + `rate_limited` 429。**Blocked by**：01。
  5. `05-register-redesign` —— 注册屏布局/键盘/校验/内联错误/软文案/显隐/法务链接。**Blocked by**：01、02、03。
  6. `06-login-redesign` —— 登录屏同款范式 + `LoginHero` 聚焦收缩 + 凭证错内联。**Blocked by**：05。
- **起始 frontier**：01、02、03 可并行开工；01 完成解锁 04；01+02+03 完成解锁 05；05 完成解锁 06。
- **ADR-0008** 与**设计系统 spec 注记**、**CONTEXT.md「注册」术语**随本 spec 一并产出（domain-modeling 的 glossary/ADR 产物）。
- 法务占位正文由 agent 生成，非律师审阅，仅为 v1 占位，上线前须替换为真实文本。
- 陈旧记录待订正：仓库根 `CLAUDE.md` 仍称本项目为「单文件设计原型 `tianji-app-design.html`」，实际早已是 pnpm monorepo 全栈——建议顺手更新（不在本 spec 强制范围内）。

## Risks

- **信封迁移触及全部 12 个端点**（含与注册无关的 chart/chat/conversation）：由「客户端集中解包 `apiFetch`」把客户端爆炸半径压到一处、由「服务端 app HTTP 缝」一缝回归全部端点来缓解；且作为独立前置工单先行、单独提交，history 清晰。
- **改动共享 primitive（`Field` / `Screen`）可能影响其他屏**：所有新增均为可选 prop 且默认保持既有行为；扩测覆盖，避免回归。
- **呼吸留白若误改全局 `Screen`** 会位移今天已真机验收的 8 屏：明确裁定留白只作用于 auth 两屏。
- **1:1 偏离引发困惑**：由设计系统 spec 注记 + ADR-0008 显式记录，避免未来被当成 bug「修回去」。
- **内存限流器**重启即清零、且不支持多实例：v1 单机可接受（同 ADR-0003 推理）；阈值 / 窗口经 env 可调，防止开发与测试期自锁。
