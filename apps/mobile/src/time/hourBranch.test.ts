import { hourBranchFromTime } from './hourBranch';

// 纯函数测试（spec Testing Decisions：纯逻辑 seam，用 jest-expo 直接测函数）。
// 把墙钟 HH:mm 映射到 12 双时辰（地支），供生辰引导 picker 展示与提交。
describe('hourBranchFromTime', () => {
  it('把整点映射到对应时辰', () => {
    expect(hourBranchFromTime('03:00').name).toBe('寅时'); // 寅 03:00–05:00
    expect(hourBranchFromTime('11:00').name).toBe('午时'); // 午 11:00–13:00
    expect(hourBranchFromTime('21:00').name).toBe('亥时'); // 亥 21:00–23:00
  });

  it('时辰按整点分桶——分钟不改变归属', () => {
    expect(hourBranchFromTime('03:59').name).toBe('寅时');
    expect(hourBranchFromTime('04:30').name).toBe('寅时');
    expect(hourBranchFromTime('05:00').name).toBe('卯时'); // 边界属下一个时辰
  });

  it('子时跨午夜：23 点与 0 点同属子时', () => {
    expect(hourBranchFromTime('23:00').name).toBe('子时');
    expect(hourBranchFromTime('23:30').name).toBe('子时');
    expect(hourBranchFromTime('00:00').name).toBe('子时');
    expect(hourBranchFromTime('00:59').name).toBe('子时');
    expect(hourBranchFromTime('01:00').name).toBe('丑时'); // 丑 01:00 起
  });

  it('给出时辰的时钟区间（子时跨午夜到 01:00）', () => {
    expect(hourBranchFromTime('03:00').range).toBe('03:00 – 05:00');
    expect(hourBranchFromTime('23:30').range).toBe('23:00 – 01:00');
    expect(hourBranchFromTime('00:10').range).toBe('23:00 – 01:00');
  });
});
