import { conversationMeta } from './conversationMeta';

// 纯逻辑 seam（spec Testing Decisions）——对话切换器每项副标题「系统 · 相对时间」的格式化。
// now 由调用方注入，函数内不取 Date.now()，故断言完全确定。只测可观察输出，不碰组件。
describe('conversationMeta', () => {
  // 用本地时间构造，函数用本地 getter，两者同框架 → 与机器时区无关地确定。
  const now = new Date(2026, 7, 6, 14, 30); // 2026-08-06 14:30 本地

  it('同一天显示「今天 HH:mm」并前缀系统标签', () => {
    const iso = new Date(2026, 7, 6, 9, 24).toISOString();
    expect(conversationMeta('bazi', iso, now)).toBe('八字 · 今天 09:24');
  });

  it('前一天显示「昨天 HH:mm」', () => {
    const iso = new Date(2026, 7, 5, 21, 47).toISOString();
    expect(conversationMeta('qimen', iso, now)).toBe('奇门 · 昨天 21:47');
  });

  it('更早的日期显示零补齐的「MM-DD」', () => {
    const iso = new Date(2026, 7, 4, 10, 5).toISOString();
    expect(conversationMeta('bazi', iso, now)).toBe('八字 · 08-04');
  });

  it('奇门系统前缀为「奇门」', () => {
    const iso = new Date(2026, 7, 6, 8, 10).toISOString();
    expect(conversationMeta('qimen', iso, now)).toBe('奇门 · 今天 08:10');
  });

  it('时分个位数零补齐', () => {
    const iso = new Date(2026, 7, 6, 3, 5).toISOString();
    expect(conversationMeta('bazi', iso, now)).toBe('八字 · 今天 03:05');
  });
});
