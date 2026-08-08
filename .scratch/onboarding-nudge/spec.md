---
title: 天机 · 登录后生辰引导（可跳过软引导）Spec
description: 登录/注册后对未建 BirthProfile 的命主做一次可跳过的软引导——登录查生辰决定落点、由 RootNav 单一落点源消除竞态并修复冷启动卡 splash；onboarding 软引导化：中性默认防盲提交 + 农历「敬请期待」+ 头部「稍后填写」出口。非硬门，尊重 ADR-0004（奇门不需生辰）。
---

# 天机 · 登录后生辰引导（可跳过软引导）Spec

Status: done（两票均落地：代码 + 自动化全绿 + 真机人工核对由用户通过，2026-08-08）

> 相关决策：**[ADR-0009 生辰引导用可跳过的软提示而非登录门](../../docs/adr/0009-onboarding-nudge-not-login-gate.md)（本 spec 核心，随本 spec 产出）** · [ADR-0004 对话按系统分型 / 八字卡 onboarding、奇门不卡](../../docs/adr/0004-conversation-typed-by-system.md) · [ADR-0003 有状态会话认证](../../docs/adr/0003-stateful-session-auth.md) · [ADR-0002 局域网明文部署](../../docs/adr/0002-local-lan-cleartext-deployment.md) · [ADR-0008 统一 API 响应信封](../../docs/adr/0008-unified-api-response-envelope.md) · 术语见 [CONTEXT.md](../../CONTEXT.md) · 视觉真源 `docs/ui/tianji-app-design.html`

## Problem Statement

命主与开发者视角下，「登录后是否已建 BirthProfile」这件事今天是**半接通**的：

- **命主视角**：我注册时会被带去填生辰，但下次**登录**再进来却直接落到对话主页，从没人提醒我去填——而没有生辰，八字命盘看不了、八字对话建不了。那个生辰页还**预填了别人的示例**（1994 出生、杭州），我一不留神点下「生成命盘」就可能把假数据交上去。我想先跳过也没有出口；从注册进来时那个返回键还是**点了没反应**的死键。我点「农历」它好像切过去了，但其实我的农历日期会被当成公历算——我根本不知道。
- **开发者视角**：落点逻辑**分散且会抢跑**——注册页自己 `replace('/onboarding')`，登录靠 `RootNav` 往 `/chat` 送，两者对同一个「已登录」状态各跳各的（竞态）。带 token 冷启动的返回用户会**卡在启动占位**：`RootNav` 只把人从 auth 组赶走，不管停在 index 的已登录用户。生辰页是当初搭设计系统时**顺手产出的小样**，带着示例默认值和「Step 02 / 共三步」的强制流程语义，与"可选补全"的定位不符。

更深一层：需求最初提的是「没生辰就禁止进入其他页面」的**硬登录门**，但这与 ADR-0004 已确立的「奇门不需生辰」冲突、且会把不愿填的命主 trap 死。grilling 后收敛为**可跳过的软引导**（取舍见 ADR-0009）。

## Solution

把「是否需要引导」收敛成一个**登录/注册时算一次的标志** `nudgeOnboarding`，由 `RootNav` 作为**单一落点真相源**据此决定落 `/onboarding` 还是 `/chat`；顺带删掉注册页自己的跳转（消竞态 / 死返回键）、补上「带 token 冷启动 → `/chat`」（修卡 splash）。判定信号复用既有 `BirthApi.get()`（`404 not_found` = 无生辰），**不改 `/me` 契约**；网络失败也判为需引导（fail-toward-引导，因为可跳过所以安全）。**boot / 恢复会话不引导**——无生辰的返回用户交给页面内既有的点用引导。

`onboarding` 从「事实上必经的 Step 02」改为**可跳过的一次性软引导**：头部提供「稍后填写」出口（栈里有上一屏则返回、否则进对话主页）；**中性化默认**（出生地不预选、出生时刻未经滚轮确认前不算已填、tiles 显占位）杜绝照抄示例盲提交；「农历」点选弹「敬请期待」并恒留公历（不落库、不动 schema），杜绝农历被当公历静默起错盘；移除三段步骤条、眉标改「完善生辰」；保存成功仍落 `/chart`（让命主立刻看到刚起的命盘）。

