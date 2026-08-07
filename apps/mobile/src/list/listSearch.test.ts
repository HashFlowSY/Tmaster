import { filterRows, normalizeQuery, rowMatchesQuery } from './listSearch';

// 纯逻辑 seam（spec Testing Decisions / issue 10）——历史/收藏列表的搜索谓词。
// 只测可观察输出（是否命中、过滤后子集），不碰组件。行为 1:1 于原型 runListSearch：
// q = input.trim().toLowerCase()；空 q 为「清除态」显示全部；否则跨全部页对行文本做子串匹配。

describe('normalizeQuery', () => {
  it('去首尾空白并小写', () => {
    expect(normalizeQuery('  Bazi  ')).toBe('bazi');
  });

  it('纯空白归一为空串（= 清除态）', () => {
    expect(normalizeQuery('   ')).toBe('');
    expect(normalizeQuery('')).toBe('');
  });
});

describe('rowMatchesQuery', () => {
  it('空词（清除态）恒命中——显示全部', () => {
    expect(rowMatchesQuery('今年适合换工作吗', '')).toBe(true);
    expect(rowMatchesQuery('任意文本', '   ')).toBe(true);
  });

  it('归一化词为行文本子串则命中（中文）', () => {
    expect(rowMatchesQuery('今年适合换工作吗 乙巳年正官透干', '换工作')).toBe(true);
  });

  it('大小写不敏感（两侧都归一到小写）', () => {
    expect(rowMatchesQuery('Bazi 八字', 'BAZI')).toBe(true);
  });

  it('词的首尾空白被忽略（trim 后匹配）', () => {
    expect(rowMatchesQuery('今日宜忌与吉时', '  吉时 ')).toBe(true);
  });

  it('不是子串则不命中', () => {
    expect(rowMatchesQuery('今年财运走势', '姻缘')).toBe(false);
  });
});

interface Row {
  title: string;
  snippet: string;
  time: string;
  tag: string;
}
// 行的可搜文本 = 标题+断语+时间+系统标签拼接（对应原型 .convrow 的 textContent）。
const toText = (r: Row) => `${r.title} ${r.snippet} ${r.time} ${r.tag}`;

// 跨「页」的扁平全集（原型搜索时展开所有 pagegroup 一起过滤）。
const ROWS: Row[] = [
  { title: '今年适合换工作吗', snippet: '乙巳年正官透干，宜往金水行业。', time: '今天 09:24', tag: '八字' },
  { title: '遗失的钥匙能找回吗', snippet: '落坎一宫近水处，今日申时前可寻回。', time: '昨天 21:47', tag: '奇门' },
  { title: '今年财运走势', snippet: '偏财藏于时支，五月后渐见起色。', time: '08-04', tag: '八字' },
];

describe('filterRows', () => {
  it('空词返回全部行（清除态，不过滤）', () => {
    expect(filterRows(ROWS, '', toText)).toEqual(ROWS);
  });

  it('跨全集按标题命中（不受分页影响）', () => {
    const hit = filterRows(ROWS, '钥匙', toText);
    expect(hit).toHaveLength(1);
    expect(hit[0].title).toBe('遗失的钥匙能找回吗');
  });

  it('可命中断语文本（非仅标题）', () => {
    const hit = filterRows(ROWS, '偏财', toText);
    expect(hit.map((r) => r.title)).toEqual(['今年财运走势']);
  });

  it('可命中系统标签', () => {
    const hit = filterRows(ROWS, '奇门', toText);
    expect(hit).toHaveLength(1);
    expect(hit[0].tag).toBe('奇门');
  });

  it('可命中多行', () => {
    const hit = filterRows(ROWS, '今年', toText);
    expect(hit.map((r) => r.title)).toEqual(['今年适合换工作吗', '今年财运走势']);
  });

  it('无匹配返回空数组（→ 属主页渲染 search-empty）', () => {
    expect(filterRows(ROWS, '姻缘', toText)).toEqual([]);
  });
});
