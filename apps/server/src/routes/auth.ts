import { type AuthResponse, LoginInputSchema, RegisterInputSchema, apiErrorBody } from '@tianji/shared';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppDeps } from '../app';
import { signToken } from '../auth/jwt';
import { hashPassword, verifyPassword } from '../auth/password';
import { createSession } from '../auth/session';
import { type UserRow, users } from '../db/schema';
import { slidingWindowRateLimit } from '../http/rateLimit';
import { zJson } from '../http/validate';

function toAuthResponse(user: UserRow, token: string): AuthResponse {
  return {
    token,
    user: { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() },
  };
}

/** 公共认证路由：注册 / 登录。不受认证中间件保护。 */
export function authRoutes({ db, env }: AppDeps) {
  const app = new Hono();

  // 内存滑窗限流，挡暴力破解与批量注册（spec G）。登录与注册各自独立计数、
  // 独立阈值/窗口，经 env 可调（调大即可在开发/压测期放行）。限流器在校验之前跑，
  // 超阈值请求直接 429、不触达业务逻辑。
  const loginLimiter = slidingWindowRateLimit({
    max: env.LOGIN_RATE_LIMIT_MAX,
    windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
  });
  const registerLimiter = slidingWindowRateLimit({
    max: env.REGISTER_RATE_LIMIT_MAX,
    windowMs: env.REGISTER_RATE_LIMIT_WINDOW_MS,
  });

  app.post('/register', registerLimiter, zJson(RegisterInputSchema), async (c) => {
    const { email, password } = c.req.valid('json');
    const existing = db.select().from(users).where(eq(users.email, email)).get();
    if (existing) {
      return c.json(apiErrorBody('email_taken', '该邮箱已注册'), 409);
    }
    const id = createId();
    const passwordHash = await hashPassword(password);
    db.insert(users).values({ id, email, passwordHash }).run();
    const user = db.select().from(users).where(eq(users.id, id)).get();
    if (!user) return c.json(apiErrorBody('internal', '创建用户失败'), 500);
    const sid = createSession(db, id);
    const token = await signToken({ sub: id, sid }, env.JWT_SECRET);
    return c.json({ data: toAuthResponse(user, token) }, 201);
  });

  app.post('/login', loginLimiter, zJson(LoginInputSchema), async (c) => {
    const { email, password } = c.req.valid('json');
    const user = db.select().from(users).where(eq(users.email, email)).get();
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return c.json(apiErrorBody('invalid_credentials', '邮箱或密码错误'), 401);
    }
    const sid = createSession(db, user.id);
    const token = await signToken({ sub: user.id, sid }, env.JWT_SECRET);
    return c.json({ data: toAuthResponse(user, token) }, 200);
  });

  return app;
}
