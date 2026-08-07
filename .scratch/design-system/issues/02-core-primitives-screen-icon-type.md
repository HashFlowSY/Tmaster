# 02 — Core primitives: Screen · Icon · type atoms

**What to build:** The presentational scaffolding shared by every screen: a `Screen` wrapper (safe-area, ink background, content padding, the real OS status bar — no fake status bar), an `Icon` that renders the prototype's ~22 line icons and the login luopan mark from real SVG paths and takes a `color` prop, and the typography atoms (`Eyebrow`, `HSerif`, `Sub`, `TextMute`) wired to the type ramp.

**Blocked by:** 01.

**Status:** done — 见 `apps/mobile/src/design/primitives/`（Screen/Icon/字体原子/LoginMark + Icon.test）。typecheck 绿、全量测试绿。视觉忠实度待 dev build(含字体二进制,issue 01 人工步)于登录检查点人工核对。

- [x] `Screen` renders content within safe-area insets over the `bg` token, with content-vs-header horizontal padding per spec, and **no fake status bar / notch**。(`Screen.tsx`:SafeAreaView + `semantic.bg` + `gutter.content=26`/`header=22`;不画假状态栏,用 `app/_layout` 的真 OS 状态栏。)
- [x] `Icon` renders each of the ~22 prototype icons + the login mark from ported SVG paths; `color` / `size` props work; a component test asserts it renders。(`icons.ts` 注册 22 个线性图标 + `LoginMark.tsx` 登录标记;`Icon` 收 `color`/`size`/`strokeWidth`/`accessibilityLabel`;`Icon.test.tsx` 断言全量渲染 + LoginMark 渲染。)
- [x] `Eyebrow` / `HSerif` (variants) / `Sub` / `TextMute` render with the correct family / size / tracking / lineHeight from the token type ramp。(`Type.tsx` 薄封装 `typeRamp`;HSerif variants=brand/xl/l/head/sec。)
- [x] Five-element colors exist as tokens but are documented data-only (not used by these atoms)。(issue 01 已把 `wx*` 落在 `palette` 且 `tokens.md` 标数据专用;本 issue 原子零 `wx*` 引用,已 grep 验证。)

> 裁定见 `apps/mobile/src/design/primitives/README.md`:登录标记为何独立于 `Icon`、strokeLinecap=round、Screen 两档留白、TextMute 复用 sub 度量等(spec User Story 29)。

_Ref: spec §8 (Tier-1); §10 mock-frame exclusions._
