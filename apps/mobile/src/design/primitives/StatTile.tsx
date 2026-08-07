import { StyleSheet, Text, View } from 'react-native';
import { radii } from '../radii';
import { semantic } from '../semantic';
import { fonts, tabularNums, tracking } from '../typography';

export interface StatItem {
  /** 数值（原型 .num，衬线 24、等宽数字）。用 string 以支持未加载占位「—」。 */
  value: number | string;
  /** 标签（原型 .lb，11.5 muted .06em）。 */
  label: string;
}

export interface StatTileProps {
  items: readonly StatItem[];
}

/**
 * StatTile —— Tier-2 统计条（我的页属主，spec §Primitives / issue 09）。
 * 原型 .stats：ink-2 底 + line 描边 + r16 的等分网格,每格（.stat）= 大号衬线数值（.num，等宽数字）
 * + muted 标签（.lb）。格间 line-2 竖分隔（末格无）。等宽数字保证不同位数不抖动。
 * 卡的外边距由属主页控制,不写进本组件（同 Card / ElementBars 的可组合约定）。纯表现型,不设行为测试。
 */
export function StatTile({ items }: StatTileProps) {
  return (
    <View style={styles.stats}>
      {items.map((it, i) => (
        <View key={it.label} style={[styles.stat, i < items.length - 1 && styles.divider]}>
          <Text style={styles.num}>{it.value}</Text>
          <Text style={styles.lb}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // 原型 .stats：横排等分、ink-2 底、line 描边、r16、裁剪竖分隔到圆角。
  stats: {
    flexDirection: 'row',
    backgroundColor: semantic.surface,
    borderWidth: 1,
    borderColor: semantic.border,
    borderRadius: radii.lg, // 16
    overflow: 'hidden',
  },
  // 原型 .stat：等分、padding 16/8、居中。
  stat: { flex: 1, paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center' },
  // 原型 .stat 竖分隔 line-2（:last-child 无）。
  divider: { borderRightWidth: 1, borderRightColor: semantic.borderFaint },
  // 原型 .stat .num：衬线 24、象牙、等宽数字。
  num: { fontFamily: fonts.serif, fontSize: 24, color: semantic.textPrimary, ...tabularNums },
  // 原型 .stat .lb：11.5、muted、.06em、上距 5。
  lb: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    letterSpacing: tracking(0.06, 11.5),
    color: semantic.textSecondary,
    marginTop: 5,
  },
});
