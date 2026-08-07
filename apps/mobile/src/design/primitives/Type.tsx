import type { ReactNode } from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { semantic } from '../semantic';
import { typeRamp } from '../typography';

// 字体排印原子 —— type ramp(spec §4)的薄封装。族/字号/字距/行高全部取自 token,不在此处硬编码。
// 五行色是「八字盘」内部按柱注入的数据编码(spec User Story 11/31),这些通用文字原子一律不碰。

interface TextAtomProps {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

/** 眉标:全大写、超大字距的无衬线小字(typeRamp.eyebrow)。 */
export function Eyebrow({ children, style, numberOfLines }: TextAtomProps) {
  return (
    <Text style={[styles.eyebrow, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

export type HSerifVariant = 'brand' | 'xl' | 'l' | 'head' | 'sec';

/** 衬线标题,variant 选 type ramp 里的衬线档;默认 xl。语义上是 heading。 */
export function HSerif({
  variant = 'xl',
  children,
  style,
  numberOfLines,
}: TextAtomProps & { variant?: HSerifVariant }) {
  return (
    <Text
      accessibilityRole="header"
      style={[styles[variant], style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}

/** 副文/说明:无衬线,舒适行高(typeRamp.sub,次要色 muted)。 */
export function Sub({ children, style, numberOfLines }: TextAtomProps) {
  return (
    <Text style={[styles.sub, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

/** 弱化文字:Sub 的字体度量 + 最弱的 faint 色(muted-2),用于提示/时间戳等去强调文字。 */
export function TextMute({ children, style, numberOfLines }: TextAtomProps) {
  return (
    <Text style={[styles.textMute, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  eyebrow: typeRamp.eyebrow,
  sub: typeRamp.sub,
  // TextMute 复用 sub 的度量(族/字号/字距/行高来自 type ramp),仅把角色色改成最弱的 faint。
  textMute: { ...typeRamp.sub, color: semantic.textFaint },
  // HSerif 各 variant → type ramp 衬线档(与上面同一套 StyleSheet 机制)。
  brand: typeRamp.brandName, // 34 登录品牌名
  xl: typeRamp.hSerifXL, // 28
  l: typeRamp.hSerifL, // 26
  head: typeRamp.hSerifHead, // 21 页面标题(.apphead h1)
  sec: typeRamp.hSerifSec, // 16 小节标题(.sectitle h2)
});
