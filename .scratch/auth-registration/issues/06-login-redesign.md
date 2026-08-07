# 06 — 登录页重做

**What to build:** 与注册一致的键盘友好、留白从容、错误内联的登录体验，并让品牌 hero 在聚焦时收缩让位。命主打开登录页：布局与注册同款；输入校验就地；凭证错误在密码框下方就地提示「邮箱或密码错误」，不再弹窗；点进输入框时 `LoginHero`（罗盘/星野/辉光）收缩淡出、把空间让给表单，失焦后恢复；被限流时以 Toast 提示；登录成功自动进入对话主页。登录页的《用户协议》《隐私政策》维持纯说明文案、不做可点（本次范围外）。

**Blocked by:** 05（复用注册先行建立的布局/键盘/校验范式；透过 05 亦已具备 01、02）。

**Status:** done —— 登录屏重做落地（`app/(auth)/login.tsx` 薄接线 + `LoginHero` 聚焦收缩，复用票 01–02 的信封/纯函数/`Field`·`Screen`）。整仓 `pnpm -r typecheck` 通过、`pnpm -r test` 全绿（mobile 165 / server 34 / shared）、mobile `lint` 干净；`/code-review` 双轴（Standards + Spec）均无阻断项。软门槛（键盘避让 / hero 聚焦收缩 / 视觉留白）留待 iOS + Android 真机人工核对。

- [x] 复用票 05/02 建立的键盘/校验范式（`Screen avoidKeyboard` + 失焦/提交校验 + 边改边清旧错），复用票 02 纯函数 `loginFieldError`/`validateLogin`/`mapAuthError`。布局保留品牌区通栏（不套注册的弹性留白），非 1:1 复制。
- [x] `invalid_credentials` 经 `mapAuthError` 就地内联到密码字段「邮箱或密码错误」；`rate_limited` / 网络 / `internal` 走 `Toast`；**移除登录的 `Alert.alert`**（并清掉不再用到的 `ApiError` import）。
- [x] 输入聚焦时 `LoginHero` 高度→0 + 淡出收缩（`collapsed` prop，`onLayout` 量得展开态自然高度后补间），失焦恢复；订阅「减少动态效果」时瞬时切换、不补间。
- [x] 登录成功不在屏内跳转、由 `RootNav` 依 auth 态自动进入对话主页（现状不变）；提交中按钮 `disabled={busy}` + 加载态文案，禁重复点击。
- [x] 《用户协议》《隐私政策》维持纯说明文案、不可点（spec Out of Scope）；`忘记密码` / 「其他登录方式」维持惰性占位，本次不接。
- [ ] 改版后做一次 iOS + Android 真机视觉核对（软门槛，不阻断）——留待人工；重点核对键盘避让、hero 聚焦收缩过渡，及切换字段（email→password）时收缩态无明显抖动（code-review 记：失焦→聚焦交接的一帧回弹为化妆级，交真机确认）。
