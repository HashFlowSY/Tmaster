import { apiErrorBody } from '@tianji/shared';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { type AuthVariables, authMiddleware } from './auth/middleware';
import type { Db } from './db/client';
import type { Env } from './env';
import { accountRoutes } from './routes/account';
import { authRoutes } from './routes/auth';
import { birthRoutes } from './routes/birth';
import { chartRoutes } from './routes/chart';
import { conversationRoutes } from './routes/conversations';
import { messageRoutes } from './routes/messages';

export interface AppDeps {
  db: Db;
  env: Env;
}

type GuardedApp = Hono<{ Variables: AuthVariables }>;

const WEB_ORIGINS = ['http://localhost:8081', 'http://127.0.0.1:8081'];

/**
 * 组装 Hono 应用。依赖显式注入（db/env），便于测试用内存库拉起整应用。
 *
 * 认证隔离：每个受保护前缀各自包一层带 `use('*')` 守卫的子应用，守卫作用域
 * 限定在该前缀内，因此不会波及公共的 /api/auth（注册/登录）。
 */
export function createApp(deps: AppDeps) {
  const guard = authMiddleware(deps.db, deps.env.JWT_SECRET, deps.env.SESSION_IDLE_MS);

  const withGuard = (...subs: GuardedApp[]): GuardedApp => {
    const g: GuardedApp = new Hono<{ Variables: AuthVariables }>();
    g.use('*', guard);
    for (const s of subs) g.route('/', s);
    return g;
  };

  const api = new Hono();
  api.route('/auth', authRoutes(deps)); // 公共
  api.route('/account', withGuard(accountRoutes(deps)));
  api.route('/birth-profile', withGuard(birthRoutes(deps)));
  api.route('/bazi-chart', withGuard(chartRoutes(deps)));
  api.route('/conversations', withGuard(conversationRoutes(deps), messageRoutes(deps)));

  const app = new Hono();
  app.get('/health', (c) => c.json({ ok: true }));
  app.use(
    '/api/*',
    cors({
      origin: WEB_ORIGINS,
      allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.route('/api', api);

  // 兜底：任何未捕获异常都收进统一错误信封，客户端永不收到裸崩溃响应（ADR-0008）。
  // SSE 流处理器自捕获并发 error 事件、不抛到此处，故不受信封影响。
  app.onError((err, c) => {
    console.error('[unhandled]', err);
    return c.json(apiErrorBody('internal', '服务异常，请稍后重试'), 500);
  });

  return app;
}

export type AppType = ReturnType<typeof createApp>;
