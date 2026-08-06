import { z } from 'zod';
import { RoleSchema } from './common';

export const SendMessageInputSchema = z.object({
  content: z.string().trim().min(1, '内容不能为空').max(4000),
});
export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;

export const MessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: RoleSchema,
  content: z.string(),
  createdAt: z.string(),
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
