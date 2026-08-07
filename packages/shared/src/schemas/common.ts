import { z } from 'zod';

/** 命理系统。对话按此分型，创建后不可更改。 */
export const SystemSchema = z.enum(['bazi', 'qimen']);
export type System = z.infer<typeof SystemSchema>;

/** 命理系统的中文标签（前后端共用，避免多处硬编码）。 */
export function systemLabel(system: System): string {
  return system === 'bazi' ? '八字' : '奇门';
}

/** 命主性别（八字排大运需要）。 */
export const GenderSchema = z.enum(['male', 'female']);
export type Gender = z.infer<typeof GenderSchema>;

/** 消息角色。 */
export const RoleSchema = z.enum(['user', 'assistant']);
export type Role = z.infer<typeof RoleSchema>;

/**
 * 统一 API 错误码。前后端共用的联合枚举，避免魔法字符串（ADR-0008）。
 *
 * `birth_required` 不在 ADR-0008 初列的 7 个码里，但它是既有领域前置条件
 * （八字对话需先完善生辰，见 conversations 路由与 chat 屏），本次信封迁移属
 * 「纯外层包裹、不改无关业务语义」，故一并纳入枚举以保持类型安全、不留裸魔法串。
 */
export const ApiErrorCodeSchema = z.enum([
  'validation', // 400 —— zValidator 失败，带 fields
  'email_taken', // 409
  'invalid_credentials', // 401
  'unauthorized', // 401 —— 缺/无效凭证或会话过期
  'not_found', // 404
  'birth_required', // 409 —— 八字对话前置：需先完善生辰（既有领域码）
  'rate_limited', // 429
  'internal', // 500 —— app.onError 兜底
]);
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

/** 成功信封：任何成功响应一律 `{ data: T }`，与错误信封互斥。 */
export interface ApiSuccess<T> {
  data: T;
}

/** 统一错误信封：任何失败响应一律 `{ error: { code, message, fields? } }`。 */
export const ApiErrorBodySchema = z.object({
  error: z.object({
    code: ApiErrorCodeSchema,
    message: z.string(), // 面向命主的中文文案
    fields: z.record(z.string()).optional(), // 字段级校验错误：字段名 → 中文
  }),
});
export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;

/**
 * 构造统一错误信封。服务端各路由 / 校验钩子 / onError 兜底共用，
 * 由 `ApiErrorCode` 保证码为联合枚举、不写魔法字符串。
 */
export function apiErrorBody(
  code: ApiErrorCode,
  message: string,
  fields?: Record<string, string>,
): ApiErrorBody {
  return { error: fields ? { code, message, fields } : { code, message } };
}
