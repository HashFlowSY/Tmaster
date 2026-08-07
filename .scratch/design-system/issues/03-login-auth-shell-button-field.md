# 03 — Login 1:1 + (auth) shell + Button/Field

**What to build:** The login screen rendered 1:1 with the prototype — the first full vertical proof of the system — plus the two interactive primitives it introduces (`Button`, `Field`) and the (auth) route group. A 命主 sees the animated brand hero (spinning luopan mark, twinkling starfield, breathing glow), email + password fields with a gold focus ring, a breathing primary button, an "其他登录方式" affordance that toasts 敬请期待, and can navigate to register.

**Blocked by:** 02.

**Status:** done (commit 75a4201) — 视觉 1:1 双端真机核对 = P1 风险项（暂缓，不阻塞）

> Recommended first **real-build review** of tokens + fonts on iOS + Android before wider rollout. Advisory only — under the soft gate it does not block the (app) branch.

- [x] `Button` (primary gold-gradient + optional `breathe` + `ghost`) fires `onPress`, is inert when `disabled`, shows press feedback; behavior covered by a component test.
- [x] `Field` (leading icon, optional suffix, gold focus ring on focus) forwards value/onChangeText and reports focus via callback; behavior covered by a component test (asserting the callback, not the ring style).
- [x] Login matches the prototype 1:1 on both platforms: hero mark spin, starfield twinkle, breathe glow (all reduce-motion aware), email/password fields, 忘记密码 suffix, register link, 其他登录方式 → toast.
- [x] The (auth) route group/shell exists; login lives under it.

_Ref: spec §7 rulings (breathe → opacity, mark glow → SVG radial); §8._

## Comments

- Implemented. `Button`/`Field`/`Toast` primitives + `LoginHero` + login 1:1 rewrite + `(auth)` shell bg. Behavior tests for Button/Field (23 tests green, `tsc` clean). Reanimated 4 的官方 jest mock 会加载 worklets 原生模块而抛错,改用 `apps/mobile/__mocks__/react-native-reanimated.js` 手写 mock。忘记密码 suffix 依原型保持惰性(未接 toast,遵 spec Out-of-Scope)。
- **Soft-gate checkpoint pending:** 需在真机 iOS + Android 上人工核对 token/字体/`boxShadow`/焦点环渲染(spec §Further Notes)后再铺开其余屏。星野光点用实心 View 近似原型的 radial-gradient 软点——留待真机核对时确认可接受。
