import { canSubmitBirth, daysInMonth, withDateField, type BirthSubmitInput } from './birthForm';

// 中性默认提交闸的纯函数测试（spec 实现决策 C / 测试缝 3）——穷举「缺任一必填 → false、
// 齐备或勾未知 → true」。只断可观察返回，不耦合屏幕状态接线。
// prior art：formLogic.test.ts、regions.test.ts（表测纯逻辑，无 RN / 无 mock）。
describe('canSubmitBirth', () => {
  // 便捷构造：默认一切齐备（地点到区县 + 有经度 + 日期已触 + 时辰已触、未勾未知），逐例翻单一维度。
  const input = (over: Partial<BirthSubmitInput> = {}): BirthSubmitInput => ({
    locComplete: true,
    hasLongitude: true,
    dateTouched: true,
    timeTouched: true,
    timeUnknown: false,
    ...over,
  });

  it('地点到区县 + 有经度 + 日期已触 + 时辰已触 → 可提交', () => {
    expect(canSubmitBirth(input())).toBe(true);
  });

  it('勾「时辰未知」可替代时辰确认（其余齐备）→ 可提交', () => {
    expect(canSubmitBirth(input({ timeUnknown: true, timeTouched: false }))).toBe(true);
  });

  describe('缺任一必填 → 不可提交', () => {
    it.each`
      missing            | over
      ${'地点未到区县'}   | ${{ locComplete: false }}
      ${'无经度'}         | ${{ hasLongitude: false }}
      ${'出生日期未触碰'} | ${{ dateTouched: false }}
      ${'时辰未触且未勾未知'} | ${{ timeTouched: false, timeUnknown: false }}
    `('$missing → false', ({ over }) => {
      expect(canSubmitBirth(input(over))).toBe(false);
    });
  });

  it('日期是硬性必填：即便勾了「时辰未知」，日期未触仍不可提交', () => {
    expect(canSubmitBirth(input({ dateTouched: false, timeUnknown: true, timeTouched: false }))).toBe(false);
  });

  it('全空 → false', () => {
    expect(
      canSubmitBirth({
        locComplete: false,
        hasLongitude: false,
        dateTouched: false,
        timeTouched: false,
        timeUnknown: false,
      }),
    ).toBe(false);
  });
});

// 各单位下拉的纯逻辑（年/月/日/时独立选择）：某月天数 + 「只改一个单位并按月份钳制日」的合并。
describe('daysInMonth', () => {
  it('闰年 2 月 29 天、平年 28 天', () => {
    expect(daysInMonth(2000, 1)).toBe(29); // 2000 闰
    expect(daysInMonth(2001, 1)).toBe(28); // 2001 平
    expect(daysInMonth(1900, 1)).toBe(28); // 1900 非闰（百年不闰）
  });

  it('大月 31、小月 30', () => {
    expect(daysInMonth(2023, 0)).toBe(31); // 1 月
    expect(daysInMonth(2023, 3)).toBe(30); // 4 月
    expect(daysInMonth(2023, 11)).toBe(31); // 12 月
  });
});

describe('withDateField', () => {
  it('year:只改年份、保留月/日/时分', () => {
    const out = withDateField(new Date(2000, 5, 15, 8, 30, 0, 0), 'year', 1990);
    expect([out.getFullYear(), out.getMonth(), out.getDate(), out.getHours(), out.getMinutes()]).toEqual([
      1990, 5, 15, 8, 30,
    ]);
  });

  it('year:目标年该月天数不足时钳制日（2/29 → 平年 2/28）', () => {
    const out = withDateField(new Date(2000, 1, 29, 8, 0, 0, 0), 'year', 2001);
    expect([out.getFullYear(), out.getMonth(), out.getDate()]).toEqual([2001, 1, 28]);
  });

  it('month:只改月份;原日超新月天数时钳制（1/31 → 2 月 → 2/29）', () => {
    const out = withDateField(new Date(2000, 0, 31, 8, 0, 0, 0), 'month', 1); // month0=1 → 二月
    expect([out.getFullYear(), out.getMonth(), out.getDate()]).toEqual([2000, 1, 29]);
  });

  it('day:只改日、保留年月时分', () => {
    const out = withDateField(new Date(2000, 0, 15, 8, 30, 0, 0), 'day', 20);
    expect([out.getMonth(), out.getDate(), out.getHours(), out.getMinutes()]).toEqual([0, 20, 8, 30]);
  });

  it('hour:只改小时,分/秒/毫秒归零,保留年月日', () => {
    const out = withDateField(new Date(2000, 0, 15, 8, 30, 45, 500), 'hour', 3);
    expect([out.getDate(), out.getHours(), out.getMinutes(), out.getSeconds(), out.getMilliseconds()]).toEqual([
      15, 3, 0, 0, 0,
    ]);
  });

  it('纯函数:不改动传入的 base', () => {
    const base = new Date(2000, 5, 15, 8, 30, 0, 0);
    const snapshot = base.getTime();
    withDateField(base, 'year', 1990);
    expect(base.getTime()).toBe(snapshot);
  });
});