引导为**纯客户端导航**、且可跳过，因此不 trap 只想用奇门的命主（尊重 ADR-0004）；服务端维持既有 `409 birth_required` 作数据完整性兜底，**不新增**强制层（ADR-0002：LAN 明文 / 可信用户 / v1 命主=本人）。既有的点用引导（命盘空态、八字对话 `409` → 「去完善生辰」）**保持不变**，与登录引导互补。

## User Stories

1. 作为一名**命主**，登录后如果我还没填生辰，我希望被带到生辰页，以便我知道要补齐才能看八字。
2. 作为一名**命主**，我希望这个引导能「稍后填写」跳过，以便我不被当场逼填、也不被困住。
3. 作为一名**命主**，注册后我希望被带到生辰页（新账号必然没生辰），以便顺势完成起盘前最后一步。
4. 作为一名**命主**，如果我已经填过生辰，我希望登录后直接进对话主页、不再被引导打扰。
5. 作为一名**命主**，网络不好查不到我的生辰时，我希望仍被引导到生辰页（而不是被默默放行又处处报错），且我随时能跳过。
6. 作为一名**命主**，我希望「稍后填写」后进入对话主页仍能正常使用不依赖生辰的功能（如奇门），以便引导不阻断我。
7. 作为一名**命主**，我在命盘页看到「尚未完善生辰」时希望能一键去填，以便就地补齐（既有点用引导保留）。
8. 作为一名**命主**，我新建八字对话时若还没生辰，希望被提示「去完善」而不是报错（既有 `409` 引导保留）。
9. 作为一名**命主**，填完生辰保存后我希望直接看到自己的命盘（`/chart`），作为填写的即时回报。
10. 作为一名**命主**，我希望生辰页不再预填别人的示例出生地 / 日期，以免我一不小心把假数据交上去。
11. 作为一名**命主**，我希望在真正选了出生地（到区县）、设了出生日期、并选了时辰或勾了「时辰未知」之后，才能点「生成命盘」，以便系统不接受我漏填的信息。
12. 作为一名**命主**，出生日期 / 时辰在我还没设置时希望显示占位（「—」/「请选择」）而不是一个看似已填的值，以便我清楚它还没填。
13. 作为一名**命主**，我点「农历」时希望被告知「敬请期待」、控件仍停在公历，以便我不误以为农历已支持、把农历日期当公历交上去。
14. 作为一名**命主**，如果我是从命盘 / 对话里点「去完善生辰」进来的，我希望头部返回能把我送回原来的位置。
15. 作为一名**命主**，如果我是登录 / 注册被引导进来的（没有上一屏），我希望头部是「稍后」并把我送进对话主页，而不是一个点了没反应的死返回键。
16. 作为一名**命主**，冷启动重开 App（会话还在）时，我希望直接进入对话主页、不再卡在「天机」启动画面。
17. 作为一名**命主**，冷启动重开且我还没填生辰时，我希望不被反复弹引导，而是安静进主页、需要时再由页面内提示引导。
18. 作为一名**命主**，引导页不再显示「Step 02 / 共三步」这种强制流程感，以便它读起来就是一个可选的补全项。
19. 作为一名**开发者**，我希望「是否引导」在登录 / 注册时算成一个可观察的 `nudgeOnboarding` 标志，以便落点决策有单一来源、可单测。
20. 作为一名**开发者**，我希望登录用既有 `BirthApi.get()`（`404` = 无盘）判断，不改 `/me` 契约，以便改动面最小。
21. 作为一名**开发者**，我希望注册不必查询即知无生辰（新用户恒无），直接置 `nudge=true`，以便少一次往返。
22. 作为一名**开发者**，我希望落点决策集中在 `RootNav` 一处、注册页不再自行跳转，以便消除「先弹主页再跳引导」的竞态与死返回键。
23. 作为一名**开发者**，我希望 `RootNav` 的重定向选择抽成纯函数 `resolveLanding`，以便穷举组合可单测、且无需 mock expo-router。
24. 作为一名**开发者**，我希望带 token 冷启动的返回用户由 `RootNav` 从启动占位落到 `/chat`，以便补上 ADR-0003 引入的「返回登录态却卡 splash」缺口。
25. 作为一名**开发者**，我希望 boot / 恢复会话不触发引导（`nudge` 只由登录 / 注册置真），以便冷启动不打扰、无生辰者交给点用引导兜底。
26. 作为一名**开发者**，我希望 `onboarding` 的提交闸抽成纯函数 `canSubmitBirth`，以便「中性默认防盲提交」的规则可单测。
27. 作为一名**开发者**，我希望「农历暂不支持」以点选提示 +（`value` 恒公历）实现、不动 schema，以便避免农历被当公历静默起错盘（与 ADR-0009 一致）。
28. 作为一名**开发者**，我希望不新增服务端强制层、维持既有 `409 birth_required` 兜底，以便符合 ADR-0002 的 LAN / 可信 / v1 前提。
29. 作为一名**开发者**，我希望本特性明确记录在 ADR-0009、并修正 CONTEXT.md 里指错的 onboarding 引用，以便决策可追溯。
30. 作为一名**开发者**，我希望既有的点用引导（命盘空态、八字对话 `409`）保持不变，以便登录引导与点用引导互补而非重复造。

