# 11 — Favorites (我的收藏) 1:1

**What to build:** The 我的收藏 list rendered 1:1, reusing the list primitives with a favorite-row variant. A 命主 browses their 收藏 (whole 对话s) as two-line-title rows with a star, searches and pages exactly like history, and sees empty / no-result states.

**Blocked by:** 10.

**Status:** done (commit ad20f65) — 视觉 1:1 双端真机已人工验证通过 ✓（2026-08-07）

- [x] Favorite rows render 1:1 (2-line clamped title, star icon), reusing `SearchBar` / `Pager` / `ListRow`. _(新增 `ListRow` `favorite` 变体 = 原型 `.favtitle` 两行截断；「star」标记按原型实际字形为填充书签 `bookmarkFilled`，`.cico.star` 用 `fill=currentColor`。)_
- [x] Search + pagination reuse the pure predicates from ticket 10 (no logic fork). _(同一 `filterRows`/`normalizeQuery` + `pageView`/`slicePage`，与 history 共用真源。)_
- [x] 收藏 granularity is the whole 对话 (per domain glossary). _(`ConversationApi.list(true)` 取整条对话；`favtitle`→对话标题，省略断语/来源行，见裁定。)_

_Ref: spec §8; CONTEXT.md (收藏 Favorite = 一整条对话)._

## Comments

- Implemented via `/implement`：收藏页 1:1 重写复用 issue 10 的 `SearchBar`/`Pager`/`ListRow` + `src/list/` 纯逻辑（不分叉）；`ListRow` 增 `favorite` 两行截断变体，图标表加填充书签 `bookmarkFilled`。
- 数据边界裁定（禁改 schema，沿用 issue 09/10「不造假」先例）：收藏 = 一整条对话，`favtitle`→`Conversation.title`（schema 上限 60 字，较长两行截断）、**省略** `.csnip`「来自「原对话」」（无独立来源可标注）、收藏标记全行统一金标（分型走 `.ctag`）；原型 placeholder「搜索收藏的断语…」/ listhint「断语与吉时」引用不存在的断语字段，改为「搜索我的收藏…」/「按时间倒序」，aria-label / 无结果文案与原型一致。README 显式裁定表已记。
- 重构：历史/收藏两个二级页逐字一致的衬线标题栏抽为 `TitleBar` primitive（rule-of-two，非过早泛化；`/code-review` Standards 轴的判断项），`history.tsx` 一并收敛，`(app)` 布局对收藏页 `headerShown:false`。
- 验证：`tsc` 干净；`jest` 25 套 / 124 测试全绿（+`TitleBar` 3 + `ListRow` favorite 契约 1，均为观察式行为断言，不断样式）。`expo lint` 同 issue 10 在本环境无法 bootstrap（pnpm build-script 守卫，既有问题，非本次引入）。
- `/code-review`（Standards + Spec 双轴）：Spec 轴零发现（三条验收全过、无越界、裁定可辩护）；Standards 轴三条 stale-doc 硬项（README 标题栏裁定 / `ListRow` 属性文档 / `icons.ts` 填充图标注释）已修，重复代码判断项以 `TitleBar` 提取消解。
- issue 12（contract：移除旧 `theme.ts`/`ui.tsx` 及其残留 import）现应清扫 `src/components/ConversationList.tsx`——收藏页迁移后它已无消费者。
