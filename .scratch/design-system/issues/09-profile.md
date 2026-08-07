# 09 — Profile (我的) 1:1

**What to build:** The 我的 screen rendered 1:1. A 命主 sees their avatar + name + uid, a stats row (累计提问 / 收藏), and a menu (我的命盘 / 历史对话 / 我的收藏 / 退出登录), with a toast on actions and a danger-styled logout.

**Blocked by:** 06.

**Status:** done (commit cdb5710) — 视觉 1:1 双端真机核对 = P1 风险项（暂缓，不阻塞）

- [x] Profile matches 1:1: prof avatar (radial), name/uid, VIP-style badge if present.
- [x] `StatTile` renders 累计提问 / 收藏 with tabular numerals.
- [x] Menu rows render with icons; 退出登录 uses the `danger` token.
- [x] `Toast` primitive appears for placeholder / confirm actions.

_Ref: spec §8; CONTEXT.md (User vs 命主 — v1 命主 = current User)._
