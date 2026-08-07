// 圆角，取自原型 border-radius。role 名对应具体组件，scale 名供通用容器。
export const radii = {
  xs: 6,
  sm: 10,
  md: 12, // 原型最常用的卡片/容器圆角
  input: 13, // .input
  button: 14, // .btn
  lg: 16, // 大卡片
  card: 18, // .chartcard（命盘卡片）
  xl: 22,
  pill: 999, // 胶囊 / 分段控件
  round: 9999, // 圆形（原型 border-radius:50%）
} as const;

export type RadiusToken = keyof typeof radii;
