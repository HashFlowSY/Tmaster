import type { BaziChart } from '@tianji/shared';
import { palette } from '../design/palette';

// 五行数据编码 —— 命盘专用。把天干/地支映射到五行，并按五行清点整张盘。
//
// **这是全 App 唯一直接引用 palette.wx* 的地方（spec User Story 11/31）**：五行色被裁定仅限
// 「八字盘」内部作数据编码，禁作通用 UI 色。命盘的表现型 primitive（Pillars / ElementBars）只接收
// 这里派生好的颜色字符串，自身不碰 wx 色，以此把「数据编码色」收敛在此模块。
//
// 派生规则是固定的字典查表（干/支 → 五行是命理常识、恒定不变），非「排盘计算」——它不推命，
// 只把已排好盘上的字上色/计数，属展示层。纯函数，测试见 fiveElement.test.ts。

/** 五行标识（与 palette.wx* / prototype .wx-* 后缀一致）。 */
export type Element = 'jin' | 'mu' | 'shui' | 'huo' | 'tu';

// 十天干 → 五行：甲乙木 丙丁火 戊己土 庚辛金 壬癸水。
const STEM_ELEMENT: Readonly<Record<string, Element>> = {
  甲: 'mu',
  乙: 'mu',
  丙: 'huo',
  丁: 'huo',
  戊: 'tu',
  己: 'tu',
  庚: 'jin',
  辛: 'jin',
  壬: 'shui',
  癸: 'shui',
};

// 十二地支 → 五行：寅卯木 巳午火 申酉金 亥子水 辰戌丑未土。
const BRANCH_ELEMENT: Readonly<Record<string, Element>> = {
  子: 'shui',
  丑: 'tu',
  寅: 'mu',
  卯: 'mu',
  辰: 'tu',
  巳: 'huo',
  午: 'huo',
  未: 'tu',
  申: 'jin',
  酉: 'jin',
  戌: 'tu',
  亥: 'shui',
};

const LABEL: Readonly<Record<Element, string>> = {
  jin: '金',
  mu: '木',
  shui: '水',
  huo: '火',
  tu: '土',
};

const COLOR: Readonly<Record<Element, string>> = {
  jin: palette.wxJin,
  mu: palette.wxMu,
  shui: palette.wxShui,
  huo: palette.wxHuo,
  tu: palette.wxTu,
};

// 展示与计数的固定顺序（原型 .balance 条目次序：金 木 水 火 土）。
const ORDER: readonly Element[] = ['jin', 'mu', 'shui', 'huo', 'tu'];

/**
 * 单个天干或地支字 → 五行；非单字或未知字符返回 null（防御非干支输入）。
 * 天干与地支不重叠，合并查两张表即可。
 */
export function elementOf(char: string): Element | null {
  if (char.length !== 1) return null;
  return STEM_ELEMENT[char] ?? BRANCH_ELEMENT[char] ?? null;
}

/** 五行短名（金/木/水/火/土）。 */
export function elementLabel(el: Element): string {
  return LABEL[el];
}

/** 五行数据编码色（取自 palette.wx*，命盘专用）。 */
export function elementColor(el: Element): string {
  return COLOR[el];
}

/** 五行强弱一条：标识 + 短名 + 计数 + 数据编码色。 */
export interface ElementTally {
  element: Element;
  label: string;
  count: number;
  color: string;
}

/**
 * 按五行清点整张八字盘 —— 数四柱的**天干与地支**各自的五行归属（不含藏干）。
 * 按固定顺序 金木水火土 返回五项，供 ElementBars 渲染。降级盘（时辰未知）时柱为 null，自然跳过。
 *
 * 与原型对齐：林辰宇盘 干支 甲丙己丙 / 戌寅巳寅 → 0/3/0/3/2，正是原型 .balance 的计数（见测试）。
 */
export function elementBalance(chart: BaziChart): ElementTally[] {
  const counts: Record<Element, number> = { jin: 0, mu: 0, shui: 0, huo: 0, tu: 0 };
  const { year, month, day, hour } = chart.pillars;
  for (const p of [year, month, day, hour]) {
    if (p == null) continue;
    for (const el of [elementOf(p.stem), elementOf(p.branch)]) {
      if (el != null) counts[el] += 1;
    }
  }
  return ORDER.map((element) => ({
    element,
    label: LABEL[element],
    count: counts[element],
    color: COLOR[element],
  }));
}
