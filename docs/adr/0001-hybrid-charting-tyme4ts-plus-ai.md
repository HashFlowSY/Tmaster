# 混合排盘:八字用 tyme4ts 确定性排盘 + AI 解读,奇门由 AI 生成

八字盘用 `tyme4ts`(纯 JS、零依赖、可跑于 Node 与 RN)在后端确定性算出四柱/十神/藏干/大运,作为 ground truth 注入 DeepSeek 的 system prompt,再由 AI 解读。真太阳时校正(库不自带)按出生经度做,置于 `packages/shared`。

流年随年份变化,不属于「对命主稳定」的命盘,因此不进 `bazi_charts` 快照,而是需要时按具体年份用 tyme4ts 按需推导。

奇门局则完全由 DeepSeek 生成(无成熟开源库,自研排局成本高)。

## Considered Options

- 纯 AI 出盘(八字也交给 AI):被否。LLM 推导干支需精确节气/真太阳时算术,四柱常算错,对命理产品是信任灾难。
- 八字与奇门都自研排局引擎:奇门自研工作量拖慢 v1,推迟。

## Consequences

- 八字盘可信、可缓存(对命主稳定)。
- **奇门局的正确性无法保证** —— DeepSeek 生成的局可能出错。这是 v1 的已知取舍,后续应替换为确定性排局引擎。
