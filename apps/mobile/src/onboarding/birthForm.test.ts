import { canSubmitBirth, type BirthSubmitInput } from './birthForm';

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
