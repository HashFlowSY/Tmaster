import { StyleSheet, Text, View } from 'react-native';
import { radii } from '../radii';
import { semantic } from '../semantic';
import { fonts, tabularNums } from '../typography';

export interface ElementBar {
  /** 五行短名（原型 .bl，金/木/水/火/土）。 */
  label: string;
  /** 计数（原型 .bn）。 */
  count: number;
  /** 该五行的数据编码色（原型 .fill 背景，由 chart/fiveElement 派生注入）。 */
  color: string;
}

export interface ElementBarsProps {
  bars: readonly ElementBar[];
}

// 原型条宽标定：满格（计数=最大值）→ 78%，计数为 0 → 6% 桩宽。中间线性内插。
// 这是纯视觉的数据编码映射（非逻辑），按 spec「视觉双端人工核对、不写测试」就地保留。
const FULL_PCT = 78;
const ZERO_PCT = 6;
function fillPercent(count: number, max: number): number {
  if (count <= 0 || max <= 0) return ZERO_PCT;
  return (count / max) * FULL_PCT;
}

/**
 * ElementBars —— 命盘「五行强弱」水平条（spec §8 / issue 08）。
 * 原型 .balance：每行 = 五行名（.bl，五行色衬线）+ 轨道（.track，ink-4）+ 填充（.fill，五行色）+ 计数（.bn）。
 * 计数由 chart/fiveElement.elementBalance 派生（清点四柱干支），色同为派生注入——本组件纯表现型，不引 palette.wx*。
 */
export function ElementBars({ bars }: ElementBarsProps) {
  const max = bars.reduce((m, b) => Math.max(m, b.count), 0);
  return (
    <View style={styles.balance}>
      {bars.map((b) => (
        <View key={b.label} style={styles.bar}>
          <Text style={[styles.bl, { color: b.color }]}>{b.label}</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${fillPercent(b.count, max)}%`, backgroundColor: b.color }]} />
          </View>
          <Text style={styles.bn}>{b.count}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // 原型 .balance：纵向、gap11、上距 6。
  balance: { gap: 11, marginTop: 6 },
  // 原型 .bar：横排、居中、gap12。
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  // 原型 .bl：宽 20、衬线 16、居中（五行色注入）。
  bl: { width: 20, fontFamily: fonts.serif, fontSize: 16, textAlign: 'center' },
  // 原型 .track：占满剩余、高 8、ink-4 底、r5、裁剪填充。
  track: {
    flex: 1,
    height: 8,
    backgroundColor: semantic.surfaceTrack,
    borderRadius: 5,
    overflow: 'hidden',
  },
  // 原型 .fill：满高、r5（宽 + 背景色行内注入）。
  fill: { height: '100%', borderRadius: 5 },
  // 原型 .bn：宽 22、靠右、13、muted、等宽数字。
  bn: {
    width: 22,
    textAlign: 'right',
    fontFamily: fonts.sans,
    fontSize: 13,
    color: semantic.textSecondary,
    ...tabularNums,
  },
});
