import { describe, expect, it } from 'vitest';
import { CARD_MARKER, extractCard, visibleCardPrefixLen } from './card';

// 纯逻辑 seam：把模型回复里的可选「要点卡」尾块（marker + 一行 JSON）从正文中剥离，
// 并在流式转发时避免把 marker 及其后续泄露给客户端。只测可观察输出。
describe('extractCard', () => {
  it('无 marker → 全文作正文、无卡片', () => {
    expect(extractCard('今年宜稳中求进。')).toEqual({ content: '今年宜稳中求进。' });
  });

  it('marker + 合法 JSON → 正文与卡片分离', () => {
    const raw = `三月后官星得力。${CARD_MARKER}{"title":"乙巳年 · 事业要点","rows":[{"k":"利方位","v":"西 · 北","ok":true},{"k":"忌","v":"仓促裸辞"}]}`;
    expect(extractCard(raw)).toEqual({
      content: '三月后官星得力。',
      card: {
        title: '乙巳年 · 事业要点',
        rows: [
          { k: '利方位', v: '西 · 北', ok: true },
          { k: '忌', v: '仓促裸辞' },
        ],
      },
    });
  });

  it('marker 后 JSON 非法 → 丢弃尾块、只留正文', () => {
    const raw = `正文。${CARD_MARKER}{不是合法 JSON`;
    expect(extractCard(raw)).toEqual({ content: '正文。' });
  });

  it('marker 后 JSON 不合 schema（缺 rows）→ 无卡片', () => {
    const raw = `正文。${CARD_MARKER}{"title":"只有标题"}`;
    expect(extractCard(raw)).toEqual({ content: '正文。' });
  });

  it('正文首尾空白被裁剪', () => {
    expect(extractCard('  你好  ')).toEqual({ content: '你好' });
  });
});

describe('visibleCardPrefixLen', () => {
  it('无 marker、无半个 marker 结尾 → 全部可见', () => {
    const s = '今天丙申，宜谈事。';
    expect(visibleCardPrefixLen(s)).toBe(s.length);
  });

  it('marker 出现 → 只到 marker 之前可见', () => {
    const head = '正文部分';
    expect(visibleCardPrefixLen(`${head}${CARD_MARKER}{"title":"x"}`)).toBe(head.length);
  });

  it('结尾是 marker 的前缀 → 暂扣该半截', () => {
    const head = '正文';
    const partial = CARD_MARKER.slice(0, 3); // 半个 marker
    expect(visibleCardPrefixLen(head + partial)).toBe(head.length);
  });

  it('结尾正常字符（非 marker 前缀）→ 不暂扣', () => {
    const s = '正文结束。';
    expect(visibleCardPrefixLen(s)).toBe(s.length);
  });
});
