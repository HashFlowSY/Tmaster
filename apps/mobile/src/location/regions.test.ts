import { viewForPath } from './regions';

// 纯函数测试（spec Testing Decisions：纯逻辑 seam）。级联导航把「已选路径」映射到
// 面包屑 / 当前级选项 / 选中项 / 经度 / 是否选到叶子，供生辰引导 Cascader 驱动。
describe('viewForPath', () => {
  it('空路径 → 选择省份：无选中、无经度、占位当前级', () => {
    const v = viewForPath([]);
    expect(v.complete).toBe(false);
    expect(v.selected).toBeUndefined();
    expect(v.longitude).toBeUndefined();
    expect(v.crumbs).toEqual([{ label: '选择省份', current: true }]);
    expect(v.options.some((o) => o.value === '浙江省')).toBe(true);
  });

  it('选到省 → 选择城市：省成面包屑，占位提示改为「选择城市」', () => {
    const v = viewForPath(['浙江省']);
    expect(v.complete).toBe(false);
    expect(v.crumbs).toEqual([
      { label: '浙江省', current: false },
      { label: '选择城市', current: true },
    ]);
    expect(v.options.some((o) => o.value === '杭州市')).toBe(true);
  });

  it('选到市 → 城市经度即刻可用，即便还没选到区县', () => {
    const v = viewForPath(['浙江省', '杭州市']);
    expect(v.complete).toBe(false);
    expect(v.longitude).toBe(120.15);
    expect(v.crumbs.at(-1)).toEqual({ label: '选择区县', current: true });
  });

  it('选到区县（叶子）→ complete，末级面包屑高亮，选项含 ✓ 选中项', () => {
    const v = viewForPath(['浙江省', '杭州市', '西湖区']);
    expect(v.complete).toBe(true);
    expect(v.selected).toBe('西湖区');
    expect(v.longitude).toBe(120.15);
    expect(v.birthplace).toBe('浙江省杭州市西湖区');
    // 叶子层展示兄弟区县列表，末级面包屑为当前项。
    expect(v.crumbs).toEqual([
      { label: '浙江省', current: false },
      { label: '杭州市', current: false },
      { label: '西湖区', current: true },
    ]);
    expect(v.options.some((o) => o.value === '西湖区')).toBe(true);
  });

  it('区县经度就近继承所属城市', () => {
    expect(viewForPath(['广东省', '深圳市', '南山区']).longitude).toBe(114.06);
    expect(viewForPath(['广东省', '广州市', '天河区']).longitude).toBe(113.26);
  });

  it('直辖市按 省→区 两级建模，占位提示仍正确为「选择区县」', () => {
    const v = viewForPath(['北京市']);
    expect(v.complete).toBe(false);
    expect(v.crumbs.at(-1)).toEqual({ label: '选择区县', current: true });
    const leaf = viewForPath(['北京市', '朝阳区']);
    expect(leaf.complete).toBe(true);
    expect(leaf.longitude).toBe(116.41);
    expect(leaf.birthplace).toBe('北京市朝阳区');
  });
});
