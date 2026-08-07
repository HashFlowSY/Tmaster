import { getConnInfo } from '@hono/node-server/conninfo';
import { apiErrorBody } from '@tianji/shared';
import type { Context, MiddlewareHandler } from 'hono';

/**
 * 解析请求来源 IP，作为限流计数的 key。
 *
 * 生产走 `@hono/node-server` 的真实 socket（`getConnInfo`），LAN 直连无代理
 * （ADR-0002），因此不信任、也不读 `x-forwarded-for`——那在无代理环境下可被伪造。
 * 仅当取不到 socket 地址时（测试里的 `app.request()` 无真实连接）才回退到 XFF，
 * 供集成测试模拟不同来源 IP；此回退在生产不会触达。最终兜底 `'unknown'`。
 */
function resolveClientIp(c: Context): string {
  try {
    const { remote } = getConnInfo(c);
    if (remote.address) return remote.address;
  } catch {
    // getConnInfo 依赖 node-server 绑定；测试的 app.request() 下不可用。
  }
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return 'unknown';
}

/** 命中限流时返回给命主的中文文案（对应 spec 用户故事 22）。 */
const RATE_LIMITED_MESSAGE = '操作过于频繁，请稍后再试';

export interface RateLimitOptions {
  /** 窗口内允许的最大请求数（按 IP）；达到即拒。 */
  max: number;
  /** 滑动窗口长度（毫秒）。 */
  windowMs: number;
}

/**
 * 内存滑动窗口限流中间件（sliding-window log）。
 *
 * 每个 IP 维护一段落在窗口内的请求时间戳；窗口内请求数达到 `max` 即返回
 * 429 `rate_limited`（统一信封 ADR-0008）。只记录被放行的请求——被拒的请求
 * 不占坑，因此窗口滑过后计数自然恢复，不会把命主永久锁死。
 *
 * 单进程 better-sqlite3 服务器用内存 `Map` 计数即可（ADR-0003「v1 单机」），
 * 不引 Redis。代价：进程重启计数清零、不支持多实例；v1 可接受。
 * 阈值与窗口经 env 可调（见 `env.ts`），避免开发/测试期自锁。
 *
 * 存储按中间件实例（即按 app 实例）隔离，因此测试里每个 `createApp()` 计数独立。
 */
export function slidingWindowRateLimit(opts: RateLimitOptions): MiddlewareHandler {
  const { max, windowMs } = opts;
  const hits = new Map<string, number[]>();

  return async (c, next) => {
    const key = resolveClientIp(c);
    const now = Date.now();
    const cutoff = now - windowMs;
    const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);

    if (recent.length >= max) {
      hits.set(key, recent); // 存回已修剪的时间戳，让窗口继续滑动。
      return c.json(apiErrorBody('rate_limited', RATE_LIMITED_MESSAGE), 429);
    }

    recent.push(now);
    hits.set(key, recent);
    await next();
  };
}
