import { StyleSheet, Text, View } from 'react-native';
import { radii } from '../radii';
import { semantic } from '../semantic';
import { fonts, tracking } from '../typography';

export interface KvRow {
  /** 键（原型 .kv .k，如「宜」「忌」「利方位」）——muted、不换行。 */
  k: string;
  /** 值（原型 .kv .v）——象牙、靠右。 */
  v: string;
  /** true 时值用成功色（原型 .kv .v.ok，如吉利的宜忌 / 方位）。 */
  ok?: boolean;
}

export interface KvCardProps {
  /** 卡片小标题（原型 .card .ct，如「乙巳年 · 事业要点」）——gold-2 衬线。 */
  title: string;
  /** 键值行（原型 .card 内的若干 .kv）。 */
  rows: readonly KvRow[];
}

/**
 * KvCard —— Tier-2 对话气泡内嵌的键值卡（spec §Primitives / issue 07）。
 * 原型 .bubble .card：ink-2 底 + line 描边 + r12；金色衬线小标题，其下若干「键—值」行（行间 line-2 分隔，
 * 末行无分隔）。纯表现型。**1:1 例外（spec §3 / User Story 11·31）**：原型个别值用了五行色（wx-jin/
 * wx-huo）作强调，但五行色被裁定仅限「命盘」内作数据编码、禁作通用 UI 色，故此处只提供默认象牙与 `ok`
 * 成功色两档，不透传五行色。视觉忠实度双端人工核对。
 */
export function KvCard({ title, rows }: KvCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {rows.map((row, i) => {
        const isLast = i === rows.length - 1;
        return (
          <View key={`${row.k}-${i}`} style={[styles.kv, isLast && styles.kvLast]}>
            <Text style={styles.k}>{row.k}</Text>
            <Text style={[styles.v, row.ok && styles.vOk]}>{row.v}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // 原型 .bubble .card：上距 11、ink-2 底、line 描边、r12、padding12。
  card: {
    marginTop: 11,
    backgroundColor: semantic.surface,
    borderWidth: 1,
    borderColor: semantic.border,
    borderRadius: radii.md, // 12
    padding: 12,
  },
  // 原型 .card .ct：衬线 13 / .14em / gold-2 / 下距 9。
  title: {
    fontFamily: fonts.serif,
    fontSize: 13,
    letterSpacing: tracking(0.14, 13),
    color: semantic.accentBright,
    marginBottom: 9,
  },
  // 原型 .card .kv：两端对齐、13、上下 5、底部 line-2 分隔、gap12。
  kv: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: semantic.borderFaint,
  },
  // 末行无分隔（原型 .kv:last-child border-bottom:none）。
  kvLast: { borderBottomWidth: 0 },
  // 原型 .kv .k：muted、不换行。
  k: { fontFamily: fonts.sans, fontSize: 13, color: semantic.textSecondary },
  // 原型 .kv .v：象牙、靠右、占据剩余宽度。
  v: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: semantic.textPrimary, textAlign: 'right' },
  // 原型 .kv .v.ok：成功色。
  vOk: { color: semantic.success },
});
