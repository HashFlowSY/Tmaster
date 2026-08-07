# 07 — Chat (对话) 1:1

**What to build:** The conversation home rendered 1:1 — the primary screen. A 命主 sees a centered conversation switcher listing recent 对话, the selected 对话's thread of me/AI 消息 (persona header, gold-tinted self bubbles, AI bubbles with embedded kv cards), a message-entrance animation, and a composer to ask a new question.

**Blocked by:** 06.

**Status:** done (commit c57e08a + 89e0d73) — 视觉 1:1 双端真机核对 = P1 风险项（暂缓，不阻塞）

- [x] `TabDrop` conversation switcher shows the current 对话 label + a recent list, opens/closes with caret rotation, and switches the shown thread.
- [x] Chat bubbles match 1:1: persona header, me (gold-gradient tint) vs AI bubbles, embedded kv cards, `msgin` entrance (reduce-motion aware).
- [x] Composer renders 1:1 with the gradient send button.
- [x] Each 对话 stays typed by its 命理 system (八字 / 奇门, per ADR-0004) — the switcher shows the system tag.

_Ref: spec §8 (Tier-2); CONTEXT.md (对话, 消息)._

## Comments

**Done in `c57e08a`.** New Tier-2 primitives `TabDrop` / `Persona` / `KvCard` / `ChatMessage` / `Composer` + `conversationMeta` pure helper; chat screen converged 1:1 keeping live `ConversationApi` + streaming.

Two decisions during implementation:
- **New-conversation entry:** the prototype's chat-head is switcher-only (no create control), but this screen was the app's only creator. Per user choice, added a 「新对话」entry inside the `TabDrop` menu that prompts 八字/奇门 (ADR-0004).
- **Embedded kv cards:** live messages are plain `content` text, so per user choice the shared `Message` schema gained an optional structured `card` (`MessageCard`); the client renders it via `KvCard`. **Server now emits cards end-to-end** (commit `89e0d73`: `ai/card.ts` extraction + prompts + DB + routes) — the earlier "not yet" follow-up is **resolved** and registered as [ADR-0007](../../../docs/adr/0007-message-structured-card.md). Visual 1:1 (incl. the card) remains part of the P1 real-build review.
