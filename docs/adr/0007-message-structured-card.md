# 消息可携带结构化要点卡(Message.card)

给共享 `Message` 增加可选字段 `card: MessageCard`(`{ title, rows: [{ k, v, ok? }] }`)。assistant 消息可随 `content` 返回一张结构化「要点卡」——对应原型 AI 气泡里的 `.card`(如「乙巳年 · 事业要点」「今日宜忌」):金色衬线标题 + 若干「键—值」行,`ok` 标记「吉/宜」的值走成功色。服务端生成回复时抽取要点并落库,经 SSE `done` 事件随最终消息下发;客户端用 `KvCard` primitive 渲染。纯文本回复不带此字段。

设计系统 spec 的默认是「不改 schema」(Out of Scope),此项是 issue 07 实现期经用户授权的**有意偏离**:要 1:1 还原原型 AI 气泡内的要点卡,而实时消息原本只有 `content` 纯文本。

## Considered Options

- **客户端从 AI 文本正则解析要点卡**:被否。脆弱、与 LLM 输出格式强耦合、易错位。
- **保持纯文本、不渲染卡片**:被否。达不到与原型 1:1。
- **扩展 `Message` schema(选中)**:要点卡由服务端结构化产出,端到端类型安全(zod 单一真源)。

## Consequences

- 契约跨三处:`packages/shared`(`MessageCardSchema` / `MessageSchema` / `ChatStreamEvent`)、`apps/server`(DB schema、AI 抽取 `ai/card.ts` + prompts、`routes/messages`)、`apps/mobile`(`KvCard`)。
- 字段**可选、向后兼容**:历史消息与纯文本回复无 `card`,客户端优雅降级为纯文本。
- 依赖 LLM 稳定产出可解析的结构化要点;产不出时回退纯文本(已实现)。
- 与 [ADR-0004](0004-conversation-typed-by-system.md)(对话按系统分型)正交:card 内容属哪套命理,由其所属对话的系统决定。
