import { canSubmitBirth, commitSpinner, type BirthSubmitInput } from './birthForm';

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

// 滚轮确认合并的纯函数测试（问题 1 修复：草稿+确定模型的合并逻辑抽纯，无 RN）。
// 「日期滚轮」只改年月日、保留原时分；「时辰滚轮」只改时分、保留原年月日并把秒/毫秒归零。
describe('commitSpinner', () => {
  it('date 模式:取 picked 的年月日,保留 base 的时分', () => {
    const base = new Date(2000, 5, 15, 8, 30, 45, 500); // 2000-06-15 08:30:45.500
    const picked = new Date(1994, 1, 14, 3, 5, 0, 0); // 1994-02-14 03:05
    const out = commitSpinner(base, picked, 'date');
    expect([out.getFullYear(), out.getMonth(), out.getDate()]).toEqual([1994, 1, 14]);
    expect([out.getHours(), out.getMinutes()]).toEqual([8, 30]); // 时分沿用 base
  });

  it('time 模式:取 picked 的时分(秒/毫秒归零),保留 base 的年月日', () => {
    const base = new Date(2000, 5, 15, 8, 30, 45, 500);
    const picked = new Date(1994, 1, 14, 3, 5, 0, 0);
    const out = commitSpinner(base, picked, 'time');
    expect([out.getFullYear(), out.getMonth(), out.getDate()]).toEqual([2000, 5, 15]); // 年月日沿用 base
    expect([out.getHours(), out.getMinutes(), out.getSeconds(), out.getMilliseconds()]).toEqual([3, 5, 0, 0]);
  });

  it('纯函数:不改动传入的 base', () => {
    const base = new Date(2000, 5, 15, 8, 30, 0, 0);
    const snapshot = base.getTime();
    commitSpinner(base, new Date(1994, 1, 14, 3, 5), 'date');
    expect(base.getTime()).toBe(snapshot);
  });
});
