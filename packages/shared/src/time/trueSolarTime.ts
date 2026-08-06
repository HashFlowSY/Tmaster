/**
 * 真太阳时 (True Solar Time) 校正。
 *
 * 排八字定「时柱」以真太阳时为准，而非钟表时间。tyme4ts 本身不做此校正，
 * 需按出生地经度先把钟表时间转成真太阳时，再喂给排盘引擎。
 *
 * 真太阳时 = 钟表时间 + 经度时差 + 均时差(equation of time)
 *   - 经度时差(分钟) = 4 × (出生地经度 − 时区标准经线)。中国东八区标准经线 120°E。
 *   - 均时差：地球轨道偏心率与黄赤交角造成的季节性偏差，约 −14 ~ +16 分钟。
 *
 * 纯算术 + 查表，无 Date/时区依赖，可安全运行于 Node 与 React Native (Hermes)。
 */

/** 中国东八区(UTC+8)标准经线，单位：度(东经为正)。 */
export const CHINA_STANDARD_MERIDIAN = 120;

export interface CivilDateTime {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
}

export interface TrueSolarTimeResult extends CivilDateTime {
  /** 经度时差，分钟(东偏为正)。 */
  longitudeOffsetMinutes: number;
  /** 均时差，分钟。 */
  equationOfTimeMinutes: number;
  /** 合计校正量，分钟。 */
  totalOffsetMinutes: number;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const CUMULATIVE_DAYS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

/** 一年中的第几天(1-based)。 */
export function dayOfYear(year: number, month: number, day: number): number {
  const leapAdjust = month > 2 && isLeapYear(year) ? 1 : 0;
  return CUMULATIVE_DAYS[month - 1]! + day + leapAdjust;
}

/**
 * 均时差(分钟)。常用近似式：
 *   B = 2π(N − 81) / 364
 *   EoT = 9.87·sin(2B) − 7.53·cos(B) − 1.5·sin(B)
 * N 为一年中的天数。精度约 ±30 秒，足够定时柱。
 */
export function equationOfTimeMinutes(year: number, month: number, day: number): number {
  const n = dayOfYear(year, month, day);
  const b = (2 * Math.PI * (n - 81)) / 364;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

// —— 纯 Gregorian 日期算术(无时区)，用于分钟溢出后的日/月/年进位 ——

/** Gregorian 年月日 → 连续日序号(proleptic, 相对固定基准)。 */
function toOrdinalDay(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/** 连续日序号 → Gregorian 年月日。 */
function fromOrdinalDay(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

/**
 * 把整数分钟的校正量加到一个墙钟时间上，正确处理跨日/跨月/跨年进位。
 * 输入 minute 已四舍五入到整数分钟。
 */
function addMinutes(local: CivilDateTime, deltaMinutes: number): CivilDateTime {
  const baseMinuteOfDay = local.hour * 60 + local.minute;
  const total = baseMinuteOfDay + deltaMinutes;
  const dayShift = Math.floor(total / 1440);
  const minuteOfDay = ((total % 1440) + 1440) % 1440;
  const { year, month, day } = fromOrdinalDay(
    toOrdinalDay(local.year, local.month, local.day) + dayShift,
  );
  return {
    year,
    month,
    day,
    hour: Math.floor(minuteOfDay / 60),
    minute: minuteOfDay % 60,
  };
}

/**
 * 把出生地钟表时间校正为真太阳时。
 * @param local 出生地当地钟表时间(墙钟，非 UTC)。
 * @param longitude 出生地经度，东经为正，单位度。
 * @param standardMeridian 时区标准经线，默认中国东八区 120°E。
 */
export function toTrueSolarTime(
  local: CivilDateTime,
  longitude: number,
  standardMeridian: number = CHINA_STANDARD_MERIDIAN,
): TrueSolarTimeResult {
  const longitudeOffsetMinutes = 4 * (longitude - standardMeridian);
  const eot = equationOfTimeMinutes(local.year, local.month, local.day);
  const totalOffsetMinutes = longitudeOffsetMinutes + eot;
  const rounded = Math.round(totalOffsetMinutes);
  const corrected = addMinutes(local, rounded);
  return {
    ...corrected,
    longitudeOffsetMinutes,
    equationOfTimeMinutes: eot,
    totalOffsetMinutes,
  };
}
