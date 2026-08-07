import { apiErrorBody } from '@tianji/shared';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppDeps } from '../app';
import type { AuthVariables } from '../auth/middleware';
import { baziCharts } from '../db/schema';

/** 受保护：读取当前用户的八字盘（供命盘页展示）。 */
export function chartRoutes({ db }: AppDeps) {
  const app = new Hono<{ Variables: AuthVariables }>();

  app.get('/', (c) => {
    const row = db.select().from(baziCharts).where(eq(baziCharts.userId, c.get('userId'))).get();
    if (!row) return c.json(apiErrorBody('not_found', '请先完善生辰'), 404);
    return c.json({ data: row.data });
  });

  return app;
}
