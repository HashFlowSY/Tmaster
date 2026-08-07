# 06 — (app) shell + BottomNav

**What to build:** The logged-in route group and its bottom navigation, so the main app screens have a home. A 命主 in the app sees a persistent bottom nav (对话 / 命盘 / 我的) with a solid near-opaque bar and a gold-highlighted active tab, and can switch between the main sections.

**Blocked by:** 02.

**Status:** done (commit 7477856) — 视觉待真机核对(P1)

> Branches off core primitives (02) in parallel with the auth screens (soft gate) — does not wait on the login review.

- [x] The (app) route group/shell exists; chat / chart / profile / history / favorites route under it。(`app/(app)/_layout.tsx` + `(tabs)` 分组)
- [x] `BottomNav` renders tabs with a **solid `bg@92%`** bar (no blur, per ruling), gold-bright active state, and navigates between sections。
- [x] Uses `Icon` + tokens; integrates with expo-router。

_Ref: spec §7 (blur dropped → solid nav); §8._
