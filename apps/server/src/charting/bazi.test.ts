import { BaziChartSchema } from '@tianji/shared';
import { describe, expect, it } from 'vitest';
import { type BaziInput, computeBaziChart } from './bazi';

const base: BaziInput = {
  birthDate: '1990-06-15',
  birthTime: '14:30',
  timeUnknown: false,
  longitude: 116.4,
  gender: 'male',
};

describe('computeBaziChart', () => {
  it('完整盘符合 schema，四柱齐全', () => {
    const chart = computeBaziChart(base);
    expect(() => BaziChartSchema.parse(chart)).not.toThrow();
    expect(chart.pillars.hour).not.toBeNull();
    expect(chart.pillars.year.ganZhi.length).toBe(2);
    expect(chart.pillars.year.hiddenStems.length).toBeGreaterThan(0);
  });

  it('日主等于日柱天干', () => {
    const chart = computeBaziChart(base);
    expect(chart.dayMaster).toBe(chart.pillars.day.stem);
  });

  it('日柱十神为 null（日主），其余柱有十神', () => {
    const chart = computeBaziChart(base);
    expect(chart.pillars.day.tenGod).toBeNull();
    expect(chart.pillars.year.tenGod).not.toBeNull();
  });

  it('完整盘有真太阳时与 8 步大运', () => {
    const chart = computeBaziChart(base);
    expect(chart.trueSolarTime).not.toBeNull();
    expect(chart.decadeFortunes).toHaveLength(8);
    expect(chart.decadeFortunes[0]?.ganZhi.length).toBe(2);
  });

  it('降级盘：时辰未知 → 无时柱、无真太阳时、无大运', () => {
    const chart = computeBaziChart({ ...base, birthTime: null, timeUnknown: true });
    expect(() => BaziChartSchema.parse(chart)).not.toThrow();
    expect(chart.pillars.hour).toBeNull();
    expect(chart.trueSolarTime).toBeNull();
    expect(chart.decadeFortunes).toHaveLength(0);
    // 三柱仍在
    expect(chart.pillars.year.ganZhi.length).toBe(2);
    expect(chart.dayMaster).toBe(chart.pillars.day.stem);
  });

  it('确定性：相同输入两次结果一致', () => {
    expect(computeBaziChart(base)).toEqual(computeBaziChart(base));
  });
});
