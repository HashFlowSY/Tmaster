# 01 — Foundation & token substrate

**What to build:** The shared design substrate every screen will sit on — the app's bundled fonts, the typed token module, and the test harness — added *alongside* the existing flat theme so nothing breaks yet. After this, a developer can import one typed module for every color, text style, spacing, radius, shadow, and motion value in the design, get exact per-size letter-spacing from a single converter, and run both test seams. This is the *expand* step of the expand→migrate→contract sequence.

**Blocked by:** None — can start immediately.

**Status:** done — 代码基座（c977866）+ 子集化字体内嵌（2634ee8）+ ESLint 接入（da7435f）。dev build 真机编译/无闪烁 = **P1 风险项（暂缓，不验证）**。

- [x] `react-native-svg`, `expo-linear-gradient`, `react-native-reanimated`(4), `expo-font` installed。**字体已放入,`app.json` 4 条路径指向存在的 `.ttf`,prebuild 不再因缺字体报错**;实际 iOS/Android dev build 编译属人工真机步骤。
- [x] Noto Serif SC (Regular) + Noto Sans SC (Regular/Medium/SemiBold) **已子集化内嵌**(Google Fonts 可变字体经 `_src/instance.py` 实例化 + name 表改名为 stem 双端可解析;再 pyftsubset 子集到 GB2312 全量 6763 汉字 + ASCII/CJK 标点,**四文件合计 9.2 MB**,commit 2634ee8)。dev build 无闪烁待真机确认(P1)。
- [x] Typed token module 导出与原型 `--vars` 1:1 的 palette 原语 + 语义别名层（`src/design/palette.ts`、`semantic.ts`；tokens.md 附对照）。
- [x] Type-ramp + `tracking(em, fontSize)` 得出 spec pt 值；spacing/gutter、radii、shadow(`boxShadow`)、motion token + 减动效 helper（`resolveDuration`/`useReducedMotion`）齐备。
- [x] 旧扁平 theme.ts 未改动、仍编译（共存）。
- [x] 纯逻辑测试 seam（jest-expo）覆盖 tracking/lineHeightFor/resolveDuration 且绿；`@testing-library/react-native` 测试台就位并运行。

> 命名裁定：token 模块最终定于 `src/design/`（ADR-0005 已认定为最终位置，不改名）。当初未用 spec 初稿的 `src/theme/`，是因 `theme.ts` 会遮蔽同名目录、与共存冲突；contract 删 `theme.ts` 后本可改名，但已决定保留 `src/design/`。见 `apps/mobile/src/design/tokens.md`。

_Ref: spec §2–§6; ADR-0005 (no styling library), ADR-0006 (bundled fonts)._
