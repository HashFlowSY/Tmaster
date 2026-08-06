import { zValidator } from '@hono/zod-validator';
import { type ChatStreamEvent, type Message, SendMessageInputSchema } from '@tianji/shared';
import { createId } from '@paralleldrive/cuid2';
import { asc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { AppDeps } from '../app';
import type { AuthVariables } from '../auth/middleware';
import type { ChatMessage } from '../ai/deepseek';
import { streamChat } from '../ai/deepseek';
import { buildChatMessages } from '../ai/prompts';
import { type MessageRow, baziCharts, conversations, messages } from '../db/schema';

/** 北京时间（UTC+8）墙钟字符串，如 "2026-08-06 14:30:00（北京时间 UTC+8）"。 */
function beijingNowText(): string {
  const shifted = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const wall = shifted.toISOString().replace('T', ' ').slice(0, 19);
  return `${wall}（北京时间 UTC+8）`;
}

function toMessage(r: MessageRow): Message {
  return {
    id: r.id,
    conversationId: r.conversationId,
    role: r.role,
    content: r.content,
    createdAt: r.createdAt.toISOString(),
  };
}

/** 受保护：对话内消息的读取与发送（发送走 SSE 流式）。挂在 /conversations 下。 */
export function messageRoutes({ db, env }: AppDeps) {
  const app = new Hono<{ Variables: AuthVariables }>();

  app.get('/:id/messages', (c) => {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const conv = db.select().from(conversations).where(eq(conversations.id, id)).get();
    if (!conv || conv.userId !== userId) {
      return c.json({ error: { code: 'not_found', message: '对话不存在' } }, 404);
    }
    const rows = db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt))
      .all();
    return c.json(rows.map(toMessage));
  });

  app.post('/:id/messages', zValidator('json', SendMessageInputSchema), async (c) => {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const conv = db.select().from(conversations).where(eq(conversations.id, id)).get();
    if (!conv || conv.userId !== userId) {
      return c.json({ error: { code: 'not_found', message: '对话不存在' } }, 404);
    }
    const { content } = c.req.valid('json');

    // 落库用户消息
    db.insert(messages)
      .values({ id: createId(), conversationId: id, role: 'user', content })
      .run();

    // 组装上下文：八字对话注入命盘 ground truth
    const system = conv.system;
    const chartRow =
      system === 'bazi'
        ? db.select().from(baziCharts).where(eq(baziCharts.userId, userId)).get()
        : undefined;
    const history: ChatMessage[] = db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt))
      .all()
      .map((m) => ({ role: m.role, content: m.content }));
    // 奇门按「起局的当下时间」，且全应用锚定东八区，故用北京时间而非 UTC（ADR 0004）。
    const nowText = beijingNowText();
    const outbound = buildChatMessages(system, {
      chart: chartRow?.data ?? null,
      nowText,
      history,
    });

    const deepseek = {
      apiKey: env.DEEPSEEK_API_KEY,
      baseUrl: env.DEEPSEEK_BASE_URL,
      model: env.DEEPSEEK_MODEL,
    };

    return streamSSE(c, async (stream) => {
      let acc = '';
      try {
        for await (const delta of streamChat(deepseek, outbound)) {
          acc += delta;
          const ev: ChatStreamEvent = { type: 'delta', text: delta };
          await stream.writeSSE({ data: JSON.stringify(ev) });
        }
        const assistantId = createId();
        db.insert(messages)
          .values({ id: assistantId, conversationId: id, role: 'assistant', content: acc })
          .run();
        db.update(conversations)
          .set({ updatedAt: new Date() })
          .where(eq(conversations.id, id))
          .run();
        const saved = db.select().from(messages).where(eq(messages.id, assistantId)).get();
        if (saved) {
          const ev: ChatStreamEvent = { type: 'done', message: toMessage(saved) };
          await stream.writeSSE({ data: JSON.stringify(ev) });
        }
      } catch (err) {
        const ev: ChatStreamEvent = {
          type: 'error',
          message: err instanceof Error ? err.message : '生成失败',
        };
        await stream.writeSSE({ data: JSON.stringify(ev) });
      }
    });
  });

  return app;
}
