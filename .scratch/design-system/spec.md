---
title: 天机移动端设计系统 Spec
description: 把 docs/ui/tianji-app-design.html 原型 1:1 落到 Expo/RN 的设计系统——token 架构、字体、依赖、primitive 与 8 屏改造。
---

# 天机移动端设计系统 Spec

Status: done（代码 + P1 真机双端视觉 1:1 人工验证均已通过，2026-08-07）

> 相关决策:[ADR-0005 原生 StyleSheet + token,不引入样式库](../../docs/adr/0005-native-stylesheet-design-tokens.md) · [ADR-0006 设计系统自持字体](../../docs/adr/0006-design-system-owns-type-bundled-fonts.md) · 参考原型 `docs/ui/tianji-app-design.html`

## Problem Statement

天机 App 的移动端每个页面各自为政:现有 `apps/mobile` 的样式从设计原型**严重跑偏**——背景是中性灰 `#121212` 而非暖墨 `#0b0d12`、文字是纯灰而非象牙、只有一个扁平金色而非金色渐变体系、没有衬线标题、没有字距、按钮圆角与阴影都不对。命主在不同页面之间会感到风格断裂,产品显得廉价、不可信;开发者每加一个界面都在重复猜测色值与间距,且 iOS 与 Android 表现不一致。项目已有一份打磨好的单文件交互原型,却没有任何机制把它落到真实 App 里。

## Solution

以设计原型 `docs/ui/tianji-app-design.html` 为唯一真源,在 `apps/mobile`(Expo SDK 57 / RN 0.86 / 新架构)搭一套**设计系统**:一个类型化的 token 模块(色/字/距/圆角/阴影/动效)+ 一组跨屏复用的 primitive 组件,然后把现有 8 个页面逐一收敛到这套系统上,做到与原型**严格 1:1**(以「iOS 与 Android 双端渲染一致」为 1:1 判据)。命主由此在所有页面得到统一、精致、可信的深色玄学风格,且两端观感一致;开发者获得单一真源与可组合的 primitive,不再硬编码。视觉忠实度由人工双端核对保证,可回归的逻辑由自动化测试兜底。

## User Stories

1. As a 命主, I want every screen to share one dark, gold-accented visual language, so the app feels like a single coherent product instead of stitched-together pages.
2. As a 命主, I want Chinese titles set in a proper serif (宋/明体气质), so the 命理 content reads as authoritative and traditional.
3. As a 命主, I want body text in a clean sans, so long 解读 passages stay comfortable to read.
4. As a 命主 on Android, I want exactly the same typography and look as on iOS, so my device doesn't feel second-class.
5. As a 命主, I want the gold accent used consistently for primary actions and highlights, so I always know what is tappable or important.
6. As a 命主, I want the login screen's brand mark, starfield, and breathing glow, so my first impression matches the mystical brand.
7. As a 命主, I want form inputs to show a clear gold focus ring, so I know which field I am editing.
8. As a 命主 entering my 出生信息 in 生辰引导, I want the 性别/历法 segmented controls and the「时辰未知」checkbox styled consistently, so the flow feels polished.
9. As a 命主, I want 对话 chat bubbles (mine vs. AI) visually distinct with the gold-tinted self bubble, so I can follow the conversation.
10. As a 命主, I want my 命盘 rendered with the four 柱, five-element coloring, and balance bars exactly as designed, so the chart is legible and on-brand.
11. As a 命主, I want five-element colors used *only* inside the 命盘 as data encoding, so color meaning stays unambiguous everywhere else.
12. As a 命主 on 我的, I want my stats and menu list styled consistently, so navigation feels familiar.
13. As a 命主, I want 历史对话 and 我的收藏 rows, search, and pagination to look and behave consistently, so browsing past 对话 is effortless.
14. As a 命主, I want tap feedback (press states) on buttons and rows, so the app feels responsive.
15. As a 命主 who enables reduce-motion, I want animations to respect that setting, so the app stays comfortable and accessible.
16. As a 命主, I want the app to use the real device status bar and safe areas, so content is never clipped by the notch or home indicator.
17. As a 命主, I want consistent loading, empty, and search-cleared states in the list screens, so the app never feels broken when there is nothing to show.
18. As a developer, I want a single typed token module as the source of truth for color/type/spacing/radii/motion, so I never hardcode a hex value again.
19. As a developer, I want palette primitives named identically to the prototype's CSS `--vars`, so I can grep the HTML and find the token 1:1.
20. As a developer, I want a semantic alias layer (bg/surface/textPrimary/accent…), so component code reads by role, not by raw color.
21. As a developer, I want the drifted flat `theme.ts`/`ui.tsx` replaced, so no screen keeps using the wrong grays or single flat gold.
22. As a developer, I want a set of Tier-1 primitives (Screen, Icon, type atoms, Button, Field, SegmentedControl, Card, BottomNav), so I compose screens instead of re-styling from scratch.
23. As a developer, I want an Icon primitive wrapping the prototype's SVG paths, so all ~22 icons render identically and accept a color prop.
24. As a developer, I want the em letter-spacing expressed through a converter, so I get exact per-size pt values without manual arithmetic errors.
25. As a developer, I want the system built on plain StyleSheet with no styling library, so there is no build or runtime lock-in.
26. As a developer, I want bundled fonts embedded at build time, so there is no font-flash and Android renders the serif reliably.
27. As a developer refactoring a screen, I want the specialized components (chat bubbles, pillars, cascader, pager) built only when I reach that screen, so I do not speculatively build unused parts.
28. As a developer, I want the interactive primitives' behavior covered by tests, so refactors do not silently break onPress/onChange wiring.
29. As a developer, I want the pixel-1:1 exceptions documented as explicit rulings, so I do not chase impossible parity.
30. As a developer, I want the mock-frame elements explicitly excluded, so I never build a fake status bar or phone bezel.
31. As a developer, I want the 命盘 five-element colors available as tokens but flagged data-only, so I do not reach for them as general UI colors.
32. As a design maintainer, I want the font choice and the no-styling-library choice recorded as ADRs, so future contributors do not silently undo them.
33. As a design maintainer, I want the OFL license text shipped in an app credits screen, so we stay compliant when redistributing the bundled fonts.
34. As a design maintainer, I want a `--var`→token mapping kept beside the code, so the prototype stays the reviewable source of truth as the system evolves.
35. As a maintainer, I want the migration to pause after the login screen for a real-build checkpoint, so token and font problems surface before all screens are converted.

