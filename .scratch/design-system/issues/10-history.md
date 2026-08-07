# 10 — History (历史对话) 1:1

**What to build:** The 历史对话 list rendered 1:1, plus the `SearchBar`, `ListRow`, and `Pager` primitives and the pure list logic. A 命主 browses past 对话 as rows (icon, title, snippet, time, system tag), searches across all pages with a clearable field (client-side), and pages through results; empty and no-result states render.

**Blocked by:** 06.

**Status:** done (commit 938f5ac) — 视觉 1:1 双端真机已人工验证通过 ✓（2026-08-07）

- [x] `ListRow` renders 对话 rows 1:1 (icon, title, snippet, time, system tag). _(primitive supports snippet 1:1; screen omits it — Conversation schema has no preview field, ruling documented per Out-of-Scope「no schema changes」+ issue 09 precedent.)_
- [x] `SearchBar` filters rows across all pages (client-side), shows a clear button, hides the pager while searching, and shows a no-result state; the **search predicate is a pure function with unit tests** (`src/list/listSearch.ts` + `.test.ts`).
- [x] `Pager` renders page controls and computes ranges; the **range computation is a pure function with unit tests** (`src/list/pager.ts` + `.test.ts`).
- [x] Empty state renders when there are no 对话 (`暂无历史对话`).

_Ref: spec §Testing (pure list logic seam); §8._

## Comments

- Implemented via `/implement`: three Tier-2 primitives (`ListRow`/`SearchBar`/`Pager`), two pure-logic modules under `src/list/` (TDD), `relativeTime` promoted to an export, and a 1:1 rewrite of `app/(app)/history.tsx` (headerShown:false + in-content serif title bar).
- Verified: `tsc` clean, 24 suites / 120 tests green. `expo lint` could not bootstrap in this environment (self-install of eslint blocked by pnpm build-script guard) — pre-existing, not introduced here.
- `/code-review` (Standards + Spec): no hard violations; the one Standards judgement-call (`pageView` returned nav fields no production code read) was resolved by trimming the pure model to `{page,totalPages,start,end}` and letting `Pager` derive its own controls. Spec: all four boxes met; snippet/row-tap rulings judged defensible + documented.
- Favorites (issue 11) intentionally untouched: still uses the old `ConversationList` + native stack header; it will reuse these primitives + `src/list/` helpers when refactored.
