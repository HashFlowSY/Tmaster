# primitive(Tier-1 · issue 02 表现型 + issue 03 交互型)

每个页面复用的骨架与控件。token 从 `../` 取(`../palette`、`../semantic`、`../typography`…),
组件从这里取:

```ts
import { Screen, Icon, Eyebrow, HSerif, Sub, TextMute, LoginMark, Button, Field, Toast, Checkbox, SegmentedControl, Cascader } from '../design/primitives';
```

> 为何与 token 分两个 barrel:token barrel(`src/design`)是纯 TS、零组件依赖;primitive 引
> react-native-svg / safe-area 等 RN 组件依赖。分开后,纯逻辑代码引 token 不会被动拖入原生组件依赖。

issue 02 交付表现型部分:`Screen` / `Icon` / 字体原子 + 登录标记。issue 03(登录页属主)补齐首批
交互型 primitive:`Button` / `Field`,以及 Tier-2 的 `Toast`。issue 04(注册页属主)补齐 Tier-2
自定义金色 `Checkbox`,并给 `Field` 增补 `helper` 说明文字槽。issue 05(生辰引导页属主)补齐 Tier-1
`SegmentedControl` 与 Tier-2 级联选择器 `Cascader`。其余(`Card`、`BottomNav` 及 Tier-2 组件)在后续
issue 随属主页面落地。

## 组件

