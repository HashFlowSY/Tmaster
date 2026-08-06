import { sign, verify } from 'hono/jwt';

/** JWT 载荷：sub=用户 id，sid=会话 id（对应 sessions 表，支撑吊销）。 */
export interface JwtPayload {
  sub: string;
  sid: string;
}

/** 硬上限，主控为服务端 session 的 6h 滑动过期（ADR 0003）。 */
const HARD_TTL_SECONDS = 30 * 24 * 60 * 60;

export async function signToken(payload: JwtPayload, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    { sub: payload.sub, sid: payload.sid, iat: now, exp: now + HARD_TTL_SECONDS },
    secret,
    'HS256',
  );
}

/** 校验签名与硬过期；返回载荷。签名非法/过期时抛出。 */
export async function verifyToken(token: string, secret: string): Promise<JwtPayload> {
  const decoded = (await verify(token, secret, 'HS256')) as { sub?: unknown; sid?: unknown };
  if (typeof decoded.sub !== 'string' || typeof decoded.sid !== 'string') {
    throw new Error('token 载荷非法');
  }
  return { sub: decoded.sub, sid: decoded.sid };
}
