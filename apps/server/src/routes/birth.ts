import { BirthProfileInputSchema, apiErrorBody } from '@tianji/shared';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppDeps } from '../app';
import type { AuthVariables } from '../auth/middleware';
import { computeBaziChart } from '../charting/bazi';
import { baziCharts, birthProfiles } from '../db/schema';
import { zJson } from '../http/validate';

/** 受保护：读取/更新命主生辰，写入即重算并覆盖八字盘。 */
export function birthRoutes({ db }: AppDeps) {
  const app = new Hono<{ Variables: AuthVariables }>();

  app.get('/', (c) => {
    const row = db
      .select()
      .from(birthProfiles)
      .where(eq(birthProfiles.userId, c.get('userId')))
      .get();
    if (!row) return c.json(apiErrorBody('not_found', '尚未完善生辰'), 404);
    return c.json({
      data: {
        birthDate: row.birthDate,
        birthTime: row.birthTime,
        timeUnknown: row.timeUnknown,
        birthplace: row.birthplace,
        longitude: row.longitude,
        gender: row.gender,
      },
    });
  });

  app.put('/', zJson(BirthProfileInputSchema), (c) => {
    const userId = c.get('userId');
    const input = c.req.valid('json');
    const now = new Date();

    const existing = db.select().from(birthProfiles).where(eq(birthProfiles.userId, userId)).get();
    if (existing) {
      db.update(birthProfiles)
        .set({ ...input, updatedAt: now })
        .where(eq(birthProfiles.userId, userId))
        .run();
    } else {
      db.insert(birthProfiles)
        .values({ id: createId(), userId, ...input })
        .run();
    }

    const chart = computeBaziChart(input);
    const existingChart = db.select().from(baziCharts).where(eq(baziCharts.userId, userId)).get();
    if (existingChart) {
      db.update(baziCharts)
        .set({ data: chart, computedAt: now })
        .where(eq(baziCharts.userId, userId))
        .run();
    } else {
      db.insert(baziCharts).values({ id: createId(), userId, data: chart }).run();
    }

    return c.json({ data: { ok: true, chart } });
  });

  return app;
}
