import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import { sessions } from '../db/schema';

/** 新建登录会话，返回 sid（写入 JWT）。 */
export function createSession(db: Db, userId: string): string {
  const id = createId();
  db.insert(sessions).values({ id, userId, lastActivityAt: new Date() }).run();
  return id;
}

/**
 * 校验会话是否有效并滑动刷新其活跃时间。
 * 超过 idleMs 未活动即删除并返回 null（6h 滑动过期，ADR 0003）。
 */
export function touchSession(db: Db, sid: string, idleMs: number): { userId: string } | null {
  const row = db.select().from(sessions).where(eq(sessions.id, sid)).get();
  if (!row) return null;
  const now = Date.now();
  if (now - row.lastActivityAt.getTime() > idleMs) {
    db.delete(sessions).where(eq(sessions.id, sid)).run();
    return null;
  }
  db.update(sessions).set({ lastActivityAt: new Date(now) }).where(eq(sessions.id, sid)).run();
  return { userId: row.userId };
}

/** 登出：删除会话记录以吊销 token。 */
export function revokeSession(db: Db, sid: string): void {
  db.delete(sessions).where(eq(sessions.id, sid)).run();
}
