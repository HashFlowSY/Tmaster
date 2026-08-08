# 01 — 登录/注册后按生辰落点软引导（落点收敛 + boot-landing 修复）

> 依据：[spec.md](../spec.md) 实现决策 A / B、测试缝 1 / 2；决策 [ADR-0009](../../../docs/adr/0009-onboarding-nudge-not-login-gate.md)。

**What to build:** 登录 / 注册后，未建 BirthProfile 的命主被一次性带到生辰引导页（`/onboarding`）、已建的直接进对话主页（`/chat`）；落点由导航守卫**单一决定**，注册屏不再自行跳转；带有效会话的返回用户冷启动后直接进主页、不再卡在「天机」启动占位。boot / 恢复会话**不**触发引导。这是一次性落点、非常驻门禁——命主在引导页「稍后填写」离开后不会被弹回（跳过页面本身由票 02 交付）。

**Blocked by:** None — can start immediately.（与票 02 无共享文件，可并行）

**Status:** done (commit a988510) — 代码 + 自动化（nudge 5 例 + resolveLanding 真值表 16 例）全绿；登录/注册/冷启动落点真机人工核对由用户通过 ✓（2026-08-08）

- [x] 无生辰的命主**登录**后落到 `/onboarding`：登录时查 `BirthApi.get()`，`404 not_found`**或网络失败**都判为需引导（fail-toward-引导）。
- [x] 已有生辰的命主登录后直接落 `/chat`，不经引导。
- [x] **注册**成功后落到 `/onboarding`（新用户不查询、直接判需引导），且注册屏**不再**自行 `replace('/onboarding')`——落点只由导航守卫决定，消除「先闪主页再跳引导」的竞态与死返回键。
- [x] 带有效会话的返回用户**冷启动**后直接进入 `/chat`、不再停在启动占位；且冷启动**不**触发引导（无生辰者交由页面内既有点用引导承接）。
- [x] 登出后重新登录会**重新**按生辰判定落点（不记忆「已跳过」）。
- [x] 落点决策抽成纯函数 `resolveLanding`（签名与真值表见 spec 实现决策 B），导航守卫仅为其薄包装；穷举 `(ready × authenticated × nudgeOnboarding × group)` 的落点真值表由单测覆盖，**无需 mock expo-router**（prior art：`conversationMeta.test.ts`）。
- [x] 生辰判定标志 `nudgeOnboarding` 由 `AuthContext.test` **扩测**覆盖可观察行为：登录+200→`false`、登录+404→`true`、登录+网络失败→`true`、注册→`true` 且 `BirthApi.get` 未被调用（prior art：现有 `AuthContext.test.tsx`）。
- [x] `/me` 契约不变；服务端不新增强制层（维持既有 `409 birth_required` 兜底）。
- [x] 真机人工核对（用户完成 ✓ 2026-08-08）：登录/注册/冷启动三条路径落点正确，注册返回键不再是死键。

## Implementation Notes

由 `/implement 01` 完成（TDD，两条纯 / 可观察缝先写测试后实现）：

- **纯函数 `resolveLanding`**（`apps/mobile/src/navigation/resolveLanding.ts`）+ 穷举真值表测试（16 例，`it.each` 覆盖 `ready × authenticated × nudge × group`，无 mock expo-router）。
- **`nudgeOnboarding` 标志**（`apps/mobile/src/auth/AuthContext.tsx`）：`login()` 写 token 后查 `BirthApi.get()`（fail-toward-引导），先于 `authenticated` 置位消竞态；`register()` 直接置真不查询；`logout()` 复位；boot 不查不置。`AuthContext.test.tsx` 扩测 5 例（含 boot-有效会话 → nudge 保持 false 且不查生辰）。
- **`RootNav` 变薄**（`apps/mobile/app/_layout.tsx`）：仅调 `resolveLanding` + 非 null 时 `router.replace`，`group = useSegments()[0]`。
- **注册屏删自跳**（`apps/mobile/app/(auth)/register.tsx`）：移除 `router.replace('/onboarding')`，落点单一交守卫。
- 验证：`pnpm typecheck` 0 错、`pnpm exec jest` 34 suites / 193 tests 全绿、0 act 告警、eslint 变更文件 0 错。`/code-review`（Standards + Spec 双轴）均通过。
