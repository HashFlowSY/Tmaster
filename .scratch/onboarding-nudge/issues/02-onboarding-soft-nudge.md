# 02 — onboarding 软引导化 + 中性默认

> 依据：[spec.md](../spec.md) 实现决策 C、测试缝 3；决策 [ADR-0009](../../../docs/adr/0009-onboarding-nudge-not-login-gate.md)。

**What to build:** 生辰引导页从「事实上必经的 Step 02」改为**可跳过的一次性软引导**：命主可「稍后填写」离开；不再预填示例数据、必须真正填齐才能提交；「农历」暂以「敬请期待」占位、恒留公历以防错盘；页面不再呈现强制多步流程感；保存后进入命盘页。既有采集逻辑（真实起盘 / 原生滚轮 / 省市区取经度 / 时辰未知降级盘）保持不变，本票只做软引导化与中性默认。可经现有命盘空态「去完善生辰」入口独立验证。

**Blocked by:** None — can start immediately.（与票 01 无共享文件，可并行；票 01 到位后「稍后」出口会额外走到「无上一屏 → 进主页」分支）

**Status:** ready-for-human（代码 + 自动化测试完成，待真机人工核对）

- [x] 头部提供离开出口：从点用引导 `push` 进入（有上一屏）时显「返回」并回到来处；从登录/注册 `replace` 进入（无上一屏）时显「稍后」并进入 `/chat`（以 `router.canGoBack()` 区分）。
- [x] 出生地**默认不预选**，命主必须选到区县才可能提交。
- [x] 出生日期 / 时辰在**未经滚轮确认前**显示占位（「—」/「请选择」）、不计入已填。
- [x] 「生成命盘」仅当**出生地选到区县且取到经度、出生日期已确认、且（时辰已选 或 勾了时辰未知）**时方可点击；该提交闸抽成纯函数 `canSubmitBirth`（签名见 spec 实现决策 C），由单测表覆盖各缺项→`false`、齐备/勾未知→`true`（prior art：`formLogic.test.ts`、`regions.test.ts`）。
- [x] 点选「农历」弹出「敬请期待」提示、控件保持在「公历」（`value` 恒 `solar`）；历法**不落库、不改 schema、不随提交发送**。
- [x] 移除三段步骤条；眉标由「Step 02 · 录入生辰」改为「完善生辰」。
- [x] 保存生辰成功后进入 `/chart`。
- [x] 既有采集逻辑（`BirthApi.save`、原生日期/时辰滚轮、Cascader 取真经度、时辰未知降级盘、busy / 错误处理）保持可用，不重写。
- [ ] 真机人工核对（建议、不阻断）：中性默认下无法盲提交、农历弹「敬请期待」、稍后可离开、占位/文案观感正确。

## Implementation Notes

由 `/implement 02` 完成（TDD，提交闸纯函数先写测试后实现）：

- **纯函数 `canSubmitBirth`**（`apps/mobile/src/onboarding/birthForm.ts`）= `locComplete && hasLongitude && dateTouched && (timeUnknown || timeTouched)`（签名 1:1 spec 实现决策 C）。`birthForm.test.ts` 表测 8 例：齐备 / 勾未知替代时辰 → `true`；地点未到区县 / 无经度 / 日期未触 / 时辰未触且未勾未知 → `false`；含「日期恒硬性必填（即便勾未知）」与全空边界（prior art：`formLogic.test.ts`、`regions.test.ts`，纯逻辑无 RN / 无 mock）。
- **`onboarding` 软引导化**（`apps/mobile/app/onboarding.tsx`）：
  - 头部出口以 `router.canGoBack()` 区分——有上一屏显「返回」→`back()`，否则显「稍后」（`marginLeft:auto` 右推）→`replace('/chat')`。
  - 中性默认：`path` 初值 `[]`（`viewForPath([])` 已给「选择省份」占位、无经度、`complete=false`）；引入 `dateTouched`/`timeTouched`，`makeNeutralMoment` 仅作滚轮中性起点，`onMomentChange(d, mode)` 于滚轮确认时按 `mode` 置对应触碰标志；`PickerTile` 内聚「未触显『—』+ muted」、时辰行未触显「请选择」。
  - 提交闸改用 `canSubmitBirth`（读 `loc.complete` / `loc.longitude != null` / 两触碰标志 / `timeUnknown`）。
  - 历法 `onCalendarChange`：点「农历」弹「敬请期待」并**不切换**（`value` 恒 `solar`）；`calendar` 从不进 `BirthApi.save` 载荷，schema 未动。
  - 移除三段步骤条（含 `steps`/`step`/`stepOn` 样式）；眉标「Step 02 · 录入生辰」→「完善生辰」；`titleRow` `paddingTop` 6→24 与登录/注册对齐。
  - 既有 `BirthApi.save` / 原生滚轮 / Cascader 取真经度 / 时辰未知降级盘 / busy·错误处理**未重写**；保存成功仍 `replace('/chart')`。
- 验证：`pnpm -r typecheck` 0 错、`pnpm exec jest` 35 suites / 201 tests 全绿、eslint 变更文件 0 错。`/code-review`（Standards + Spec 双轴）：Spec 0 findings；Standards 0 硬违规，两处判断级 smell（`makeDefaultMoment` 命名、三处 `PickerTile` 占位重复）已就地修复。
