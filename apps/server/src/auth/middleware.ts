import { apiErrorBody } from '@tianji/shared';
import { createMiddleware } from 'hono/factory';
import type { Db } from '../db/client';
import { verifyToken } from './jwt';
import { touchSession } from './session';

export interface AuthVariables {
  userId: string;
  sessionId: string;
}

/** 受保护路由的认证中间件：校验 JWT + 会话未吊销/未过期，并滑动刷新。 */
export function authMiddleware(db: Db, secret: string, idleMs: number) {
  return createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const header = c.req.header('Authorization');
    if (!header?.startsWith('Bearer ')) {
      return c.json(apiErrorBody('unauthorized', '缺少凭证'), 401);
    }
    let payload: { sub: string; sid: string };
    try {
      payload = await verifyToken(header.slice(7), secret);
    } catch {
      return c.json(apiErrorBody('unauthorized', '凭证无效'), 401);
    }
    const session = touchSession(db, payload.sid, idleMs);
    if (!session || session.userId !== payload.sub) {
      return c.json(apiErrorBody('unauthorized', '会话已过期，请重新登录'), 401);
    }
    c.set('userId', session.userId);
    c.set('sessionId', payload.sid);
    await next();
  });
}
