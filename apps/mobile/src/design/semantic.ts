import { palette } from './palette';

// 语义别名层 —— 组件代码按「角色」取色（bg / textPrimary / accent…），
// 不直接引用原语 hex。spec §3。
export const semantic = {
  bg: palette.ink,
  surface: palette.ink2,
  surfaceInput: palette.ink3,
  surfaceTrack: palette.ink4,

  textPrimary: palette.ivory,
  textSecondary: palette.muted,
  textFaint: palette.muted2,

  accent: palette.gold,
  accentBright: palette.gold2,
  accentSoft: palette.goldSoft,
  // 金色渐变/填充之上的前景色（原型 .btn-primary color:#241a06 等内联深墨金）。它不是原型 :root 变量，
  // 故不入 palette；作为 Button/Checkbox/Composer 共用的「on-accent」对比色提到语义层，避免各处重复魔法值。
  onAccent: '#241a06',

  border: palette.line,
  borderFaint: palette.line2,

  // danger 复用五行「火」的值，纠正旧 theme.ts 的 #c05050（spec §3）。
  // 这是被认可的语义别名——UI 代码用 `semantic.danger`，而非直接取 palette.wxHuo。
  danger: palette.wxHuo,
  success: palette.ok,
} as const;

export type SemanticToken = keyof typeof semantic;
