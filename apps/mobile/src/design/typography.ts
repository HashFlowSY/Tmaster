import type { TextStyle } from 'react-native';
import { semantic } from './semantic';

// ---------- 字体族 ----------
// 双端打包 Noto Serif SC（标题）+ Noto Sans SC（正文），ADR-0006。
// RN 自带字体每个字重是独立 family（不靠 fontWeight 合成），故按字重分别命名——
// 选字重 = 选 family。这些名字必须与 app.json 里 expo-font 打包的文件名（去扩展名）一致。
// 字重对应：serif=Regular(400)；sans=Regular(400)；sansMedium=Medium(500)；sansSemiBold=SemiBold(600)。
export const fonts = {
  serif: 'NotoSerifSC-Regular',
  sans: 'NotoSansSC-Regular',
  sansMedium: 'NotoSansSC-Medium',
  sansSemiBold: 'NotoSansSC-SemiBold',
} as const;

/**
 * em 字距 → pt 字距转换器。
 *
 * 原型用 CSS `letter-spacing:.42em`（相对字号），RN 的 `letterSpacing` 是绝对 pt，
 * 于是按 `pt = em × fontSize` 为每个字号烘焙精确值，避免手算误差（spec §4）。
 */
export function tracking(em: number, fontSize: number): number {
  return em * fontSize;
}

/**
 * 行高转换器：`lineHeight = 原型倍数 × 字号`（spec §4）。与 tracking 同形——
 * 原型的 `line-height:1.15` 之类是相对倍数，RN 的 `lineHeight` 是绝对 pt。
 */
export function lineHeightFor(ratio: number, fontSize: number): number {
  return ratio * fontSize;
}

// 数字/时间/八字盘数值用等宽数字（spec §4）。带 `: TextStyle` 注解让 fontVariant 数组按 RN 类型收敛。
export const tabularNums: TextStyle = { fontVariant: ['tabular-nums'] };

/**
 * 命名字号阶梯（type ramp），字距经 tracking()、行高经 lineHeightFor() 烘焙。
 * 代表行 1:1 取自 spec §4 与原型。五行色由「八字盘」按柱通过 color prop 注入，不写进基样式。
 */
export const typeRamp = {
  // 品牌名：登录页 34pt 大字距衬线。
  brandName: {
    fontFamily: fonts.serif,
    fontSize: 34,
    letterSpacing: tracking(0.42, 34), // 14.28
    color: semantic.textPrimary,
  },
  // 衬线大标题。
  hSerifXL: {
    fontFamily: fonts.serif,
    fontSize: 28,
    letterSpacing: tracking(0.06, 28), // 1.68
    lineHeight: lineHeightFor(1.15, 28),
    color: semantic.textPrimary,
  },
  hSerifL: {
    fontFamily: fonts.serif,
    fontSize: 26,
    letterSpacing: tracking(0.04, 26), // 1.04
    lineHeight: lineHeightFor(1.15, 26),
    color: semantic.textPrimary,
  },
  // 衬线小节标题。
  hSerifHead: {
    fontFamily: fonts.serif,
    fontSize: 21,
    letterSpacing: tracking(0.1, 21), // 2.10
    color: semantic.textPrimary,
  },
  hSerifSec: {
    fontFamily: fonts.serif,
    fontSize: 16,
    letterSpacing: tracking(0.14, 16), // 2.24
    color: semantic.textPrimary,
  },
  // 眉标：全大写、超大字距的无衬线小字。
  eyebrow: {
    fontFamily: fonts.sans,
    fontSize: 11,
    letterSpacing: tracking(0.32, 11), // 3.52
    textTransform: 'uppercase',
    color: semantic.textSecondary,
  },
  // 副文/说明。
  sub: {
    fontFamily: fonts.sans,
    fontSize: 13.5,
    lineHeight: lineHeightFor(1.75, 13.5),
    color: semantic.textSecondary,
  },
  // 按钮文字：无衬线 SemiBold（字重由 family 承载）+ 字距。
  button: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    letterSpacing: tracking(0.14, 15), // 2.10
  },
  // 对话气泡正文。
  bubble: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    lineHeight: lineHeightFor(1.72, 14.5),
    color: semantic.textPrimary,
  },
  // 八字盘各柱干支：大号衬线，行内色由每柱五行注入。
  pillarGanZhi: {
    fontFamily: fonts.serif,
    fontSize: 27,
    lineHeight: lineHeightFor(1.25, 27),
  },
} satisfies Record<string, TextStyle>;

export type TypeStyle = keyof typeof typeRamp;
