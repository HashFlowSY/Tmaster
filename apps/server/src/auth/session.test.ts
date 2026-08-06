import { createId } from '@paralleldrive/cuid2';
import { describe, expect, it } from 'vitest';
import { createDb } from '../db/client';
import { applyMigrations } from '../db/migrate';
import { users } from '../db/schema';
import { createSession, revokeSession, touchSession } from './session';

function setup() {
  const { db } = createDb(':memory:');
  applyMigrations(db);
  const userId = createId();
  db.insert(users).values({ id: userId, email: `${userId}@t.test`, passwordHash: 'x' }).run();
  return { db, userId };
}

describe('session', () => {
  it('创建后可在闲置窗口内 touch，返回归属用户', () => {
    const { db, userId } = setup();
    const sid = createSession(db, userId);
    expect(touchSession(db, sid, 1000)).toEqual({ userId });
  });

  it('超过闲置窗口即过期并被删除', () => {
    const { db, userId } = setup();
    const sid = createSession(db, userId);
    expect(touchSession(db, sid, -1)).toBeNull(); // idleMs<0 → 立即过期
    expect(touchSession(db, sid, 1000)).toBeNull(); // 已删除
  });

  it('revoke（登出）后失效', () => {
    const { db, userId } = setup();
    const sid = createSession(db, userId);
    revokeSession(db, sid);
    expect(touchSession(db, sid, 1000)).toBeNull();
  });

  it('未知 sid 返回 null', () => {
    const { db } = setup();
    expect(touchSession(db, 'does-not-exist', 1000)).toBeNull();
  });
});
