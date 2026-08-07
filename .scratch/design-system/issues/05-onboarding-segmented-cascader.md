# 05 — Onboarding (生辰引导) 1:1 + SegmentedControl + Cascader

**What to build:** The 生辰引导 screen rendered 1:1, plus the `SegmentedControl` and `Cascader` primitives. A 命主 records their 出生信息 — 性别 (乾造/坤造) and 历法 (公历/农历) via segmented controls, 年/月/日 + 时辰 pickers, a 时辰未知 checkbox, and an 出生地 cascader down to 区县 — then taps 生成命盘.

**Blocked by:** 04.

**Status:** done (commit c2a5946 + 17d71b5) — 视觉 1:1 双端真机核对 = P1 风险项（暂缓，不阻塞）

- [x] `SegmentedControl` renders options, marks the selected with `accentSoft` fill + inset ring, and calls `onChange` with the chosen option; behavior covered by a component test.
- [x] `Cascader` shows the 省/市/区县 breadcrumb + option list with the ✓ selected marker.
- [x] Onboarding matches the prototype 1:1: steps bar, eyebrow/heading/sub, 性别 & 历法 segmented controls, date + 时辰 pickers, 时辰未知 checkbox, 出生地 cascader + helper text, 生成命盘 button.
- [x] Reuses the `Checkbox` from ticket 04.

_Note: 时辰未知 maps to the domain's Reduced Chart (降级盘) path. Ref: spec §8; CONTEXT.md (出生信息, 真太阳时)._

## Comments

**Follow-up (functional pickers + real longitude), same effort — done.** The initial 1:1 pass shipped the 年/月/日/时辰 tiles as static display seeded with the prototype's demo values (a documented ruling: no datetime dep in the "final four", no picker primitive). A follow-up (new packages authorized by the user) made them functional:

- Added `@react-native-community/datetimepicker` (spinner display; iOS in a dark bottom sheet, Android system dialog) → captures a real 出生时刻; `birthTime` stored as precise `HH:mm` (真太阳时 uses it), 时辰名/区间 derived for display via the pure `src/time/hourBranch.ts` helper.
- `出生地` upgraded from a single fixed Hangzhou value to a curated province→city→district dataset (`src/location/regions.ts`) with real per-city longitudes; the `Cascader` gained an optional `onCrumbPress` for drill-up, and submission gates on reaching a 区县 leaf.
- Pure helpers unit-tested (hourBranch, viewForPath); the transient native spinner documented as native input-chrome exception to the iOS≡Android parity rule (see `app/onboarding.tsx` RULINGS).
- Remaining manual step (per spec's manual-visual QA + dev-build requirement): verify the picker/sheet rendering on a real iOS + Android dev build.
