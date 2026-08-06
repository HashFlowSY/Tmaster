import { serve } from '@hono/node-server';
import { createApp } from './app';
import { createDb } from './db/client';
import { applyMigrations } from './db/migrate';
import { loadEnv } from './env';

// 启动顺序：校验 env → 开库(WAL) → 跑迁移 → 挂路由 → listen。
const env = loadEnv();
const { db } = createDb(env.DB_PATH);
applyMigrations(db);
const app = createApp({ db, env });

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  // 监听 0.0.0.0 以便同一 WiFi 的手机经局域网 IP 访问（ADR 0002）。
  // eslint-disable-next-line no-console
  console.log(`天机后端已启动: http://0.0.0.0:${info.port}  (DB: ${env.DB_PATH})`);
});
