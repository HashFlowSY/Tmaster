import { describe, expect, it } from 'vitest';
import {
  CHINA_STANDARD_MERIDIAN,
  dayOfYear,
  equationOfTimeMinutes,
  toTrueSolarTime,
} from './trueSolarTime';

describe('dayOfYear', () => {
  it('第一天与最后一天', () => {
    expect(dayOfYear(2023, 1, 1)).toBe(1);
    expect(dayOfYear(2023, 12, 31)).toBe(365);
  });

  it('闰年 3 月之后 +1', () => {
    // 2024 闰年
    expect(dayOfYear(2024, 3, 1)).toBe(61); // 31 + 29 + 1
    expect(dayOfYear(2024, 12, 31)).toBe(366);
    // 非闰年
    expect(dayOfYear(2023, 3, 1)).toBe(60);
  });
});

describe('equationOfTimeMinutes', () => {
  it('落在合理范围 (−14 ~ +17 分钟)', () => {
    for (let m = 1; m <= 12; m++) {
      const eot = equationOfTimeMinutes(2023, m, 15);
      expect(eot).toBeGreaterThan(-15);
      expect(eot).toBeLessThan(17);
    }
  });

  it('春分附近 (N≈81, 3 月下旬) 均时差约 −7.5 分钟', () => {
    // 均时差在春分并非 0；−7.53·cos(B) 项在 B=0 时主导。
    expect(equationOfTimeMinutes(2023, 3, 22)).toBeLessThan(-6);
    expect(equationOfTimeMinutes(2023, 3, 22)).toBeGreaterThan(-9);
  });

  it('均时差过零点在 4 月中旬 (N≈105) 附近', () => {
    expect(Math.abs(equationOfTimeMinutes(2023, 4, 15))).toBeLessThan(1.5);
  });
});

describe('toTrueSolarTime', () => {
  it('出生地正处标准经线且均时差≈0 时几乎不校正', () => {
    // 4/15 均时差≈0，经度=120 → 无经度时差，总校正≈0
    const r = toTrueSolarTime(
      { year: 2023, month: 4, day: 15, hour: 12, minute: 0 },
      CHINA_STANDARD_MERIDIAN,
    );
    expect(r.longitudeOffsetMinutes).toBe(0);
    expect(Math.abs(r.totalOffsetMinutes)).toBeLessThan(1.5);
    expect(r.hour).toBe(12);
  });

  it('经度时差 = 4 分钟 × 经度差', () => {
    // 乌鲁木齐经度约 87.6°E，用钟表时间(北京时间)出生 → 真太阳时应明显偏早
    const r = toTrueSolarTime({ year: 2023, month: 6, day: 1, hour: 12, minute: 0 }, 90);
    expect(r.longitudeOffsetMinutes).toBe(4 * (90 - 120)); // -120 分钟
    expect(r.longitudeOffsetMinutes).toBe(-120);
  });

  it('校正跨越子时边界会进位到前一天', () => {
    // 00:30 在西部经度会被拉到前一天 22:xx
    const r = toTrueSolarTime({ year: 2023, month: 6, day: 1, hour: 0, minute: 30 }, 90);
    expect(r.day).toBe(31);
    expect(r.month).toBe(5);
    expect(r.hour).toBeGreaterThanOrEqual(22);
  });

  it('返回的时分始终合法', () => {
    const r = toTrueSolarTime({ year: 2024, month: 2, day: 29, hour: 23, minute: 55 }, 135);
    expect(r.hour).toBeGreaterThanOrEqual(0);
    expect(r.hour).toBeLessThanOrEqual(23);
    expect(r.minute).toBeGreaterThanOrEqual(0);
    expect(r.minute).toBeLessThanOrEqual(59);
  });
});