## Implementation Decisions

### A. 引导判定标志 `nudgeOnboarding`（登录会话状态层）

- 登录会话状态模块（`AuthProvider` / `useAuth`）新增只读 `nudgeOnboarding: boolean`，默认 `false`。
- **登录 `login()`**：在写入 token 之后、翻 `authenticated=true` **之前**，查 `BirthApi.get()`——解析成功（有生辰）→ `nudge=false`；抛错（`404 not_found` 无生辰 / 网络失败 / 任何非成功）一律 → `nudge=true`。标志先于 `authenticated` 置位，保证 `RootNav` 同一次渲染即读到正确值（消竞态）。
- **注册 `register()`**：直接 `nudge=true`（新用户必无生辰），不查询。
- **登出 `logout()`**：复位 `nudge=false`。
- **boot / 恢复会话**：不查、不置 `nudge`（保持 `false`）——冷启动不引导。
- 判定规则（定稿，来自 grilling）：

  ```
  login    → nudge = !(BirthApi.get 成功)   // 404 / 网络失败 / 任何非成功 → true（fail-toward-引导）
  register → nudge = true
  boot / logout → nudge = false
  ```

### B. 落点单一真相源 `resolveLanding`（导航守卫抽纯函数）

- 新增**纯函数** `resolveLanding`，签名（定稿）：

  ```ts
  resolveLanding(input: {
    ready: boolean;
    authenticated: boolean;
    nudgeOnboarding: boolean;
    group: string | undefined;   // 当前路由组：'(auth)' | '(app)' | 'onboarding' | undefined(启动占位 index)
  }): '/login' | '/onboarding' | '/chat' | null   // null = 不重定向
  ```

- 真值表（定稿）：

  | ready | authenticated | group | 结果 |
  | --- | --- | --- | --- |
  | false | — | — | `null`（等 boot 完成） |
  | true | false | `'(auth)'` | `null` |
  | true | false | 其它 | `'/login'` |
  | true | true | `'(auth)'` | `nudge ? '/onboarding' : '/chat'`（登录/注册落点） |
  | true | true | `undefined`（启动占位 index） | `'/chat'`（boot-landing 修复；boot 不引导） |
  | true | true | 其它（已在 app / onboarding 内） | `null`（非常驻门禁，不弹回） |

- 导航守卫（`RootNav`）变薄：仅调 `resolveLanding` + 依非 `null` 结果 `router.replace`。
- **删除注册屏自行的 `router.replace('/onboarding')`**，落点全交给守卫——同时消除竞态与死返回键。

### C. `onboarding` 软引导化 + 中性默认（生辰引导屏）

