// 间距阶梯，取自原型常用值。gutter 是 Screen 两种横向留白（spec Primitives：content 26 / header 22）。
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 6,
  base: 8,
  gap: 10,
  md: 12,
  lg: 16,
  xl: 20,
  section: 30,
} as const;

export const gutter = {
  header: 22, // 标题区横向留白
  content: 26, // 内容区横向留白（.pad / .statusbar）
} as const;

export type SpacingToken = keyof typeof spacing;
