import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { radii } from '../radii';
import { semantic } from '../semantic';

export interface CardProps {
  children: ReactNode;
  /** false 时去掉内边距（内容自控留白，如整块自带 padding 的列表）。默认 true。 */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Card —— Tier-1 表现型「有边框的容器面」（spec §Primitives）。
 * 原型 .chartcard：ink-2 底 + line 描边 + r18 + padding18。命盘三张卡（命主/五行强弱/奇门局）都用它；
 * 卡间距由属主页面的 gap 控制，不写进 Card 自身外边距，保持可组合。纯表现型（同 Screen/Persona，不设行为测试）。
 */
export function Card({ children, padded = true, style }: CardProps) {
  return <View style={[styles.card, padded && styles.padded, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  // 原型 .chartcard：ink-2 底、line 描边、r18。
  card: {
    backgroundColor: semantic.surface,
    borderWidth: 1,
    borderColor: semantic.border,
    borderRadius: radii.card, // 18
  },
  padded: { padding: 18 },
});
