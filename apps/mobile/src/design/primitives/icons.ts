// 图标路径注册表 —— 1:1 移植自原型 docs/ui/tianji-app-design.html 的内联 SVG。
//
// 这是「ported SVG paths」的单一真源：<Icon> 从这里按名取几何。原型里同一个图标可能以
// 不同 stroke-width / 尺寸出现（随上下文），这里存的 strokeWidth 取其首次出现的值作为
// **默认**,屏幕改造时可用 <Icon strokeWidth> 覆盖。名字取语义(可 grep 原型用途反查,
// 见每项后的「原型用途」注释,对应 spec User Story 19/34)。
//
// 全部为 viewBox 24×24 的线性图标:stroke=currentColor→color、fill=none;填充图标(fill=currentColor,
// 见各项 filled:true)是例外:crown、以及收藏行用的 bookmarkFilled。登录页品牌标记(ring-spin + 太极,
// viewBox 100×100)不在此表,
// 因其为多色固定复合体,见 ./LoginMark。原型 .board-brand 的 .luopan 属 mock 框架,不移植
// (spec §10 mock-frame exclusions)。

/** SVG 子元素(仅移植原型用到的三类:path / circle / rect)。 */
export type IconElement =
  | { readonly kind: 'path'; readonly d: string }
  | { readonly kind: 'circle'; readonly cx: number; readonly cy: number; readonly r: number }
  | {
      readonly kind: 'rect';
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
      readonly rx?: number;
    };

export interface IconDef {
  /** viewBox 为 N×N 方形,存 N。所有线性图标为 24。 */
  readonly viewBox: number;
  /** 取自原型上下文的默认线宽;可被 <Icon strokeWidth> 覆盖。填充图标忽略此值。 */
  readonly strokeWidth: number;
  /** 填充图标(fill=currentColor、无描边)vs 线性图标(stroke=currentColor、fill=none)。 */
  readonly filled?: boolean;
  readonly elements: readonly IconElement[];
}

