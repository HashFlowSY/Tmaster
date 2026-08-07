# 设计 token ↔ 原型 `--var` 对照

原型 `docs/ui/tianji-app-design.html` 是唯一设计真源。本表把原型 `:root` 的 CSS `--vars`
与本模块 token 一一对应,便于 grep 原型即定位 token(spec User Story 19/34)。改设计先改原型,再改这里。

## 命名裁定(为何是 `src/design/` 而不是 spec 直书的 `src/theme/`)

本 issue 是 expand→migrate→contract 的 **expand** 步:新 token 模块必须与旧扁平主题
`src/theme.ts` **共存且不动它**。若把新模块建成 `src/theme/` 目录,会与 `theme.ts` 文件在
Node/Metro 模块解析上冲突(文件名优先于同名目录,`./theme` 永远命中 `theme.ts`,barrel 反而不可达)。
故 expand/migrate 阶段落在 `src/design/`;待 **contract** 步(issue 12)删除 `theme.ts` 后,
可平移改名为 `theme/`。此裁定见 `index.ts` 顶部注释。

## 调色板原语 palette(`./palette.ts`)— 与 `--var` 1:1

| `--var` | token | 值 |
|---|---|---|
| `--ink` | `palette.ink` | `#0b0d12` |
| `--ink-2` | `palette.ink2` | `#12151e` |
| `--ink-3` | `palette.ink3` | `#1b1f2b` |
| `--ink-4` | `palette.ink4` | `#242938` |
| `--gold` | `palette.gold` | `#c9a24a` |
| `--gold-2` | `palette.gold2` | `#e6c979` |
| `--gold-soft` | `palette.goldSoft` | `rgba(201,162,74,.14)` |
| `--ivory` | `palette.ivory` | `#ece5d6` |
| `--muted` | `palette.muted` | `#8d8674` |
| `--muted-2` | `palette.muted2` | `#615c50` |
| `--line` | `palette.line` | `rgba(233,220,190,.10)` |
| `--line-2` | `palette.line2` | `rgba(233,220,190,.06)` |
| `--ok` | `palette.ok` | `#6f9a6a` |
| `--wx-jin` | `palette.wxJin` | `#d9c9a3` |
| `--wx-mu` | `palette.wxMu` | `#6f9a6a` |
| `--wx-shui` | `palette.wxShui` | `#5a7fa3` |
| `--wx-huo` | `palette.wxHuo` | `#b2564a` |
| `--wx-tu` | `palette.wxTu` | `#b0894f` |

> `wx*` 五行色**仅供八字盘内部数据编码**,禁止作通用 UI 色(spec §3、User Story 11/31)。

## 语义别名 semantic(`./semantic.ts`)

`bg`→ink · `surface`→ink2 · `surfaceInput`→ink3 · `surfaceTrack`→ink4 ·
`textPrimary`→ivory · `textSecondary`→muted · `textFaint`→muted2 ·
`accent`→gold · `accentBright`→gold2 · `accentSoft`→goldSoft ·
`border`→line · `borderFaint`→line2 · `danger`→wxHuo(纠正旧 `theme.ts` 的 `#c05050`)· `success`→ok。

> `danger`→`wxHuo` 是被认可的语义别名(UI 代码取 `semantic.danger`,不直接取 `palette.wxHuo`),
> 不违反「五行色数据专用」——那条针对的是直接引用 `wx*`。

## 字体与字号 typography(`./typography.ts`)

- em 字距 → pt:`tracking(em, fontSize) = em × fontSize`(RN 的 letterSpacing 是 pt,原型是 em)。
- `lineHeight` = 原型倍数 × 字号。字族按字重分文件(RN 自带字体不靠 fontWeight 合成)。
- type ramp 命名行取自 spec §4:`brandName / hSerifXL / hSerifL / hSerifHead / hSerifSec /
  eyebrow / sub / button / bubble / pillarGanZhi`。

## 间距 / 圆角 / 阴影 / 动效

- `spacing`/`gutter`(`./spacing.ts`):`gutter.content=26`、`gutter.header=22` 对应原型 `.pad`/标题留白。
- `radii`(`./radii.ts`):`input=13`(`.input`)、`button=14`(`.btn`)、`md=12`(最常用)、`pill=999`、`round=9999`(50%)。
- `shadows`(`./shadows.ts`):新架构内建 `boxShadow` 字符串,1:1 取自原型 `box-shadow`;`focusRing` 对应
  `.input:focus-within` 的 3px gold-soft 环。
- `motion`(`./motion.ts`):`durations` 取自原型 transition/animation;`easing.standard=[.16,1,.3,1]`;
  `resolveDuration(reduced,ms)` 与 `useReducedMotion()` 实现「减少动态效果」(原型
  `@media (prefers-reduced-motion:reduce)`)。

## 基础层像素 1:1 裁定(spec §Effects,与本 issue 相关部分)

| 细节 | 裁定 |
|---|---|
| bottom-nav `backdrop-filter:blur` | 放弃模糊 → 实色 `rgba(11,13,18,0.92)`(已 92% 不透明);不引 `expo-blur` |
| 阴影 / 焦点环 / 内嵌 | 用新架构内建 `boxShadow`/`filter`(ADR-0005,零依赖) |
| em 字距 | 按字号烘焙 pt,接受 iOS/Android 亚像素漂移 |
| `text-wrap:balance` | RN 无等价 → 自然换行,不手动插 `\n` |
| reanimated/worklets babel 插件 | 不手动加,`babel-preset-expo` 自动注入(见 `babel.config.js` 注释) |