- **`Screen({ children, header?, scroll?, style?, contentStyle? })`** — 安全区内边距 + `bg` 底 + 内容/标题两档横向留白。
- **`Icon({ name, color?, size?, strokeWidth?, accessibilityLabel? })`** — 按名渲染移植自原型的线性图标。见 `./icons.ts` 注册表(名 → 原型用途注释,可 grep 反查)。
- **`Eyebrow` / `HSerif({ variant })` / `Sub` / `TextMute`** — type ramp(spec §4)的薄封装。
- **`LoginMark({ size? })` / `MarkRing` / `MarkTaiji`** — 登录页品牌标记。`LoginMark` 静态叠合;`MarkRing`(外圈)/`MarkTaiji`(太极)拆分导出,供登录页对外圈单独施加自转。
- **`Button({ variant, onPress, breathe?, disabled? })`** — 交互 primitive。primary=金渐变+金辉+r14;ghost=透明描边。按压缩放 + `breathe` 辉光走 Reanimated,订阅减动效。行为测试见 `Button.test.tsx`。
- **`Field({ label, icon?, suffix?, onSuffixPress?, helper?, onFocus?, onBlur?, ...TextInputProps })`** — 交互 primitive。标签 + 前置图标 + TextInput + 可选尾缀 + 可选 `helper` 说明文字(原型 `.field .helper`,如注册页密码建议);聚焦金色焦点环(边框渐入 + gold-soft 3px 环),focus 经回调上报。行为测试见 `Field.test.tsx`。
- **`Toast({ message, onHide, durationMs? })`** — Tier-2 轻提示。屏底居中胶囊,淡入上移,到时回调隐藏。登录页「其他登录方式 / 忘记密码」→「敬请期待」。
- **`Checkbox({ checked, onChange, disabled?, children?, accessibilityLabel? })`** — Tier-2 自定义金色勾选框(RN 无可样式化原生 checkbox,故自绘)。16×16 方框(勾选=金填充 + 深墨金对勾)+ 右侧标签内容;切换 `checked` 并以取反值触发 `onChange`,`checkbox` 角色/状态供无障碍。行为测试见 `Checkbox.test.tsx`。
- **`SegmentedControl({ options, value, onChange, accessibilityLabel? })`** — Tier-1 交互 primitive(泛型 value)。ink-3 胶囊容器内等宽分段按钮,选中项 = `accentSoft` 填充 + gold-2 文字 + 金色内描边(原型 `.seg`)。按下以其 `value` 触发 `onChange`,`button` 角色 + `selected` 状态供无障碍。行为测试见 `SegmentedControl.test.tsx`。
- **`Cascader({ crumbs, options, selected?, onSelect })`** — Tier-2 级联选择器(生辰引导页属主)。顶部面包屑(已选级 gold-2 加粗 · 当前级象牙+金下划线,级间「/」)+ 可滚动选项列表,选中项 = gold-2 + 尾部金色 ✓(原型 `.cascader`)。按下选项以其 `value` 触发 `onSelect`,`button` 角色 + `selected` 状态供无障碍。行为测试见 `Cascader.test.tsx`。

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
| `Button` 的 breathe 呼吸 | 原型 `@keyframes breathe` 动画的是 `box-shadow`,RN 阴影不可原生动画(spec §Effects 裁定)。改为在按钮后叠一层带峰值金辉 `boxShadow` 的辉光层,用 Reanimated 脉动其 **opacity**。基础态仍保留静态金辉。 |
| `Field` 的焦点环 | 原型 `.input:focus-within` 同时改边框色 + 加 gold-soft 3px 环。这里边框色用 `interpolateColor` 渐变,环用一层 `boxShadow:focusRing` 叠层的 **opacity** 渐入(裁定:焦点环走 Reanimated)。测试只断言 focus **回调**,不断言环样式。 |
| `Field`/`Toast`/`Checkbox` 的一次性色 | `FOCUS_BORDER`(gold@55%)、`TOAST_BG`(墨@96%)、`TOAST_BORDER`(gold@40%)、primary 按钮文字与 `Checkbox` 对勾 `#241a06`(金底上的深墨金)是原型里各自场景的一次性值,非通用调色板 token,就地成常量并注明出处。 |
| `Checkbox` 为自绘、且对勾用内联 SVG | 原型是 `<input type=checkbox accent-color:gold>` 原生控件,RN 无法样式化(spec §7 裁定),故自绘 16×16 方框:勾选=`accent` 金填充,未勾=`surfaceInput` 底 + `line` 描边。对勾无原型可移植路径(原生控件),就地用 react-native-svg 画一条标准 √,不入 `Icon` 注册表(注册表只存移植自原型的路径)。 |
| `LoginHero` 的三处动效 | 星野 twinkle(整层 opacity)、罗盘 spin(仅 `MarkRing` 旋转,太极静止)、辉光 breathe(SVG `RadialGradient` 的 opacity 脉动)。三者均订阅「减少动态效果」→ 静止(spec User Story 15)。`LoginHero` 是登录屏专属复合件(单屏消费),置于 `src/components/`,不入 DS primitive。 |
| `SegmentedControl` 选中项内描边 | 原型 `.seg button[aria-pressed]` 的 `box-shadow:inset 0 0 0 1px rgba(201,162,74,.35)`。落到 `shadows.segRing`(inset boxShadow 字符串,新架构支持);选中态无动画过渡(原型 transition 属装饰,视觉双端人工核对)。button 内圆角 9 非通用 radii 档,就地成常量。 |
| `Cascader` 选中标记 ✓ | 原型 `.opt.sel::after content:"✓"`。伪元素无 RN 等价,就地渲染金色 `✓` Text;并给选项 `Pressable` 显式 `accessibilityLabel`,避免 ✓ 污染无障碍名。末项去掉下分隔线(原型末项分隔线被容器 `overflow:hidden` 裁掉,观感等价)。 |
| 生辰引导 年/月/日/时辰 picker | 原型这些 `.picker` 是**静态展示格**(无实际选择交互);真实滚轮选择需 datetime 依赖(超出 spec「final four」)且非 spec 列出的 primitive。故以原型默认值播种为展示格渲染,交互式日期选择留待后续 ticket。见 `app/onboarding.tsx` 文末 RULINGS。 |
| 生辰引导 历法 / longitude | 历法(公历/农历)为展示态本地状态——`BirthProfileInput` schema 无历法字段(spec 禁改 schema),不随提交发送。longitude 取所选城市代表经度(精确地理编码属 spec Out of Scope),桥接真太阳时校正所需的必填经度。 |

## 测试

按 spec §Testing Decisions,表现型组件**不**断言样式/路径/颜色常量(那是变更探测器,视觉忠实度双端人工核对)。
唯一必备测试是 issue 02 验收点:`Icon.test.tsx` 断言 Icon(及 LoginMark)能渲染,并顺带覆盖「~22 图标全部渲染不抛错」。
交互型 primitive 的行为测试在其落地的 issue 补(Button/Field/SegmentedControl…)。
