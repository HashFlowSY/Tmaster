# 02 — auth 复用件（primitives + 表单逻辑）

**What to build:** 为注册/登录两屏铺好可复用地基（prefactor —— 先让改动变简单，再做简单的改动）。三件东西：`Field` 能承载错误态（危险色边框 + 错误行）并为密码字段内建显/隐切换；`Screen` 能按需避让键盘；再交付一套纯函数——客户端表单校验（复用 `@tianji/shared` 的 zod）+「服务端错误信封 → 字段内联 / 表单错误 / Toast」的映射。全部为附加式改动：不传新 prop、不调用新函数时，现有行为一律不变。本票**不触碰任何屏幕**，交付即由单测验证。

**Blocked by:** None — can start immediately.

**Status:** done

- [x] `Field` 新增可选 `error?`：有值即进错误态并渲染错误文本；不传则与现状完全一致。组件测试断言错误文本渲染。
- [x] `Field` 为 `secureTextEntry` 字段内建显/隐切换，点击翻转密码可见性。组件测试断言切换翻转 `secureTextEntry`（断行为，不断样式）。
- [x] `Screen` 新增可选 `avoidKeyboard`，为真时内容随键盘避让（键盘行为交真机核对，不进单测）。
- [x] 纯函数模块：给定注册/登录输入用共享 zod 产出字段级校验错误；给定错误信封（`validation` 的 `fields` / `email_taken` / `invalid_credentials` / `rate_limited` / 网络）产出「落到哪个字段 or 走 Toast」的映射。纯函数单测覆盖各分支（对应 spec 缝 3）。
- [x] 不修改 `register` / `login` 屏本身；其余既有屏行为不受影响。

## Comments

- 实现落地于 commit `f32ac93`。交付：`Field.error?` + 显/隐切换（新增 `eye`/`eyeOff` 图标）、`Screen.avoidKeyboard`、纯逻辑模块 `apps/mobile/src/auth/formLogic.ts`（校验复用 `@tianji/shared` zod + `mapAuthError` 落实 spec §B 映射表）。
- 测试：`formLogic.test.ts` 纯函数覆盖各分支；`Field.test.tsx` 扩测错误文本渲染 + 显隐翻转（断行为不断样式）。全仓 `pnpm -r typecheck` 通过，mobile 全量 **165 passed / 32 suites**。
- 双轴 code-review（standards + spec）均通过；仅一处 cosmetic（`error`/`helper` 排版重复）已抽 `subText` 共用消除。
- `avoidKeyboard` 的键盘避让为真机软门槛，本票只交付 primitive 能力、不接线到屏幕；实际人机工程核对随 05/06 屏改造进行。
