import {
  type Conversation,
  CreateConversationInputSchema,
  SetFavoriteInputSchema,
  apiErrorBody,
} from '@tianji/shared';
import { createId } from '@paralleldrive/cuid2';
import { desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppDeps } from '../app';
import type { AuthVariables } from '../auth/middleware';
import { type ConversationRow, birthProfiles, conversations } from '../db/schema';
import { zJson } from '../http/validate';

function toConversation(r: ConversationRow): Conversation {
  return {
    id: r.id,
    system: r.system,
    title: r.title,
    favorited: r.favoritedAt !== null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

/** 受保护：对话的创建 / 列表 / 收藏。按系统分型，创建后系统不可改（ADR 0004）。 */
export function conversationRoutes({ db }: AppDeps) {
  const app = new Hono<{ Variables: AuthVariables }>();

  app.post('/', zJson(CreateConversationInputSchema), (c) => {
    const userId = c.get('userId');
    const { system, title } = c.req.valid('json');
    // 八字对话需先完善生辰；奇门不需要（ADR 0004）。
    if (system === 'bazi') {
      const profile = db.select().from(birthProfiles).where(eq(birthProfiles.userId, userId)).get();
      if (!profile) {
        return c.json(apiErrorBody('birth_required', '八字对话需先完善生辰'), 409);
      }
    }
    const id = createId();
    const finalTitle = title ?? (system === 'bazi' ? '八字问答' : '奇门起局');
    db.insert(conversations).values({ id, userId, system, title: finalTitle }).run();
    const row = db.select().from(conversations).where(eq(conversations.id, id)).get();
    if (!row) return c.json(apiErrorBody('internal', '创建对话失败'), 500);
    return c.json({ data: toConversation(row) }, 201);
  });

  app.get('/', (c) => {
    const rows = db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, c.get('userId')))
      .orderBy(desc(conversations.updatedAt))
      .all();
    const favoritedOnly = c.req.query('favorited') === 'true';
    const result = (favoritedOnly ? rows.filter((r) => r.favoritedAt !== null) : rows).map(
      toConversation,
    );
    return c.json({ data: result });
  });

  app.put('/:id/favorite', zJson(SetFavoriteInputSchema), (c) => {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const row = db.select().from(conversations).where(eq(conversations.id, id)).get();
    if (!row || row.userId !== userId) {
      return c.json(apiErrorBody('not_found', '对话不存在'), 404);
    }
    const { favorited } = c.req.valid('json');
    db.update(conversations)
      .set({ favoritedAt: favorited ? new Date() : null })
      .where(eq(conversations.id, id))
      .run();
    const updated = db.select().from(conversations).where(eq(conversations.id, id)).get();
    return c.json({ data: toConversation(updated ?? row) });
  });

  return app;
}
