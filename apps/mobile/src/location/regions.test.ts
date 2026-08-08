import { CITY_LONGITUDE } from './longitudes';
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

// 全量真实数据（china-division pca.json）验证：覆盖度、直辖市折叠、经度「省会基线 + 市级覆盖」模型。
describe('viewForPath —— 全量真实行政区数据', () => {
  it('根含 31 个省级行政区，且包含旧精选子集之外的省份', () => {
    const provinces = viewForPath([]).options.map((o) => o.value);
    expect(provinces).toHaveLength(31);
    // 旧子集里没有的省份现在都在。
    for (const p of ['湖南省', '山东省', '江苏省', '云南省', '西藏自治区']) {
      expect(provinces).toContain(p);
    }
  });

  it('旧子集之外的省份可一路下钻到区县叶子', () => {
    // 动态取第一座市、第一个区县，避免硬编码具体地名。
    const cities = viewForPath(['湖南省']).options.map((o) => o.value);
    expect(cities.length).toBeGreaterThan(0);
    const city = cities[0];
    const areas = viewForPath(['湖南省', city]).options.map((o) => o.value);
    expect(areas.length).toBeGreaterThan(0);
    const leaf = viewForPath(['湖南省', city, areas[0]]);
    expect(leaf.complete).toBe(true);
    expect(leaf.birthplace).toBe(`湖南省${city}${areas[0]}`);
    expect(leaf.longitude).toBe(112.94); // 无市级覆盖 → 继承湖南省会（长沙）基线
  });

  it('城市无经度覆盖 → 就近继承省会基线；有覆盖 → 用市级真经度', () => {
    // 广东省会基线 = 广州 113.26。
    expect(viewForPath(['广东省', '韶关市']).longitude).toBe(113.26); // 无覆盖，继承基线
    expect(viewForPath(['广东省', '深圳市']).longitude).toBe(114.06); // 有覆盖，市级真经度
    expect(viewForPath(['广东省', '深圳市']).longitude).not.toBe(113.26);
    // 新疆跨度极大——覆盖的地级市用自身经度而非乌鲁木齐基线（87.62）。
    expect(viewForPath(['新疆维吾尔自治区', '吐鲁番市']).longitude).toBe(89.19);
  });

  it('直辖市折叠掉伪市级「市辖区」/「县」：区县直接挂在省下', () => {
    for (const muni of ['北京市', '上海市', '天津市', '重庆市']) {
      const opts = viewForPath([muni]).options.map((o) => o.value);
      expect(opts).not.toContain('市辖区');
      expect(opts).not.toContain('县');
      expect(opts.length).toBeGreaterThan(0);
    }
  });

  it('每个 CITY_LONGITUDE 覆盖键都对应树中真实城市（防手误漏配静默失效）', () => {
    // 汇总所有省份下的城市名（直辖市折叠后为区县，混入无妨——覆盖键都是普通省的地级市）。
    const allCities = new Set<string>();
    for (const p of viewForPath([]).options.map((o) => o.value)) {
      for (const c of viewForPath([p]).options) allCities.add(c.value);
    }
    for (const city of Object.keys(CITY_LONGITUDE)) {
      expect(allCities.has(city)).toBe(true);
    }
  });
});
