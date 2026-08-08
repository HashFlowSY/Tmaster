/**
 * 生辰引导「中性默认防盲提交」提交闸（spec 实现决策 C；ADR-0009 / issue 02）。
 *
 * 从软引导化后的 onboarding 屏抽出的**纯函数**：屏幕只做接线（收集地点完成态 / 经度 / 触碰标志 /
 * 时辰未知），把「够不够格生成命盘」交给本函数——因此规则可脱离 RN 表测，屏幕保持薄。
 *
 * 中性默认的要义：出生地不预选、出生时刻未经滚轮确认前不算已填，杜绝命主照抄示例默认值盲提交。
 * 时辰可缺（勾「时辰未知」走降级盘），但出生日期恒为硬性必填。
 */

export interface BirthSubmitInput {
  /** 出生地已选到区县（叶子）。 */
  locComplete: boolean;
  /** 已据所选地点取到经度（真太阳时校正所需）。 */
  hasLongitude: boolean;
  /** 出生日期经滚轮确认过（未触前 tiles 显占位、不算已填）。 */
  dateTouched: boolean;
  /** 出生时辰经滚轮确认过。 */
  timeTouched: boolean;
  /** 勾了「时辰未知」——可替代时辰确认，走降级盘（三柱）。 */
  timeUnknown: boolean;
}

/**
 * 能否生成命盘：出生地选到区县且取到经度、出生日期已确认，且（勾了时辰未知 或 时辰已确认）。
 * 定稿规则（spec 实现决策 C）：
 *   locComplete && hasLongitude && dateTouched && (timeUnknown || timeTouched)
 */
export function canSubmitBirth(input: BirthSubmitInput): boolean {
  const { locComplete, hasLongitude, dateTouched, timeTouched, timeUnknown } = input;
  return locComplete && hasLongitude && dateTouched && (timeUnknown || timeTouched);
}

/** 出生时刻的单位下拉:年 / 月(0 基) / 日 / 时——各自独立选择。 */
export type DatePart = 'year' | 'month' | 'day' | 'hour';

/** 给定年份 + 0 基月份的当月天数（含闰年 2 月）。用于「日」下拉只列该月合法天数。 */
export function daysInMonth(year: number, month0: number): number {
  // 下个月第 0 天 = 当月最后一天。
  return new Date(year, month0 + 1, 0).getDate();
}

/**
 * 在 `base` 上只改一个单位,返回新 `Date`（纯函数,不改动 base,可脱离 RN 表测）。
 * - `year` / `month`:若原「日」超出目标年月的天数,钳制到当月最后一天（如 1/31 改到 2 月 → 2/29）。
 * - `day`:只改日（调用方已用 daysInMonth 约束选项,不会越界）。
 * - `hour`:只改小时,分 / 秒 / 毫秒归零（「时只允许选择时」,不采集分钟）。
 */
export function withDateField(base: Date, part: DatePart, value: number): Date {
  const next = new Date(base);
  switch (part) {
    case 'year': {
      const day = Math.min(next.getDate(), daysInMonth(value, next.getMonth()));
      next.setFullYear(value, next.getMonth(), day);
      break;
    }
    case 'month': {
      const day = Math.min(next.getDate(), daysInMonth(next.getFullYear(), value));
      next.setFullYear(next.getFullYear(), value, day);
      break;
    }
    case 'day':
      next.setDate(value);
      break;
    case 'hour':
      next.setHours(value, 0, 0, 0);
      break;
  }
  return next;
}
