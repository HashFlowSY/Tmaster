// 出生地行政区数据 + 纯导航逻辑。生辰引导 Cascader 据此逐级下钻（省→市→区县，直辖市 省→区），
// 并从所选地点就近取「经度」用于真太阳时校正（CONTEXT §真太阳时）。纯逻辑，测试见 regions.test.ts。
//
// 说明：这是一份**精选子集**（覆盖东经 ~87°–127° 的代表城市），非全国穷举——足以让命主选到真实出生地、
// 让经度真正随地点变化，且可按需扩充。经度取各城市市中心近似值（东经为正）。区县经度就近继承所属城市
// （同城各区经度差 <0.5°，对真太阳时影响可忽略）。

export interface Region {
  /** 行政区名（面包屑与提交 birthplace 用）。 */
  name: string;
  /** 经度（东经正）。挂在城市级；下辖区县就近继承。 */
  longitude?: number;
  /** 其子级的类别名，用于「选择{childLabel}」占位提示（省份 / 城市 / 区县）。 */
  childLabel?: string;
  /** 下辖行政区；无 children = 叶子（可作最终选择）。 */
  children?: Region[];
}

const districts = (...names: string[]): Region[] => names.map((name) => ({ name }));

// 直辖市按 省→区 两级建模（childLabel 直接为「区县」）；省份按 省→市→区县 三级。
const PROVINCES: Region[] = [
  {
    name: '北京市',
    longitude: 116.41,
    childLabel: '区县',
    children: districts('东城区', '西城区', '朝阳区', '海淀区', '丰台区'),
  },
  {
    name: '上海市',
    longitude: 121.47,
    childLabel: '区县',
    children: districts('黄浦区', '徐汇区', '长宁区', '静安区', '浦东新区'),
  },
  {
    name: '浙江省',
    childLabel: '城市',
    children: [
      {
        name: '杭州市',
        longitude: 120.15,
        childLabel: '区县',
        children: districts('西湖区', '上城区', '拱墅区', '滨江区', '余杭区', '萧山区'),
      },
      { name: '宁波市', longitude: 121.55, childLabel: '区县', children: districts('海曙区', '江北区', '鄞州区') },
    ],
  },
  {
    name: '广东省',
    childLabel: '城市',
    children: [
      {
        name: '广州市',
        longitude: 113.26,
        childLabel: '区县',
        children: districts('越秀区', '天河区', '海珠区', '白云区'),
      },
      {
        name: '深圳市',
        longitude: 114.06,
        childLabel: '区县',
        children: districts('福田区', '南山区', '罗湖区', '宝安区'),
      },
    ],
  },
  {
    name: '四川省',
    childLabel: '城市',
    children: [
      {
        name: '成都市',
        longitude: 104.07,
        childLabel: '区县',
        children: districts('锦江区', '青羊区', '武侯区', '成华区'),
      },
    ],
  },
  {
    name: '陕西省',
    childLabel: '城市',
    children: [
      {
        name: '西安市',
        longitude: 108.94,
        childLabel: '区县',
        children: districts('新城区', '碑林区', '雁塔区', '未央区'),
      },
    ],
  },
  {
    name: '黑龙江省',
    childLabel: '城市',
    children: [
      {
        name: '哈尔滨市',
        longitude: 126.53,
        childLabel: '区县',
        children: districts('道里区', '南岗区', '香坊区'),
      },
    ],
  },
  {
    name: '新疆维吾尔自治区',
    childLabel: '城市',
    children: [
      {
        name: '乌鲁木齐市',
        longitude: 87.62,
        childLabel: '区县',
        children: districts('天山区', '沙依巴克区', '水磨沟区'),
      },
    ],
  },
];

// 合成根:把「选择省份」的占位提示与顶层省份统一进同一棵树,导航逻辑对根/枝一视同仁。
const ROOT: Region = { name: '', childLabel: '省份', children: PROVINCES };

/** 沿 path（不含根）从 ROOT 走到目标节点；任一级找不到则返回 undefined。 */
function nodeAtPath(path: readonly string[]): Region | undefined {
  let node: Region | undefined = ROOT;
  for (const name of path) {
    node = node?.children?.find((c) => c.name === name);
    if (node == null) return undefined;
  }
  return node;
}

/** path 上就近的经度（目标或最近祖先的 longitude）。 */
function longitudeForPath(path: readonly string[]): number | undefined {
  let node: Region | undefined = ROOT;
  let lng = ROOT.longitude;
  for (const name of path) {
    node = node?.children?.find((c) => c.name === name);
    if (node == null) break;
    if (node.longitude != null) lng = node.longitude;
  }
  return lng;
}

export interface CascaderCrumbView {
  label: string;
  current: boolean;
}
export interface CascaderOptionView {
  label: string;
  value: string;
}

export interface RegionView {
  /** 面包屑:已选各级 + 未选到叶子时追加「选择{childLabel}」当前占位;选到叶子则末级为当前项。 */
  crumbs: CascaderCrumbView[];
  /** 当前级可选项。 */
  options: CascaderOptionView[];
  /** 已选叶子的值（未选到叶子时 undefined）。 */
  selected?: string;
  /** 就近经度（选到城市或以下即可用）。 */
  longitude?: number;
  /** 是否已选到叶子（可提交）。 */
  complete: boolean;
  /** 拼接的出生地文本，如「浙江省杭州市西湖区」。 */
  birthplace: string;
}

const toOptions = (regions: readonly Region[]): CascaderOptionView[] =>
  regions.map((r) => ({ label: r.name, value: r.name }));

/**
 * 把「已选路径」映射为 Cascader 所需的一切（面包屑 / 选项 / 选中 / 经度 / 完成态 / 出生地文本）。
 * path 为从省份起的名字数组（不含合成根）。空数组 = 尚未选择省份。
 */
export function viewForPath(path: readonly string[]): RegionView {
  const node = nodeAtPath(path);
  const isLeaf = node != null && (node.children == null || node.children.length === 0);
  const longitude = longitudeForPath(path);
  const birthplace = path.join('');

  if (isLeaf) {
    // 选到叶子:展示兄弟列表(供改选)+ 末级面包屑高亮为当前项。
    const parent = nodeAtPath(path.slice(0, -1));
    return {
      crumbs: path.map((name, i) => ({ label: name, current: i === path.length - 1 })),
      options: toOptions(parent?.children ?? []),
      selected: path.at(-1),
      longitude,
      complete: true,
      birthplace,
    };
  }

  // 仍在选择当前级:已选各级为面包屑 + 一个「选择{childLabel}」当前占位。
  const placeholder = `选择${node?.childLabel ?? ''}`;
  return {
    crumbs: [
      ...path.map((name) => ({ label: name, current: false })),
      { label: placeholder, current: true },
    ],
    options: toOptions(node?.children ?? []),
    selected: undefined,
    longitude,
    complete: false,
    birthplace,
  };
}
