import { z } from 'zod';

/**
 * 后端环境变量契约。启动时用 zod 校验，缺失或非法即崩（不裸奔）。
 * DeepSeek key 与 baseURL 由后端管理；见 docs/adr。
 */
const EnvSchema = z.object({
  /** DeepSeek API Key，由后端持有，绝不下发前端。 */
  DEEPSEEK_API_KEY: z.string().min(1, '缺少 DEEPSEEK_API_KEY'),
  /** DeepSeek OpenAI 兼容端点，可手动填写。 */
  DEEPSEEK_BASE_URL: z.string().url().default('https://api.deepseek.com'),
  DEEPSEEK_MODEL: z.string().min(1).default('deepseek-chat'),
  /** JWT 签名密钥。 */
  JWT_SECRET: z.string().min(16, 'JWT_SECRET 至少 16 字符'),
  /** SQLite 文件路径。 */
  DB_PATH: z.string().min(1).default('./data/tianji.sqlite'),
  PORT: z.coerce.number().int().positive().default(8787),
  /** 会话闲置过期（毫秒），默认 6 小时滑动过期。见 ADR 0003。 */
  SESSION_IDLE_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(6 * 60 * 60 * 1000),

  // ---- auth 限流（内存滑动窗口，见 ADR-0008 / spec G）----
  // 阈值与窗口经 env 可调，避免开发/测试期把自己锁死（调大即可放行）。默认对应 spec：
  // 登录每 IP 10 分钟 10 次、注册每 IP 每小时 5 次，超出即 429 rate_limited。
  /** 登录窗口内允许的最大请求数（按 IP）。 */
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  /** 登录滑动窗口长度（毫秒），默认 10 分钟。 */
  LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(10 * 60 * 1000),
  /** 注册窗口内允许的最大请求数（按 IP）。 */
  REGISTER_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  /** 注册滑动窗口长度（毫秒），默认 1 小时。 */
  REGISTER_RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 1000),
});

export type Env = z.infer<typeof EnvSchema>;

/** 校验并返回环境变量；失败抛出可读错误。 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`环境变量校验失败:\n${issues}`);
  }
  return parsed.data;
}
