import { zValidator } from '@hono/zod-validator';
import { type AuthResponse, LoginInputSchema, RegisterInputSchema } from '@tianji/shared';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppDeps } from '../app';
import { signToken } from '../auth/jwt';
import { hashPassword, verifyPassword } from '../auth/password';
import { createSession } from '../auth/session';
import { type UserRow, users } from '../db/schema';

function toAuthResponse(user: UserRow, token: string): AuthResponse {
  return {
    token,
    user: { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() },
  };
}

/** 公共认证路由：注册 / 登录。不受认证中间件保护。 */
export function authRoutes({ db, env }: AppDeps) {
  const app = new Hono();

  app.post('/register', zValidator('json', RegisterInputSchema), async (c) => {
    const { email, password } = c.req.valid('json');
    const existing = db.select().from(users).where(eq(users.email, email)).get();
    if (existing) {
      return c.json({ error: { code: 'email_taken', message: '该邮箱已注册' } }, 409);
    }
    const id = createId();
    const passwordHash = await hashPassword(password);
    db.insert(users).values({ id, email, passwordHash }).run();
    const user = db.select().from(users).where(eq(users.id, id)).get();
    if (!user) return c.json({ error: { code: 'internal', message: '创建用户失败' } }, 500);
    const sid = createSession(db, id);
    const token = await signToken({ sub: id, sid }, env.JWT_SECRET);
    return c.json(toAuthResponse(user, token), 201);
  });

  app.post('/login', zValidator('json', LoginInputSchema), async (c) => {
    const { email, password } = c.req.valid('json');
    const user = db.select().from(users).where(eq(users.email, email)).get();
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return c.json({ error: { code: 'invalid_credentials', message: '邮箱或密码错误' } }, 401);
    }
    const sid = createSession(db, user.id);
    const token = await signToken({ sub: user.id, sid }, env.JWT_SECRET);
    return c.json(toAuthResponse(user, token), 200);
  });

  return app;
}
