import { lineHeightFor, tracking } from './typography';

// letterSpacing 在 RN 是 pt 而非 em；转换器把原型的 em 字距按 `pt = em × fontSize`
// 烘焙成每个字号的精确 pt。断言的是转换器这段纯逻辑（spec §4 的代表性字号 → 期望 pt），
// 不是某个 token 常量。
describe('tracking(em, fontSize)', () => {
  it('按 spec §4 代表行把 em 折算成 pt', () => {
    expect(tracking(0.42, 34)).toBeCloseTo(14.28, 5); // brandName
    expect(tracking(0.06, 28)).toBeCloseTo(1.68, 5); // hSerifXL
    expect(tracking(0.04, 26)).toBeCloseTo(1.04, 5); // hSerifL
    expect(tracking(0.1, 21)).toBeCloseTo(2.1, 5); // hSerifHead
    expect(tracking(0.14, 16)).toBeCloseTo(2.24, 5); // hSerifSec
    expect(tracking(0.32, 11)).toBeCloseTo(3.52, 5); // eyebrow
    expect(tracking(0.14, 15)).toBeCloseTo(2.1, 5); // button
  });

  it('零字距折算后仍为零', () => {
    expect(tracking(0, 20)).toBe(0);
  });

  it('随字号线性放大', () => {
    expect(tracking(0.1, 20)).toBeCloseTo(tracking(0.1, 10) * 2, 5);
  });
});

// lineHeight 同为「倍数 × 字号」的纯换算（spec §4）。
describe('lineHeightFor(ratio, fontSize)', () => {
  it('按原型倍数折算成 pt 行高', () => {
    expect(lineHeightFor(1.15, 28)).toBeCloseTo(32.2, 5);
    expect(lineHeightFor(1.75, 13.5)).toBeCloseTo(23.625, 5);
    expect(lineHeightFor(1.25, 27)).toBeCloseTo(33.75, 5);
  });
});