## Implementation Decisions

### Foundation & module shape
- Native RN `StyleSheet` + a **typed token module** in the mobile app's source (`src/design/`); **no styling library** (ADR-0005). The token module is plain TS, `tsc`-checked, zero runtime cost.
- The existing flat `theme.ts` and `ui.tsx` are **replaced** by this module and the new primitives.
- Tokens are **two-layer**: (1) **palette primitives** named 1:1 with the prototype CSS `--vars`; (2) a **semantic alias** layer consumed by component code.

**Palette primitives (values are the decision — 100% from the prototype `:root`):**
```
ink #0b0d12  ink2 #12151e  ink3 #1b1f2b  ink4 #242938
gold #c9a24a  gold2 #e6c979  goldSoft rgba(201,162,74,0.14)
ivory #ece5d6  muted #8d8674  muted2 #615c50
line rgba(233,220,190,0.10)  line2 rgba(233,220,190,0.06)  ok #6f9a6a
# 五行 — 命盘内数据编码专用,禁止作通用 UI 色
wxJin #d9c9a3  wxMu #6f9a6a  wxShui #5a7fa3  wxHuo #b2564a  wxTu #b0894f
```

**Semantic aliases:** `bg`→ink · `surface`→ink2 · `surfaceInput`→ink3 · `surfaceTrack`→ink4 · `textPrimary`→ivory · `textSecondary`→muted · `textFaint`→muted2 · `accent`→gold · `accentBright`→gold2 · `accentSoft`→goldSoft · `border`→line · `borderFaint`→line2 · `danger`→wxHuo(纠正现 `theme.ts` 的 `#c05050`) · `success`→ok.

### Typography
- **Bundle Noto Serif SC (标题) + Noto Sans SC (正文) on both platforms** (ADR-0006). RN `fontFamily` points at these families; the `"Songti SC"`/`"PingFang SC"` names are removed.
- `letterSpacing` is **pt, not em** → a `tracking(em, fontSize)` converter (`pt = em × fontSize`) bakes exact values per text style. `lineHeight` = prototype multiple × size. `text-wrap:balance` has no RN equivalent → natural wrapping.
- Named **type ramp** (size / tracking em→pt / lineHeight), representative rows — full set derived 1:1 from the prototype:

| style | family | size | tracking | lineHeight |
|---|---|---|---|---|
| brandName | serif | 34 | .42em→14.28 | — |
| hSerifXL / hSerifL | serif | 28 / 26 | .06em→1.68 / .04em→1.04 | 1.15 |
| hSerifHead / hSerifSec | serif | 21 / 16 | .10em→2.10 / .14em→2.24 | — |
| eyebrow | sans | 11 | .32em→3.52 | — (uppercase) |
| sub | sans | 13.5 | — | 1.75 |
| button | sans | 15 | .14em→2.10 | — (weight 600) |
| bubble | sans | 14.5 | — | 1.72 |
| pillarGanZhi | serif | 27 | — | 1.25 (五行色) |

