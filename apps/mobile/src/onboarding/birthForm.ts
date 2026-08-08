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

/** 滚轮模式:'date' 只改年月日、'time' 只改时分。 */
export type SpinnerMode = 'date' | 'time';

/**
 * 把滚轮确认的 `picked` 合并进 `base`,只覆盖该滚轮负责的一半(问题 1「草稿+确定」模型的合并逻辑)。
 * - `date`:取 picked 的年月日,保留 base 的时分(时辰半不动)。
 * - `time`:取 picked 的时分并把秒/毫秒归零,保留 base 的年月日(日期半不动)。
 * 纯函数:返回新 `Date`,不改动 base(可脱离 RN 表测)。
 */
export function commitSpinner(base: Date, picked: Date, mode: SpinnerMode): Date {
  const next = new Date(base);
  if (mode === 'date') {
    next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  } else {
    next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  }
  return next;
}