- **头部出口**：栈里有上一屏（点用引导 `push` 进来）→ 显「返回」→ `back()`；否则（登录/注册 `replace` 进来）→ 显「稍后」→ `replace('/chat')`。以 `router.canGoBack()` 区分。
- **中性默认**：出生地**不预选**（空路径，逼选到区县）；出生时刻仅作滚轮打开时的中性起点，**未经滚轮确认前不算已填**、tiles 显占位（「—」/「请选择」）。引入 `dateTouched` / `timeTouched` 触碰标志。
- **提交闸**抽**纯函数** `canSubmitBirth`，签名（定稿）：

  ```ts
  canSubmitBirth(input: {
    locComplete: boolean;   // 出生地选到区县
    hasLongitude: boolean;  // 取到经度
    dateTouched: boolean;   // 出生日期经滚轮确认过
    timeTouched: boolean;   // 出生时辰经滚轮确认过
    timeUnknown: boolean;   // 勾了「时辰未知」
  }): boolean
  // = locComplete && hasLongitude && dateTouched && (timeUnknown || timeTouched)
  ```

- **历法**：点选「农历」→ 弹「敬请期待」提示、**不切换**（`value` 恒 `solar`）；不落库、不改 schema、不随提交发送。
- 移除三段步骤条；眉标「Step 02 · 录入生辰」改「完善生辰」。
- 保存成功后 `replace('/chart')`（沿用现状；命主主动填写的即时回报）。

### D. 与既有点用引导互补（不改）

- 命盘页「尚未完善生辰 → 去完善生辰」空态、八字对话建单时 `409 birth_required` → 「去完善」的 `push('/onboarding')` **保持不变**，作为跳过者 / 无生辰返回用户的兜底。登录引导（入口推）与点用引导（用时补）互补。

### E. 强制层与服务端（不新增）

- 引导为纯客户端导航；服务端维持既有 `409 birth_required`（建**八字**对话时校验生辰存在）作数据完整性兜底。**不新增**服务端「无生辰全面拒绝」的强制层。理由：ADR-0002（LAN 明文）、可信用户、v1 命主=本人，关键完整性已由 `409` 保障。

### F. 文档与领域

- **ADR-0009**《生辰引导用可跳过的软提示而非登录门》：记录从硬门 → 软引导的取舍、与 ADR-0004 的关系、fail-toward-引导、单一落点源、服务端不加强制。（随本 spec 已产出。）
- **CONTEXT.md**：修正「注册 Registration」术语里指错的「见 ADR-0004」→「见 ADR-0009」。（已产出。）

## Testing Decisions

好的测试**只断外部可观察行为，不耦合实现细节**（断可观察标志值 / 纯函数返回 / 渲染出的文本，而非断某内部函数被调、某样式色值）。三条缝，优先复用既有、抽到最高纯函数点，避免 mock expo-router 与组件级重活：

1. **登录会话状态缝（复用既有 `AuthContext.test.tsx`）—— 引导判定。** 该测试已 mock `endpoints` + `token` 并断可观察 `{ ready, authenticated }`；扩它：补 mock `BirthApi.get`，渲染 `AuthProvider`，调 `login()` / `register()`，断可观察 `nudgeOnboarding`——
   - 登录 + `BirthApi.get` 成功 → `false`
   - 登录 + `404` → `true`；登录 + 网络失败 → `true`
   - 注册 → `true`，且 `BirthApi.get` **未**被调用。
   **Prior art**：现有 `AuthContext.test.tsx`（ready/authenticated 断言、endpoints/token mock）。
2. **`resolveLanding` 纯函数缝（新，最高缝）—— 落点决策。** 穷举 `(ready × authenticated × nudge × group)` 组合断落点（含 boot-landing：authed × `group=undefined` → `/chat`；含「已在 app/onboarding 内 → null 不弹回」）。纯函数，**无需 mock expo-router**。**Prior art**：`conversationMeta.test.ts`、`formLogic.test.ts`。
3. **`canSubmitBirth` 纯函数缝（新）—— 中性默认提交闸。** 表测：缺任一必填（地点未到区县 / 无经度 / 日期未触 / 时辰未触且未勾未知）→ `false`；齐备或勾「未知」→ `true`。**Prior art**：`formLogic.test.ts`、`regions.test.ts`。

