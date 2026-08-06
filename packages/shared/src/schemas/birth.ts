import { z } from 'zod';
import { GenderSchema } from './common';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '出生日期需为 YYYY-MM-DD');
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, '出生时间需为 HH:mm');

/**
 * 出生信息。时间按出生地当地墙钟时间理解（非 UTC）。
 * 时辰未知时 timeUnknown=true，排八字降级为仅年月日三柱。
 */
export const BirthProfileInputSchema = z
  .object({
    birthDate: dateSchema,
    birthTime: timeSchema.nullable(),
    timeUnknown: z.boolean(),
    birthplace: z.string().trim().min(1, '请填写出生地'),
    /** 出生地经度，东经为正。真太阳时校正必需。 */
    longitude: z.number().min(-180).max(180),
    gender: GenderSchema,
  })
  .refine((v) => v.timeUnknown || v.birthTime !== null, {
    message: '未勾选「时辰未知」时必须填写出生时间',
    path: ['birthTime'],
  });
export type BirthProfileInput = z.infer<typeof BirthProfileInputSchema>;

// —— 八字盘（bazi_charts.data 的结构契约） ——

export const PillarSchema = z.object({
  stem: z.string(), // 天干
  branch: z.string(), // 地支
  ganZhi: z.string(), // 干支
  hiddenStems: z.array(z.string()), // 藏干
  tenGod: z.string().nullable(), // 十神（相对日主；日柱天干为日主本身，为 null）
});
export type Pillar = z.infer<typeof PillarSchema>;

export const DecadeFortuneSchema = z.object({
  startAge: z.number(),
  ganZhi: z.string(),
});
export type DecadeFortune = z.infer<typeof DecadeFortuneSchema>;

export const BaziChartSchema = z.object({
  gender: GenderSchema,
  solarDate: z.string(),
  lunarDate: z.string(),
  /** 校正后的真太阳时；时辰未知时为 null。 */
  trueSolarTime: z.object({ hour: z.number(), minute: z.number() }).nullable(),
  dayMaster: z.string(), // 日主（日柱天干）
  zodiac: z.string(), // 生肖
  pillars: z.object({
    year: PillarSchema,
    month: PillarSchema,
    day: PillarSchema,
    hour: PillarSchema.nullable(), // 时辰未知时为 null（降级盘）
  }),
  decadeFortunes: z.array(DecadeFortuneSchema),
});
export type BaziChart = z.infer<typeof BaziChartSchema>;
