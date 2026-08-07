# 08 — Chart (命盘) 1:1

**What to build:** The 命盘 screen rendered 1:1. A 命主 sees their 八字盘 as a card — the four 柱 (年/月/日/时) with 天干/地支 in five-element color, 十神 and 藏干, a five-element balance with bars, and the 奇门局 palace grid.

**Blocked by:** 06.

**Status:** done (commit d3b21bc) — 视觉 1:1 双端真机核对 = P1 风险项（暂缓，不阻塞）

- [x] Chart card matches 1:1: 命主 meta, four 柱 with 五行-colored 干支, 十神, 藏干.
- [x] Five-element balance bars render with the correct data-encoding colors.
- [x] 奇门 palace 3×3 grid renders with center + 值符 emphasis.
- [x] Five-element colors are used **only** here (data encoding), per spec.

_Ref: spec §8 (Pillars/Palace are text + Views, not SVG); CONTEXT.md (八字盘, 奇门局)._

## Comments

**已实现（commit d3b21bc）** — 新 primitive：`Card`(Tier-1) · `Pillars`/`ElementBars`/`QiMenGrid`(Tier-2，text+View 非 SVG)；新 `src/chart/fiveElement.ts`(干支→五行查表 + 清点四柱派生五行强弱，纯函数 TDD，全 App 唯一引用 `palette.wx*` 之处)；重构 `app/(app)/(tabs)/chart.tsx`。typecheck 通过、jest 78 全绿、/code-review 双轴通过（Standards 无硬违规、Spec 忠实）。

数据边界裁定（spec Out of Scope：禁改 schema、不做排盘/命理计算）：
- 五行强弱由四柱天干+地支清点派生（与原型示例盘 0/3/0/3/2 及条宽 6/78/6/78/52 对齐），是既有盘数据可视化，非新排盘。
- 命主姓名不在 schema，故 meta 首行用命造（乾/坤）；出生地/时间取自 `BirthApi`，真太阳时校正就地计算。
- 喜用神/忌神·身强弱属命理判断（out of scope），不编造 → 省略五行强弱卡页脚（保留真实计数 + 「日主己土」注）。
- 奇门局无结构化 API（ADR-0001 由 AI 在对话文本中实时起局）→ 以 `SAMPLE_QIMEN` 示例排布演示 `QiMenGrid` 版式，标题注「示例排布」不谎称真实今日局。
- 大运：原型此屏无（以奇门取代），删去屏上列表；`ChartApi.decadeFortunes` 数据仍在，未来可另起页承载。

**待人工验收**：视觉 1:1 需 iOS+Android 双端真机核对（spec 判据）；本 issue 属 checkpoint 后批量改造之一。