- Weights: body 400, emphasis `b`/options 500, buttons 600. `fontVariant:['tabular-nums']` on times/numbers/命盘 values.

### Fonts (delivery)
- `expo-font` **build-time config plugin** (not runtime `useFonts` — avoids font-flash); needs a dev build (project already uses `expo run:ios/android`).
- Weights bundled: serif **Regular**; sans **Regular / Medium / SemiBold** (4 files). Format **TTF/OTF** (Android embedding rejects woff2). **Subset** to ~4,000 common hanzi + ASCII + CJK punctuation → ~1.5–3 MB/weight, **~6–10 MB per binary**.
- SIL OFL 1.1: free commercial embedding; ship `OFL.txt` in an app credits screen.

### Dependencies (final four)
- `react-native-svg` — ~22 line icons + login 罗盘 mark + radial-gradient spheres (avatar / prof-avatar / mark glow).
- `expo-linear-gradient` — gold fills (`.btn-primary`, `.send`, self-bubble).
- `react-native-reanimated` — `msgin`/`screenin` entrances, `breathe`, caret/menu/focus-ring tweens. (`twinkle`/`spin`/`toast` use built-in `Animated`, no dep.)
- `expo-font` — bundled CJK fonts.
- **Not** `expo-blur`. Shadows/rings/insets use **new-architecture built-in `boxShadow`/`filter`** (zero-dep).

> **Implementation deviations (registered after the fact).** Three things landed beyond this section's "final four" / "no schema changes" defaults, each user-authorized during the build:
> 1. **5th dep `@react-native-community/datetimepicker`** (issue 05) — for the onboarding 出生时刻 picker; native spinner logged as an iOS≡Android parity exception.
> 2. **`Message.card` schema extension** ([ADR-0007](../../docs/adr/0007-message-structured-card.md)) — optional structured 要点卡 on assistant messages, crossing `packages/shared` + server + mobile, so the AI-bubble `.card` renders 1:1 from structured data instead of parsed text.
> 3. **Chat「新对话」entry** (issue 07) — the prototype's chat-head is switcher-only, but this screen is the app's sole conversation creator, so a create entry was added inside `TabDrop` (prompts 八字/奇门 per ADR-0004).

### Effects & pixel-1:1 rulings (confirmed)
| detail | ruling |
|---|---|
| bottom-nav `backdrop-filter:blur` | drop blur → solid `rgba(11,13,18,0.92)` (already 92% opaque) |
| avatar / prof-avatar off-center radial | `react-native-svg` `RadialGradient` |
| login `.mark .glow` | SVG `RadialGradient` + Reanimated opacity pulse |
| `breathe` animated shadow | Reanimated **opacity** on a glow layer (shadow not natively animatable) |
| `text-wrap:balance` | natural wrapping (no manual `\n`) |
| consent /「时辰未知」checkbox (`accent-color`) | custom gold Checkbox component |
| em letter-spacing | per-style pt bake; accept sub-pixel iOS/Android drift |

### Primitives
- **Tier-1 (build first, ≥3-screen reuse), with prop-level interfaces:**
  - `Screen({ scroll? })` — safe-area + `bg` + content padding (content 26 / header 22); real OS status bar, **no fake status bar**.
  - `Icon({ name, color, size })` — react-native-svg wrapper over the prototype paths; `stroke=currentColor`→`color`.
  - Type atoms — `Eyebrow`, `HSerif({ variant })`, `Sub`, `TextMute`.
  - `Button({ variant:'primary'|'ghost', breathe?, disabled?, onPress })` — primary = gold gradient + gold-glow `boxShadow` + r14; press scale; `breathe` via Reanimated.
  - `Field({ label, icon?, suffix?, onFocus/onBlur ring, ...TextInputProps })` — leading icon, optional suffix, gold focus ring driven by focus state.
  - `SegmentedControl({ options, value, onChange })` — selected = `accentSoft` fill + inset ring.
  - `Card({ surface?, padded? })` — bordered surface container.
  - `BottomNav` — integrated with expo-router Tabs; solid `bg@92%`; selected `accentBright`.
- **Tier-2 (build when the owning screen is refactored):** `ListRow`, `SearchBar`, `Pager`, `TabDrop` + chat-bubble set, `Pillars`/`Palace`, `StatTile`, `Cascader`, `Toast`, custom `Checkbox`.
- `.chip` is mock page-switcher chrome — **not** a component.

