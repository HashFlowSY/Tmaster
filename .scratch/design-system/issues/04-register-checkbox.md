# 04 — Register 1:1 + Checkbox

**What to build:** The register screen rendered 1:1, plus the custom gold `Checkbox` primitive it introduces. A 命主 sees the eyebrow + serif heading, email + password + confirm-password fields (with password helper text), the consent checkbox with 《用户协议》/《隐私政策》links, a 注册并起盘 button, and a 直接登录 affordance back to login.

**Blocked by:** 03.

**Status:** done (commit 9290ae1) — 视觉 1:1 双端真机核对 = P1 风险项（暂缓，不阻塞）

- [x] Custom `Checkbox` toggles `checked` and fires `onChange` (RN has no styleable native checkbox); behavior covered by a component test.
- [x] Register matches the prototype 1:1: back nav, heading/sub, three fields (helper text on password), consent checkbox + links, primary button, 直接登录 link.
- [x] Reuses Button / Field / type atoms; no new hardcoded colors.

_Ref: spec §7 (custom checkbox ruling); §8._

## Comments

- Implemented. 自定义金色 `Checkbox`(TDD:先写 `Checkbox.test.tsx` 5 例覆盖 toggle/onChange/checked 无障碍状态/受控/children,再实现)+ `Field` 增补 `helper` 说明槽 + `register.tsx` 1:1 重写(返回头 · 眉标/衬线标题/副文 · 三 Field · consent Checkbox 带 gold-2《用户协议》/《隐私政策》· 注册并起盘 · 直接登录)。全量 28 测试绿、`tsc` clean。
- **裁定沿用/新增:** consent 未勾选 / 两次密码不一致以 `Alert` 反馈(沿本仓 login/register 的 Alert 约定,不视觉阻断按钮以保 1:1 金色外观)。对勾无原型可移植路径(原生 `accent-color` 控件),就地用 react-native-svg 画标准 √、深墨金 `#241a06` 对比色,不入 `Icon` 注册表(见 primitives/README 裁定表)。原型块级外边距合并(field 16 + consent 18 → 18)在 RN 用 `marginTop:2` 复现。
- **软门槛:** 仍在 issue 03 的真机核对门内——`boxShadow` 焦点环、金填充勾选框、字体在 iOS/Android 真机的渲染待人工确认后再铺开其余屏。
