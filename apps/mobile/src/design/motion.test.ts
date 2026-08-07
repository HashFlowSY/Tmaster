import { resolveDuration } from './motion';

// 减动效纯逻辑：断言「开关 → 时长」这段行为，而非某个时长常量。
describe('resolveDuration(reduced, ms)', () => {
  it('未开启减动效时原样返回时长', () => {
    expect(resolveDuration(false, 450)).toBe(450);
  });

  it('开启减动效时归零', () => {
    expect(resolveDuration(true, 450)).toBe(0);
  });
});