**不进自动化测试（RN 视觉 / 导航胶水，交真机人工核对——沿 `auth-registration` spec 既有软门槛先例）**：头部「稍后 / 返回」的实际导航跳转、农历「敬请期待」Alert、tiles 占位渲染、`RootNav` 的 `router.replace` 副作用接线、`onboarding` 布局 / 视觉。改版后做一次 **iOS + Android 真机人工核对**（建议、不阻断）。

## Out of Scope

- **改 `/me` 契约 / 加 `hasBirthProfile` 字段**：明确不做，登录用既有 `BirthApi.get()` 判断。
- **boot / 恢复会话触发引导**：明确不引导（`nudge` 只由登录 / 注册置真）。
- **记忆「已跳过」的持久标记**：每次登录重查，不记忆。
- **服务端新增「无生辰全面拒绝」强制层**：维持既有 `409 birth_required`。
- **农历落库 / 农历转公历 / 新增历法字段**：仅做「敬请期待」占位守卫；真需求需改 schema，另立工单。
- **onboarding 的「编辑生辰」入口**：v1 无独立改生辰页，`onboarding` 定位为首次设置；日后另起。
- **命主 name、多命主 / 为他人排盘**：schema 无此字段，v1 命主=本人。
- **点用引导（命盘空态 / 八字对话 `409`）的任何改造**：已存在，保持不变。
- **奇门专属的「无需生辰」路径**：ADR-0004 不变，本 spec 不动。

## Further Notes

- **顺带修的两处既有缺陷**：注册页 `replace('/onboarding')` 与 `RootNav → /chat` 抢跑（竞态 / 死返回键）；带 token 冷启动返回用户卡启动占位。二者都由「`RootNav` 单一落点源 + `resolveLanding`」一并解决——非本特性凭空引入，而是把它们收进同一处正确的落点逻辑。
- **onboarding 现状澄清**：该页**并非空壳**——已真实接 `BirthApi.save` + 原生日期/时辰滚轮 + Cascader（省市区下钻取真经度）+「时辰未知」降级盘 + busy/错误处理。本次只做**软引导化 + 中性默认 + 农历占位 + 头部出口**，不重写既有采集逻辑。
- **可选加码（未纳入，默认手动核对）**：把历法守卫抽成纯函数 `resolveCalendarSelect`（`'lunar'` → 提示且不切换）纳入 Seam 3 同一测试文件——如需「农历永不落库 / 永不影响 `birthDate`」的自动断言再加。
- **工单拆分**：可一票拿下，或按层拆（① 状态层 `nudge` + `resolveLanding` + 守卫收敛 ② `onboarding` 软引导化 + 中性默认 + 纯函数 ③ 文档）。本 spec 不预先落票，交由实现时决定。
- **ADR-0009 与 CONTEXT.md 修正**随本 spec 一并产出（已落盘）。

## Risks

- **`resolveLanding` 抽取需与现 `RootNav` 行为等价**（尤其 `!ready → null`、「已在内不弹回」、boot-landing）：由穷举表测覆盖，防回归。
- **登录多一次 `BirthApi.get` 往返**：登录本身低频，`busy` 态已覆盖该等待；网络失败 fail-toward-引导且可跳过，无阻断。
- **中性默认改变默认可提交性**：若有 e2e / 手测依赖生辰页原预填值（1994 / 杭州），需知悉其失效；由 `canSubmitBirth` 表测 + 真机核对兜住。
- **农历「敬请期待」是权宜之计**：真正的农历输入须另立含 schema 迁移的工单；当前守卫的价值是**防错盘**（农历不再被静默当公历）。
- **boot-landing 修复触及冷启动路径**：表测覆盖 `group===undefined → /chat`，避免动到 `RootNav` 冷启动行为时回归。
