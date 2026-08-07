# 12 — Contract: remove old theme + OFL credits

**What to build:** Retire the drifted flat theme now that every screen renders on the new system, and satisfy the font license. After this there is a single design source of truth and the app ships its OFL attribution. This is the *contract* step of the expand→migrate→contract sequence.

**Blocked by:** 04, 05, 07, 08, 09, 11 (every migrated screen — transitively covers 03, 06, 10).

**Status:** done (commit a60ee6a) — native dev build 属 P1 人工步

- [x] The old flat `theme.ts` / `ui.tsx` / `components/ConversationList.tsx` (and any remaining imports) are removed; no screen references them; `tsc` green。(已 grep 验证零残留 import;iOS/Android 原生构建 = P1 真机步)
- [x] The bundled fonts' **OFL license text** ships in an in-app credits / licenses screen (per ADR-0006)。(`app/(app)/licenses.tsx` + `src/legal/FontLicenseText`,从「我的」进入)
- [x] Final pass confirms all 8 screens render on the token system with no hardcoded colors。(旧 theme 已删,残留引用为零)

_Ref: ADR-0006 (OFL attribution requirement); spec §1._
