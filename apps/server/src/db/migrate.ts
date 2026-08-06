import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { loadEnv } from '../env';
import { type Db, createDb } from './client';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../drizzle');

/** 应用 drizzle 迁移。服务启动时自动调用；测试里对内存库调用。 */
export function applyMigrations(db: Db, migrationsFolder: string = MIGRATIONS_DIR): void {
  migrate(db, { migrationsFolder });
}

// 作为脚本直接执行时（pnpm db:migrate）：对真实库跑迁移。
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const env = loadEnv();
  const { db } = createDb(env.DB_PATH);
  applyMigrations(db);
  // eslint-disable-next-line no-console
  console.log(`迁移已应用于 ${env.DB_PATH}`);
}
