// 设计系统 token 单一入口（spec §2–§6）。组件从这里取所有色/字/距/圆角/阴影/动效。
//
// 命名说明：本模块落在 `src/design/` 而非 spec 直书的 `src/theme/`——因为旧扁平主题
// `src/theme.ts` 仍需共存（本 issue 的 expand 步），而 `theme.ts` 文件会在模块解析上
// 遮蔽同名 `theme/` 目录，令 barrel 无法以 `./theme` 被引用。待 contract 步（issue 12）
// 删除 `theme.ts` 后可平移改名为 `theme/`。详见 ./tokens.md。
export { palette } from './palette';
export type { PaletteToken } from './palette';

export { semantic } from './semantic';
export type { SemanticToken } from './semantic';

export { fonts, tracking, lineHeightFor, tabularNums, typeRamp } from './typography';
export type { TypeStyle } from './typography';

export { spacing, gutter } from './spacing';
export type { SpacingToken } from './spacing';

export { radii } from './radii';
export type { RadiusToken } from './radii';

export { shadows } from './shadows';
export type { ShadowToken } from './shadows';

export { durations, easing, resolveDuration } from './motion';
export type { DurationToken } from './motion';

export { useReducedMotion } from './useReducedMotion';