### Screen migration
- Screens routed by expo-router (the prototype's `.screen` show/hide is replaced by routes). Refactor order: **login → register → onboarding → chat → chart → profile → history → favorites** (auth exercises Button/Field/type; onboarding adds SegmentedControl/Cascader/Checkbox; chat sits mid-sequence to stress-test the richest screen; list pages last). `BottomNav` lands with the `(app)` group.
- **Checkpoint:** after foundation + **login**, pause for a real-build review of tokens + font rendering before rolling out the remaining screens.

### Mock-frame exclusions (do **not** build)
`.board`/`.board-top`/罗盘 logo/`.board-sub`/`.chips`(→ expo-router)、`.stage`、`.phone` bezel + shadows、`.phone::after` notch、`.statusbar` fake status bar(`9:41`/signal dots/battery)、`.board-note`、`100dvh` sizing. Everything inside the frame is real content.

## Testing Decisions

**What makes a good test here:** assert **observable external behavior only** — never styles, token constants, or SVG paths. Asserting "a hex equals a hex" or "this style has borderRadius 14" is a change-detector, not a test; visual fidelity is verified **manually on both platforms** (per the platform decision), not by snapshots. Two seams:

1. **Pure-logic seam (existing infra).** Unit-test pure functions with the existing `jest-expo` setup, mirroring prior art [url.test.ts](../../apps/mobile/src/api/url.test.ts) and [trueSolarTime.test.ts](../../packages/shared/src/time/trueSolarTime.test.ts):
   - the `tracking(em, fontSize)` em→pt converter (representative sizes → expected pt);
   - when Tier-2 lands: the **list-search predicate** (cross-page text match, cleared-state behavior) and the **pager range** computation — extracted as pure helpers and tested as functions, *not* through their components.

2. **Component-behavior seam (one new setup).** Introduce `@testing-library/react-native` (a single shared test setup — the only new seam) and test the interactive primitives' behavior via accessibility roles/labels and callback spies:
   - `Button` fires `onPress`, and is inert when `disabled`;
   - `Field` forwards `value`/`onChangeText` and reports focus via its callback (not via asserting the ring's style);
   - `SegmentedControl` calls `onChange` with the selected option;
   - custom `Checkbox` toggles `checked` and fires `onChange`.

   Prefer querying by accessible role/label over test IDs; never assert on `style` objects.

**Modules tested:** the `theme` tracking converter (+ later the list/pager helpers); the interactive Tier-1 primitives (`Button`, `Field`, `SegmentedControl`) and the Tier-2 `Checkbox`. **Not** tested: `Screen`/`Card`/`Icon` (presentational/constant), exact colors/spacing/type, and screen layouts (manual visual).

## Out of Scope

- Any server/API/schema changes; the shared zod schemas; all 命理 computation (排盘/AI 解读).
- New product features or new screens beyond the existing 8; wiring up「敬请期待」placeholders (e.g. non-email login).
- Web and tablet targets; a light theme (dark is locked, no inversion); i18n/localization.
- Automated visual-regression / pixel-diff / screenshot tests; Android-emulator automation (Android verified manually by the user).
- The dropped `expo-blur` backdrop blur.
- Building Tier-2 specialized components ahead of their owning screen's refactor.

## Further Notes

- **1:1 caveat:** Noto Serif ≠ Apple Songti at the glyph level, so the result is not byte-identical to the prototype as rendered in a Mac browser; "1:1" here means **iOS ≡ Android** (the achievable target given Apple fonts are unlicensable on Android).
- **Live risk (tracked, not solved):** RN new-arch iOS Fabric CJK-input bug (#56463) affects *typing* Chinese in the 对话 composer and search, not static display.
- **`boxShadow` on Android** is young in the new architecture — verify each screen's shadows/rings on a real Android device.
- **Dev build required** for the embedded fonts (not Expo Go).
- After approval, split the migration into `.scratch/design-system/issues/NN-*.md` tickets per `docs/agents/issue-tracker.md`.

## Risks（风险）

- **P1 —— 视觉 1:1 双端真机核对：已人工验证通过 ✓（2026-08-07）。** 维护者在 iOS + Android dev build 上核对字体渲染、`boxShadow` 焦点环/阴影、金渐变、登录星野光点、原生 `datetimepicker` chrome,视觉验收全部闭环。字形差(Noto ≠ Songti)、`boxShadow`-Android、生辰页原生 spinner 例外均已确认可接受。
- **仍存的运行时风险(与视觉无关,未关闭):** RN 新架构 iOS Fabric CJK 输入法合成缺陷 #56463——影响对话 composer / 搜索的中文**输入**,非静态显示;待上游修复或规避。
- **命名已定(原 P4 尾巴,已闭合):** token 模块目录定为 `src/design/`,ADR-0005 已认定为最终位置;原 issue 01「contract 后改名回 `src/theme/`」的可选项**作废**,不改名。
