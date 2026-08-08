// 出生地行政区数据 + 纯导航逻辑。生辰引导 Cascader 据此逐级下钻（省→市→区县，直辖市 省→区），
// 并从所选地点就近取「经度」用于真太阳时校正（CONTEXT §真太阳时）。纯逻辑，测试见 regions.test.ts。
//
// 区划名为**全量**（31 省级 / ~340 地级 / ~2900 县级），来自 china-division@2.7.0 的 dist/pca.json
// （MIT / WTFPL，随包附带的名录，见 data/pca.json）——本项目仅内嵌该名录 JSON、不引入运行时依赖。
// 经度按「省会基线 + 主要城市覆盖」建模（见 longitudes.ts）：城市无覆盖则就近继承省基线，区县继承所属市。

import pcaRaw from './data/pca.json';
import { CITY_LONGITUDE, PROVINCE_LONGITUDE } from './longitudes';

/** pca.json 形状：省 → 市 → 区县名数组。 */
type Pca = Record<string, Record<string, readonly string[]>>;
const PCA = pcaRaw as Pca;

// 直辖市在 pca 里以伪市级「市辖区」/「县」包一层；折叠掉，让区县直接挂到省下（省→区县两级）。
const MUNICIPALITY_WRAP = new Set(['市辖区', '县']);

export interface Region {
  /** 行政区名（面包屑与提交 birthplace 用）。 */
  name: string;
  /** 经度（东经正）。省级挂基线、覆盖市挂市级真经度；未挂者由 longitudeForPath 就近继承祖先。 */
  longitude?: number;
  /** 其子级的类别名，用于「选择{childLabel}」占位提示（省份 / 城市 / 区县）。 */
  childLabel?: string;
  /** 下辖行政区；无 children = 叶子（可作最终选择）。 */
  children?: Region[];
}

const leaves = (names: readonly string[]): Region[] => names.map((name) => ({ name }));

// 由 pca.json 构建省级行政区树（模块加载时一次性）：折叠直辖市伪市级、按 longitudes 表挂经度。
function buildProvinces(): Region[] {
  return Object.entries(PCA).map(([province, cities]) => {
    const isMunicipality = Object.keys(cities).some((c) => MUNICIPALITY_WRAP.has(c));
    const children: Region[] = [];
    for (const [city, areas] of Object.entries(cities)) {
      if (MUNICIPALITY_WRAP.has(city)) {
        // 直辖市：折叠伪市级，区县直接作为省的子级。
        children.push(...leaves(areas));
      } else {
        children.push({
          name: city,
          longitude: CITY_LONGITUDE[city], // 无覆盖 → undefined，就近继承省基线
          childLabel: '区县',
          children: leaves(areas),
        });
      }
    }
    return {
      name: province,
      longitude: PROVINCE_LONGITUDE[province], // 省会 / 直辖市基线
      childLabel: isMunicipality ? '区县' : '城市',
      children,
    };
  });
}

const PROVINCES: Region[] = buildProvinces();

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
