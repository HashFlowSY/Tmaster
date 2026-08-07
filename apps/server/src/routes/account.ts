import { apiErrorBody } from '@tianji/shared';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppDeps } from '../app';
import type { AuthVariables } from '../auth/middleware';
import { revokeSession } from '../auth/session';
import { users } from '../db/schema';

/** 受保护：当前用户信息与登出。 */
export function accountRoutes({ db }: AppDeps) {
  const app = new Hono<{ Variables: AuthVariables }>();

  app.get('/me', (c) => {
    const user = db.select().from(users).where(eq(users.id, c.get('userId'))).get();
    if (!user) return c.json(apiErrorBody('not_found', '用户不存在'), 404);
    return c.json({
      data: { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() },
    });
  });

  // 登出：删除服务端会话以吊销 token（ADR 0003）。
  app.post('/logout', (c) => {
    revokeSession(db, c.get('sessionId'));
    return c.json({ data: { ok: true } });
  });

  return app;
}
