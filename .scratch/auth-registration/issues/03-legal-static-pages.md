# 03 — 法务静态页

**What to build:** 命主能从 auth 流点开并阅读《用户协议》与《隐私政策》全文，不再面对死链接。新增一个 auth 内的静态页承载两份正文。正文由本票生成——针对本 App 的真实数据面（账号邮箱、命主出生信息、与 AI 的对话内容）撰写的中文占位文案，明确标注「非律师审阅 · v1 占位」，日后可替换为真实法务文本。

**Blocked by:** None — can start immediately.

**Status:** done

- [x] auth 内新增一个可导航到达的法务静态页，能分别展示《用户协议》与《隐私政策》正文。
- [x] 正文为生成的中文占位文案，覆盖账号邮箱、出生信息、AI 对话数据的收集与使用，含「非律师审阅 · v1 占位」标注。
- [x] 用既有 `Screen` / `TitleBar` 承载，风格与 auth 一致；不新造 modal primitive。
- [x] 有返回入口，能回到来源页。

## Comments

- 实现落地：
  - `apps/mobile/src/legal/legalContent.ts` —— 两份占位正文的单一真源（`LEGAL_DOCS` + `LEGAL_DISCLAIMER`），针对本 App 真实数据面（账号邮箱、出生年月日时+地点、与 AI 的对话）撰写；顶部「非律师审阅 · v1 占位」标注。附纯函数 `resolveLegalDoc(param)`：`?doc=` → 文档，缺省/非法/数组回退用户协议（可测缝，令路由页薄接线）。
  - `apps/mobile/src/legal/LegalDocText.tsx` —— 纯展示正文组件（危险色描边的占位标注卡 + 引言 + 分节），色/字全走 token，仿 `FontLicenseText` 抽出以便单测。
  - `apps/mobile/app/(auth)/legal.tsx` —— `(auth)/legal` 路由，`Screen scroll` + `TitleBar`（返回 `router.back()` 回到来源页），标题随 `?doc=` 切换。风格与 licenses/history 二级页一致（pad 顶 2 底 30）。
  - 测试：`legalContent.test.ts`（resolver 5 例）+ `LegalDocText.test.tsx`（两份文档正文/标注/三条数据面 4 例）。全仓 142 tests green，`tsc` clean。
- **边界裁定**：本票只交付「目的页 + 正文 + 可导航到达 + 返回入口」。注册/登录处法务链接**接上 `router.push('/legal?doc=…')`** 属注册/登录重做工单（05/06，二者 blocked by 03）——它们会整屏重写那两屏，此刻改动其死链接会与之冲突并波及已人工验收的 1:1 视觉，故不在本票触碰。路由已注册、可经 `router.push('/legal?doc=terms|privacy')` 到达，满足「可导航到达」。
- 真机视觉为 Screen+TitleBar 既有已验收 primitive 上的纯文本，视觉软门槛为建议、不阻断（同 licenses 页）。上线前须以真实法务文本替换 `legalContent.ts` 的 sections。
