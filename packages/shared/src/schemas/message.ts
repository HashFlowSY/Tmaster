import { z } from 'zod';
import { RoleSchema } from './common';

export const SendMessageInputSchema = z.object({
  content: z.string().trim().min(1, '内容不能为空').max(4000),
});
export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;

/**
 * 消息内嵌的键值卡（对应原型 AI 气泡里的 .card，如「乙巳年 · 事业要点」）。
 * 一条结构化的要点卡：金色衬线标题 + 若干「键—值」行，`ok` 标记吉利/宜的值用成功色。
 * 可选地随 assistant 消息返回，供客户端渲染 KvCard；纯文本回复则不带此字段。
 */
export const MessageCardRowSchema = z.object({
  k: z.string(),
  v: z.string(),
  ok: z.boolean().optional(),
});
export type MessageCardRow = z.infer<typeof MessageCardRowSchema>;

export const MessageCardSchema = z.object({
  title: z.string(),
  rows: z.array(MessageCardRowSchema),
});
export type MessageCard = z.infer<typeof MessageCardSchema>;

export const MessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: RoleSchema,
  content: z.string(),
  createdAt: z.string(),
  /** 可选结构化要点卡（原型 AI 气泡内 .card）；纯文本消息省略。 */
  card: MessageCardSchema.optional(),
});
export type Message = z.infer<typeof MessageSchema>;

/**
 * 流式聊天的 SSE 事件契约。
 * - delta: 增量 token
 * - done:  结束，附最终落库的 assistant message
 * - error: 出错
 */
export const ChatStreamEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('delta'), text: z.string() }),
  z.object({ type: z.literal('done'), message: MessageSchema }),
  z.object({ type: z.literal('error'), message: z.string() }),
]);
export type ChatStreamEvent = z.infer<typeof ChatStreamEventSchema>;
