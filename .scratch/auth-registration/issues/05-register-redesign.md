# 05 — 注册页重做

**What to build:** 一条完整、合理、手机端从容的注册体验。命主打开注册页：布局有呼吸留白、键盘弹起时当前输入框不被遮挡；输入时字段失焦即校验、确认密码在两框都碰过后实时比对；所有错误就地显示在对应字段（邮箱格式、密码长度、两次不一致、该邮箱已注册），不再有 `Alert` 弹窗打断；可一键显/隐密码；密码说明文案与实际规则一致（去掉并不强制的「含字母与数字」承诺）；能点开并阅读《用户协议》《隐私政策》后再勾选同意；注册成功后进入 onboarding（生辰引导）。

**Blocked by:** 01（错误信封 + `fields`）、02（`Field` 错误态/显隐、`Screen` 键盘避让、校验/映射纯函数）、03（法务页作为可点链接的落点）。

**Status:** done —— 注册屏重做落地（仅 `app/(auth)/register.tsx` 薄接线，复用票 01–04 的信封/纯函数/`Field`·`Screen`/法务页）；整仓 `pnpm -r typecheck` 通过、`pnpm -r test` 全绿（shared 9 / mobile 165 / server 34）、mobile `lint` 干净；`/code-review` 双轴（Standards + Spec）均无阻断项。软门槛（键盘避让 / 呼吸留白 / 视觉）留待 iOS + Android 真机人工核对。

- [x] 布局改为键盘避让 + `flexGrow` flex 列 + 呼吸留白：矮屏可滚、高屏有呼吸；留白仅作用于 auth，**不动全局 `Screen`**（不回归已验收的其余 8 屏）。`Screen avoidKeyboard`；本屏 `contentStyle={flexGrow:1,paddingTop:8,paddingBottom:30}` + 弹性 `spacer` 下沉页脚。
- [x] 邮箱/密码失焦校验、确认密码两框都碰过后实时比对，提交做总校验；错误全部就地内联，**移除所有 `Alert.alert`**（并清掉不再用到的 `ApiError` import）。确认错误改为「两框都碰过 or 当前已在显示」即随输入重算，消除滞留旧错（code-review 采纳）。
- [x] 服务端 `email_taken` 内联到邮箱字段；`validation` 的 `fields` 落到对应字段；限流/网络/`internal` 走 Toast——统一交给票 02 的 `mapAuthError`。
- [x] 密码框可一键显/隐（`Field` 内建，复用）；placeholder 去掉「含字母与数字」承诺改为「请输入密码」，helper 与 min-8（无复杂度）一致。
- [x] 《用户协议》《隐私政策》可点，`router.push('/legal?doc=terms|privacy')` 跳票 03 法务页；未勾选同意时就地 `consentHint` 提示、不弹窗。
- [x] 注册成功 `router.replace('/onboarding')`（ADR-0004 门槛不变）；提交中按钮 `disabled={busy}` + 加载态文案，禁重复点击。
- [x] 校验与错误映射复用票 02 的纯函数（`registerFieldError`/`confirmError`/`validateRegister`/`mapAuthError`），屏幕保持薄接线（无新增屏幕单测，符合 spec Testing Decisions）；改版后 iOS + Android 真机视觉核对（软门槛，不阻断）留待人工。
