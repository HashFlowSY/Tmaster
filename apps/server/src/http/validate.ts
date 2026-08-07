import { zValidator } from '@hono/zod-validator';
import { apiErrorBody } from '@tianji/shared';
import type { ZodTypeAny } from 'zod';

/**
 * JSON body 校验器，统一把 zod 失败收进错误信封（ADR-0008）。
 *
 * 替代裸 `zValidator('json', schema)`——后者失败时走 `@hono/zod-validator` 默认的
 * `{ success, error }` 形状，客户端 `ApiError` 解析不到真实信息。这里挂失败钩子，
 * 把 `ZodError` 扁平化为 `{ error: { code:'validation', message, fields } }`（400），
 * `fields` 为「字段名 → 首条中文错误」。成功时 `c.req.valid('json')` 行为不变。
 */
export function zJson<T extends ZodTypeAny>(schema: T) {
  return zValidator('json', schema, (result, c) => {
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        // 只收顶层字段的首条错误；本仓校验 schema 均为扁平对象。
        if (typeof key === 'string' && !(key in fields)) fields[key] = issue.message;
      }
      return c.json(apiErrorBody('validation', '输入有误，请检查后重试', fields), 400);
    }
  });
}