export const icons = {
  // 邮箱 —— 登录/注册邮箱输入框前置图标。
  mail: {
    viewBox: 24,
    strokeWidth: 1.6,
    elements: [
      { kind: 'path', d: 'M3 8l9 6 9-6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z' },
    ],
  },
  // 锁 —— 密码输入框前置图标。
  lock: {
    viewBox: 24,
    strokeWidth: 1.6,
    elements: [
      { kind: 'rect', x: 4, y: 10, width: 16, height: 11, rx: 2.5 },
      { kind: 'path', d: 'M8 10V7a4 4 0 018 0v3' },
    ],
  },
  // 锁+对勾 —— 注册页「确认密码」前置图标。
  lockCheck: {
    viewBox: 24,
    strokeWidth: 1.6,
    elements: [
      { kind: 'rect', x: 4, y: 10, width: 16, height: 11, rx: 2.5 },
      { kind: 'path', d: 'M8 10V7a4 4 0 018 0v3' },
      { kind: 'path', d: 'M9.5 15.5l1.6 1.6 3.4-3.4' },
    ],
  },
  // 横向三点 —— 登录页「其他登录方式」。
  more: {
    viewBox: 24,
    strokeWidth: 1.7,
    elements: [
      { kind: 'circle', cx: 5, cy: 12, r: 1.6 },
      { kind: 'circle', cx: 12, cy: 12, r: 1.6 },
      { kind: 'circle', cx: 19, cy: 12, r: 1.6 },
    ],
  },
  // 左箭头 —— 返回按钮(.icon-btn 返回登录/返回)。
  back: {
    viewBox: 24,
    strokeWidth: 1.8,
    elements: [{ kind: 'path', d: 'M15 5l-7 7 7 7' }],
  },
  // 下箭头 —— tabdrop 下拉指示(.cv)。
  chevronDown: {
    viewBox: 24,
    strokeWidth: 1.9,
    elements: [{ kind: 'path', d: 'M6 9l6 6 6-6' }],
  },
  // 太极 —— 对话页 AI 头像标记(原型描边 gold-2)。
  taiji: {
    viewBox: 24,
    strokeWidth: 1.4,
    elements: [
      { kind: 'circle', cx: 12, cy: 12, r: 9 },
      { kind: 'path', d: 'M12 5a7 7 0 000 14 3.5 3.5 0 010-7 3.5 3.5 0 000-7z' },
    ],
  },
  // 纸飞机 —— 对话页发送按钮(.send,原型描边墨色贴在金色按钮上)。
  send: {
    viewBox: 24,
    strokeWidth: 1.8,
    elements: [{ kind: 'path', d: 'M4 12l16-8-6 16-2.5-6.5z' }],
  },
  // 对话气泡 —— 底部导航「对话」。
  chat: {
    viewBox: 24,
    strokeWidth: 1.5,
    elements: [{ kind: 'path', d: 'M4 5h16v11H8l-4 3z' }],
  },
  // 命盘(圆+十字)—— 底部导航「命盘」。
  chart: {
    viewBox: 24,
    strokeWidth: 1.5,
    elements: [
      { kind: 'circle', cx: 12, cy: 12, r: 9 },
      { kind: 'path', d: 'M12 3v18M3 12h18' },
    ],
  },
  // 用户 —— 底部导航「我的」。
  user: {
    viewBox: 24,
    strokeWidth: 1.5,
    elements: [
      { kind: 'circle', cx: 12, cy: 8, r: 4 },
      { kind: 'path', d: 'M4 21a8 8 0 0116 0' },
    ],
  },
  // 分享 —— 命盘页「分享命盘」。
  share: {
    viewBox: 24,
    strokeWidth: 1.6,
    elements: [
      { kind: 'circle', cx: 18, cy: 5, r: 2.5 },
      { kind: 'circle', cx: 6, cy: 12, r: 2.5 },
      { kind: 'circle', cx: 18, cy: 19, r: 2.5 },
      { kind: 'path', d: 'M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6' },
    ],
  },
  // 齿轮 —— 我的页「设置」。
  settings: {
    viewBox: 24,
    strokeWidth: 1.5,
    elements: [
      { kind: 'circle', cx: 12, cy: 12, r: 3.2 },
      {
        kind: 'path',
        d: 'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1',
      },
    ],
  },
  // 皇冠(填充)—— 我的页 VIP 徽标。原型 fill=currentColor,是本表唯一填充图标。
  crown: {
    viewBox: 24,
    strokeWidth: 0,
    filled: true,
    elements: [{ kind: 'path', d: 'M3 7l5 4 4-7 4 7 5-4-2 12H5z' }],
  },
  // 时钟 —— 我的页「历史对话」菜单项。
  clock: {
    viewBox: 24,
    strokeWidth: 1.5,
    elements: [
      { kind: 'path', d: 'M12 7v5l3 2' },
      { kind: 'circle', cx: 12, cy: 12, r: 9 },
    ],
  },
  // 书签(线性) —— 我的页「我的收藏」菜单项(原型 .mitem 内 fill=none stroke=currentColor)。
  bookmark: {
    viewBox: 24,
    strokeWidth: 1.5,
    elements: [{ kind: 'path', d: 'M5 4h14v16l-7-4-7 4z' }],
  },
  // 书签(填充) —— 收藏列表行的收藏标记(原型 .cico.star 内 fill=currentColor、金亮)。
  // 与线性 bookmark 同几何、仅着色方式不同:原型同一路径在「我的」菜单为线性、在收藏行为填充,
  // 故拆成两个命名项(各对应原型一处渲染),而非给 Icon 加运行时 filled 覆盖(填充是注册表几何属性)。
  bookmarkFilled: {
    viewBox: 24,
    strokeWidth: 1.5,
    filled: true,
    elements: [{ kind: 'path', d: 'M5 4h14v16l-7-4-7 4z' }],
  },
  // 退出 —— 我的页「退出登录」(danger)。
  logout: {
    viewBox: 24,
    strokeWidth: 1.5,
    elements: [{ kind: 'path', d: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9' }],
  },
  // 放大镜 —— 历史/收藏列表搜索框。
  search: {
    viewBox: 24,
    strokeWidth: 1.7,
    elements: [
      { kind: 'circle', cx: 11, cy: 11, r: 7 },
      { kind: 'path', d: 'M21 21l-4.3-4.3' },
    ],
  },
  // 叉 —— 搜索框清除按钮(.sb-clear)。
  close: {
    viewBox: 24,
    strokeWidth: 2,
    elements: [{ kind: 'path', d: 'M6 6l12 12M18 6L6 18' }],
  },
  // 星 —— 会话分类图标(运势)。
  star: {
    viewBox: 24,
    strokeWidth: 1.4,
    elements: [
      { kind: 'path', d: 'M12 4l2.3 4.6 5.1.8-3.7 3.6.9 5.1L12 15.8 7.4 18.2l.9-5.1L4.6 9.4l5.1-.8z' },
    ],
  },
  // 九宫格 —— 会话分类图标(奇门)。
  grid: {
    viewBox: 24,
    strokeWidth: 1.4,
    elements: [
      { kind: 'rect', x: 4, y: 4, width: 16, height: 16, rx: 1.5 },
      { kind: 'path', d: 'M4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16' },
    ],
  },
  // 双环 —— 会话分类图标(合婚)。
  rings: {
    viewBox: 24,
    strokeWidth: 1.4,
    elements: [
      { kind: 'circle', cx: 9, cy: 12, r: 5 },
      { kind: 'circle', cx: 15, cy: 12, r: 5 },
    ],
  },
} satisfies Record<string, IconDef>;

export type IconName = keyof typeof icons;

/** 全部图标名(供遍历 / 测试 / 图库)。 */
export const iconNames = Object.keys(icons) as IconName[];
