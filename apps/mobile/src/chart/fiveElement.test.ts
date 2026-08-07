import type { BaziChart, Pillar } from '@tianji/shared';
import { palette } from '../design/palette';
import { elementBalance, elementColor, elementLabel, elementOf } from './fiveElement';

// 纯函数测试（spec Testing Decisions：纯逻辑 seam，用 jest-expo 直接测函数）。
// 命盘的「五行数据编码」——把天干/地支映射到五行、把整张盘按五行计数。视觉（条宽/配色渲染）
// 归双端人工核对，这里只测确定性逻辑。

describe('elementOf', () => {
  it('映射十天干到五行', () => {
    expect(elementOf('甲')).toBe('mu'); // 甲乙木
    expect(elementOf('乙')).toBe('mu');
    expect(elementOf('丙')).toBe('huo'); // 丙丁火
    expect(elementOf('丁')).toBe('huo');
    expect(elementOf('戊')).toBe('tu'); // 戊己土
    expect(elementOf('己')).toBe('tu');
    expect(elementOf('庚')).toBe('jin'); // 庚辛金
    expect(elementOf('辛')).toBe('jin');
    expect(elementOf('壬')).toBe('shui'); // 壬癸水
    expect(elementOf('癸')).toBe('shui');
  });

  it('映射十二地支到五行', () => {
    expect(elementOf('子')).toBe('shui'); // 亥子水
    expect(elementOf('亥')).toBe('shui');
    expect(elementOf('寅')).toBe('mu'); // 寅卯木
    expect(elementOf('卯')).toBe('mu');
    expect(elementOf('巳')).toBe('huo'); // 巳午火
    expect(elementOf('午')).toBe('huo');
    expect(elementOf('申')).toBe('jin'); // 申酉金
    expect(elementOf('酉')).toBe('jin');
    expect(elementOf('辰')).toBe('tu'); // 辰戌丑未土
    expect(elementOf('戌')).toBe('tu');
    expect(elementOf('丑')).toBe('tu');
    expect(elementOf('未')).toBe('tu');
  });

  it('未知字符返回 null（防御非干支输入）', () => {
    expect(elementOf('X')).toBeNull();
    expect(elementOf('')).toBeNull();
    expect(elementOf('甲乙')).toBeNull(); // 只接受单字
  });
});

describe('elementLabel / elementColor', () => {
  it('五行短名', () => {
    expect(elementLabel('jin')).toBe('金');
    expect(elementLabel('mu')).toBe('木');
    expect(elementLabel('shui')).toBe('水');
    expect(elementLabel('huo')).toBe('火');
    expect(elementLabel('tu')).toBe('土');
  });

  it('五行色取自调色板的数据编码专用值', () => {
    expect(elementColor('jin')).toBe(palette.wxJin);
    expect(elementColor('mu')).toBe(palette.wxMu);
    expect(elementColor('shui')).toBe(palette.wxShui);
    expect(elementColor('huo')).toBe(palette.wxHuo);
    expect(elementColor('tu')).toBe(palette.wxTu);
  });
});

// 测试夹具：林辰宇乾造（原型命盘）——干支取自 docs/ui/tianji-app-design.html chart 屏。
function pillar(stem: string, branch: string): Pillar {
  return { stem, branch, ganZhi: stem + branch, hiddenStems: [], tenGod: null };
}
const linChenyu: BaziChart = {
  gender: 'male',
  solarDate: '1994-02-14',
  lunarDate: '甲戌年正月初五',
  trueSolarTime: { hour: 4, minute: 44 },
  dayMaster: '己',
  zodiac: '狗',
  pillars: {
    year: pillar('甲', '戌'),
    month: pillar('丙', '寅'),
    day: pillar('己', '巳'),
    hour: pillar('丙', '寅'),
  },
  decadeFortunes: [],
};

describe('elementBalance', () => {
  it('按固定顺序 金木水火土 返回五项', () => {
    const bars = elementBalance(linChenyu);
    expect(bars.map((b) => b.element)).toEqual(['jin', 'mu', 'shui', 'huo', 'tu']);
    expect(bars.map((b) => b.label)).toEqual(['金', '木', '水', '火', '土']);
  });

  it('清点四柱的天干与地支（原型林辰宇盘 = 0/3/0/3/2）', () => {
    // 天干 甲丙己丙 + 地支 戌寅巳寅：木3(甲寅寅) 火3(丙巳丙) 土2(戌己) 金0 水0。
    // 这组数字与原型 .balance 的条宽 6/78/6/78/52 对应的计数 1:1，锁死派生正确性。
    expect(elementBalance(linChenyu).map((b) => b.count)).toEqual([0, 3, 0, 3, 2]);
  });

  it('每项带对应五行色（数据编码）', () => {
    const bars = elementBalance(linChenyu);
    expect(bars.find((b) => b.element === 'mu')?.color).toBe(palette.wxMu);
    expect(bars.find((b) => b.element === 'huo')?.color).toBe(palette.wxHuo);
  });

  it('降级盘（时辰未知，hour 为 null）只清点年月日三柱', () => {
    const reduced: BaziChart = {
      ...linChenyu,
      trueSolarTime: null,
      pillars: { ...linChenyu.pillars, hour: null },
    };
    // 去掉时柱 丙寅：火 3→2、木 3→2，其余不变。
    expect(elementBalance(reduced).map((b) => b.count)).toEqual([0, 2, 0, 2, 2]);
  });
});
