# 表现型 primitive(Tier-1 · issue 02)

每个页面复用的表现型骨架。token 从 `../` 取(`../palette`、`../semantic`、`../typography`…),
组件从这里取:

```ts
import { Screen, Icon, Eyebrow, HSerif, Sub, TextMute, LoginMark } from '../design/primitives';
```

> 为何与 token 分两个 barrel:token barrel(`src/design`)是纯 TS、零组件依赖;primitive 引
> react-native-svg / safe-area 等 RN 组件依赖。分开后,纯逻辑代码引 token 不会被动拖入原生组件依赖。

本 issue 只交付 Tier-1 里的表现型部分:`Screen` / `Icon` / 字体原子 + 登录标记。交互型
primitive(`Button` / `Field` / `SegmentedControl`)及各 Tier-2 组件在后续 issue 随属主页面落地。

## 组件

- **`Screen({ children, header?, scroll?, style?, contentStyle? })`** — 安全区内边距 + `bg` 底 + 内容/标题两档横向留白。
- **`Icon({ name, color?, size?, strokeWidth?, accessibilityLabel? })`** — 按名渲染移植自原型的线性图标。见 `./icons.ts` 注册表(名 → 原型用途注释,可 grep 反查)。
- **`Eyebrow` / `HSerif({ variant })` / `Sub` / `TextMute`** — type ramp(spec §4)的薄封装。
- **`LoginMark({ size? })`** — 登录页品牌标记(外圈 + 太极),静态。

## 显式裁定(pixel-1:1 exceptions,spec User Story 29)

| 细节 | 裁定 |
|---|---|
| 登录标记为何单列一个组件、而非 `Icon` 的一个 name | 标记是**多色固定**复合体(金/金亮/墨 + 各自透明度),不受 `color` prop 驱动;而 `Icon` 是 `stroke=currentColor→color` 的单色线性图标。二者性质不同,故 `LoginMark` 独立。两者的路径都从原型移植,兑现验收点「Icon 渲染 ~22 图标 + 登录标记」。 |
| 登录标记的旋转 / glow / breathe | 本 issue 只出**静态**标记;spin 60s、glow 光晕、breathe 呼吸属登录页改造(issue 03,见 spec §Effects)。 |
| `Icon` 的 `strokeLinecap` / `strokeLinejoin` | 原型未显式设置(浏览器默认 butt/miter),这里统一设 `round`/`round`:这批图标本就是圆头线性风,round 更贴设计意图,且两端一致(spec 的 1:1 判据是 iOS≡Android)。可按需在组件里改。 |
| `Icon` 的默认 `strokeWidth` | 每个图标存原型首次出现的线宽为默认;同一图标在原型不同上下文可能线宽不同,屏幕改造时用 `strokeWidth` prop 覆盖。 |
| `.board-brand` 的 `.luopan` logo | 属 mock 框架(spec §10 exclusions),**不移植**;登录页的 `.mark` 才是真内容,即 `LoginMark`。 |
| `Screen` 的「内容 26 / 标题 22」两档留白 | 内容区(children)用 `gutter.content=26`;可选 `header` 槽用 `gutter.header=22`。原型标题区留白比内容区窄,由此区分。 |
| `TextMute` 无独立 ramp 行 | 复用 `sub` 的字体度量(族/字号/字距/行高来自 type ramp),仅把角色色改成最弱的 `textFaint`(muted-2)。是 `Sub` 的弱化姊妹。 |
| 假状态栏 / 刘海 | `Screen` **不画**;用真 OS 状态栏(`app/_layout` 的 expo-status-bar),安全区顶部内边距把内容顶到状态栏之下。 |
| 五行色 | 通用文字/图标原子一律不碰;五行色是「八字盘」内部按柱注入的数据编码(spec User Story 11/31)。 |

## 测试

按 spec §Testing Decisions,表现型组件**不**断言样式/路径/颜色常量(那是变更探测器,视觉忠实度双端人工核对)。
唯一必备测试是 issue 02 验收点:`Icon.test.tsx` 断言 Icon(及 LoginMark)能渲染,并顺带覆盖「~22 图标全部渲染不抛错」。
交互型 primitive 的行为测试在其落地的 issue 补(Button/Field/SegmentedControl…)。
