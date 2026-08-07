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
`SegmentedControl` 与 Tier-2 级联选择器 `Cascader`。issue 06 补齐 `BottomNav`。issue 07(对话页属主)
补齐 Tier-2 对话件 `TabDrop` / `Persona` / `KvCard` / `ChatMessage` / `Composer`。issue 08(命盘页属主)
补齐 Tier-1 `Card` 与 Tier-2 命盘件 `Pillars` / `ElementBars` / `QiMenGrid`。

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
- **`Cascader({ crumbs, options, selected?, onSelect, onCrumbPress? })`** — Tier-2 级联选择器(生辰引导页属主)。顶部面包屑(已选级 gold-2 加粗 · 当前级象牙+金下划线,级间「/」)+ 可滚动选项列表,选中项 = gold-2 + 尾部金色 ✓(原型 `.cascader`)。按下选项以其 `value` 触发 `onSelect`,`button` 角色 + `selected` 状态供无障碍。传 `onCrumbPress` 时已选级面包屑可点(逐级下钻回上一级,当前级不可点)。行为测试见 `Cascader.test.tsx`。
- **`Card({ children, padded?, style? })`** — Tier-1 表现型「有边框的容器面」(原型 `.chartcard`:ink-2 底 + line 描边 + r18 + padding18)。卡间距由属主页 gap 控制,不写进 Card 外边距。命盘三卡(命主/五行强弱/奇门局)属主。纯表现型,不设行为测试。
- **`Pillars({ pillars })`** — Tier-2「八字盘」四柱网格(命盘页属主;裁定 text + View,不用 SVG)。每柱 = 柱名 + 大号衬线天干/地支(**五行色由属主派生注入**)+ 十神 + 藏干;日柱金色强调。自身不引 `palette.wx*`——五行数据编码色收敛在 `src/chart/fiveElement.ts`。纯表现型。
- **`ElementBars({ bars })`** — 命盘「五行强弱」水平条(五行名 + ink-4 轨道 + 五行色填充 + 计数)。计数与色由 `chart/fiveElement.elementBalance` 派生注入(清点四柱干支),本组件不引 `palette.wx*`。条宽映射(满格 78% / 0 桩 6%)是纯视觉编码,不写测试。纯表现型。
- **`QiMenGrid({ cells })`** — Tier-2「奇门局」九宫格(命盘页属主;裁定 text + View,不用 SVG)。3×3、每宫 = 门(衬线)+ 星宫;中宫金软底 + 金边、值符宫金边 + 内金环(奇门用**金色**强调,不涉五行色)。RN 无 CSS grid → 按行分块、方格 flex:1 + aspectRatio:1 保证等宽正方。纯表现型。

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
| 五行色 | 通用文字/图标原子一律不碰;五行色是「八字盘」内部按柱注入的数据编码(spec User Story 11/31)。**全 App 唯一直接引用 `palette.wx*` 的地方是 `src/chart/fiveElement.ts`**——它把干/支查表映射到五行并派生色,`Pillars`/`ElementBars` 只接收派生好的颜色字符串,以此把数据编码色收敛在一处。 |
| 命盘五行强弱计数 | 由 `fiveElement.elementBalance` 清点**四柱天干+地支**派生(不含藏干),是既有盘数据的可视化、非新排盘。与原型示例盘对齐:干支甲丙己丙/戌寅巳寅 → 金木水火土 0/3/0/3/2,正是原型 `.balance` 条宽 6/78/6/78/52 的计数(锁在 `fiveElement.test.ts`)。降级盘时柱为 null 自然跳过。 |
| 命盘 命主 meta | 命造(乾/坤)与四柱来自真实 `ChartApi`;出生地/出生时间取自 `BirthApi`;真太阳时校正分钟数 = 真太阳时 − 钟表出生时间(就地计算)。任一缺项优雅降级(如退回农历),不编造。 |
| 命盘 奇门局 | 无结构化 API:奇门局按 ADR-0001 由 AI 在对话文本中实时起局,排盘计算属 spec Out of Scope。故 `chart.tsx` 以就地常量 `SAMPLE_QIMEN`(原型示例阳遁三局)演示 `QiMenGrid` 版式,标题注「示例排布」+ helper 说明实时生成,不谎称为命主今日真实局。八门/九星/九宫为奇门固定词汇,非个人结论。 |
| 命盘 喜用神/忌神 · 身强弱 | 属命理判断(排盘/断语,spec Out of Scope);无 API 且不可由计数推断,编造会误导。故五行强弱卡**省略**该页脚,只保留真实计数条 + 「日主X」注,而非填占位值。 |
| 命盘 大运 | 原型 chart 屏无大运块(以奇门局取代),按「1:1 对齐原型」删去旧屏的大运列表;数据仍在 `ChartApi.decadeFortunes`,未来可另起页承载。 |
| 命盘 icon-btn(分享) | `data-soon` 占位键:渲染 38×38 / ink-2 / r11 的分享键(1:1),按下走 `Alert`「敬请期待」——不真正接入分享(wiring 占位属 spec Out of Scope,仅给最小反馈)。r11 非通用 radii 档,就地成常量(同注册页返回键)。 |
| `Button` 的 breathe 呼吸 | 原型 `@keyframes breathe` 动画的是 `box-shadow`,RN 阴影不可原生动画(spec §Effects 裁定)。改为在按钮后叠一层带峰值金辉 `boxShadow` 的辉光层,用 Reanimated 脉动其 **opacity**。基础态仍保留静态金辉。 |
| `Field` 的焦点环 | 原型 `.input:focus-within` 同时改边框色 + 加 gold-soft 3px 环。这里边框色用 `interpolateColor` 渐变,环用一层 `boxShadow:focusRing` 叠层的 **opacity** 渐入(裁定:焦点环走 Reanimated)。测试只断言 focus **回调**,不断言环样式。 |
| `Field`/`Toast` 等的一次性色 | `FOCUS_BORDER`(gold@55%)、`TOAST_BG`(墨@96%)、`TOAST_BORDER`(gold@40%)、`ChatMessage` 的 me 气泡渐变/头像径向色等,是原型里各自场景的一次性值,非通用调色板 token,就地成常量并注明出处。 |
| 金底上的前景色 `#241a06`（onAccent） | 原本在 `Button`/`Checkbox`/`Composer` 各自就地成常量;因跨三个 primitive 复用(金色渐变/填充上的深墨金文字·对勾·发送图标),已提升为语义别名 `semantic.onAccent`。它不是原型 `:root` 变量,故不入 `palette`。 |
| `Checkbox` 为自绘、且对勾用内联 SVG | 原型是 `<input type=checkbox accent-color:gold>` 原生控件,RN 无法样式化(spec §7 裁定),故自绘 16×16 方框:勾选=`accent` 金填充,未勾=`surfaceInput` 底 + `line` 描边。对勾无原型可移植路径(原生控件),就地用 react-native-svg 画一条标准 √,不入 `Icon` 注册表(注册表只存移植自原型的路径)。 |
| `LoginHero` 的三处动效 | 星野 twinkle(整层 opacity)、罗盘 spin(仅 `MarkRing` 旋转,太极静止)、辉光 breathe(SVG `RadialGradient` 的 opacity 脉动)。三者均订阅「减少动态效果」→ 静止(spec User Story 15)。`LoginHero` 是登录屏专属复合件(单屏消费),置于 `src/components/`,不入 DS primitive。 |
| `SegmentedControl` 选中项内描边 | 原型 `.seg button[aria-pressed]` 的 `box-shadow:inset 0 0 0 1px rgba(201,162,74,.35)`。落到 `shadows.segRing`(inset boxShadow 字符串,新架构支持);选中态无动画过渡(原型 transition 属装饰,视觉双端人工核对)。button 内圆角 9 非通用 radii 档,就地成常量。 |
| `Cascader` 选中标记 ✓ | 原型 `.opt.sel::after content:"✓"`。伪元素无 RN 等价,就地渲染金色 `✓` Text;并给选项 `Pressable` 显式 `accessibilityLabel`,避免 ✓ 污染无障碍名。末项去掉下分隔线(原型末项分隔线被容器 `overflow:hidden` 裁掉,观感等价)。 |
| 生辰引导 年/月/日/时辰 picker | 采用原生 `@react-native-community/datetimepicker`(display=spinner)采集真实出生时刻——瞬态系统选择器视作原生输入 chrome(同键盘 / 真 OS 状态栏),其两端外观差异可接受;持久引导屏仍严格 1:1。iOS 内嵌暗色底部弹层,Android 走系统对话框。时辰名由 `src/time/hourBranch.ts` 从精确 HH:mm 派生展示。见 `app/onboarding.tsx` 文末 RULINGS。 |
| 生辰引导 历法 / longitude | 历法(公历/农历)为展示态本地状态——`BirthProfileInput` schema 无历法字段(spec 禁改 schema),不随提交发送。longitude 由 `src/location/regions.ts` 的精选省/市/区县数据就近取真实经度(城市级挂经度、区县继承),随所选地点变化;全量地理编码仍属 spec Out of Scope。 |

## 测试

按 spec §Testing Decisions,表现型组件**不**断言样式/路径/颜色常量(那是变更探测器,视觉忠实度双端人工核对)。
唯一必备测试是 issue 02 验收点:`Icon.test.tsx` 断言 Icon(及 LoginMark)能渲染,并顺带覆盖「~22 图标全部渲染不抛错」。
交互型 primitive 的行为测试在其落地的 issue 补(Button/Field/SegmentedControl…)。
