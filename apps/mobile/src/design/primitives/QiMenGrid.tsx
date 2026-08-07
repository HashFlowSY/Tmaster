import { StyleSheet, Text, View } from 'react-native';
import { radii } from '../radii';
import { semantic } from '../semantic';
import { fonts, tracking } from '../typography';

export interface PalaceCell {
  /** 门（原型 .men，如「休/生/伤…」或中宫「中」）——衬线。 */
  men: string;
  /** 星 · 宫（原型 .star，如「天蓬 · 坎一」）。 */
  star: string;
  /** 金色强调：'center' = 中宫（金软底 + 金边）；'zhi' = 值符宫（金边 + 内金环）。 */
  emphasis?: 'center' | 'zhi';
}

export interface QiMenGridProps {
  /** 九宫格子，行主序（左上→右下）共 9 个。 */
  cells: readonly PalaceCell[];
}

// 中宫 / 值符宫的一次性金色描边值（原型内联 rgba）——奇门局专属、非通用 token，就地成常量。
const CENTER_BORDER = 'rgba(201,162,74,0.4)';
const ZHI_BORDER = 'rgba(201,162,74,0.45)';
const ZHI_RING = 'inset 0px 0px 0px 1px rgba(201,162,74,0.15)';

const COLS = 3;

/**
 * QiMenGrid —— Tier-2「奇门局」九宫格（spec §Primitives:Palace / issue 08；裁定 text + View，不用 SVG）。
 * 原型 .qmgrid：3×3、gap6；每宫 .palace 为 ink-3 底 + line 描边 + r10 的居中方格——门（.men，衬线）+ 星宫（.star）。
 * 中宫（.center）金软底 + 金边 + gold-2 门；值符宫（.zhi）金边 + 内金环 + gold-2 门。奇门用金色强调，不涉五行色。
 * 纯表现型（无交互，不设行为测试）。RN 无 CSS grid：按行分块渲染，方格用 flex:1 + aspectRatio:1 保证等宽正方。
 */
export function QiMenGrid({ cells }: QiMenGridProps) {
  const rows: PalaceCell[][] = [];
  for (let i = 0; i < cells.length; i += COLS) rows.push(cells.slice(i, i + COLS));

  return (
    <View style={styles.grid}>
      {rows.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((cell, c) => {
            const isCenter = cell.emphasis === 'center';
            const isZhi = cell.emphasis === 'zhi';
            return (
              <View
                key={c}
                style={[styles.palace, isCenter && styles.center, isZhi && styles.zhi]}
              >
                <Text style={[styles.men, (isCenter || isZhi) && styles.menEmphasis]}>{cell.men}</Text>
                <Text style={styles.star} numberOfLines={1}>
                  {cell.star}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // 原型 .qmgrid：3 列、gap6。按行分块 → 每行 gap6、行间 gap6。
  grid: { gap: 6 },
  row: { flexDirection: 'row', gap: 6 },
  // 原型 .palace：正方（aspect-ratio 1）、ink-3 底、line 描边、r10、居中列、gap3、padding4。
  palace: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: semantic.surfaceInput,
    borderWidth: 1,
    borderColor: semantic.border,
    borderRadius: radii.sm, // 10
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    padding: 4,
  },
  // 中宫：金软底 + 金边。
  center: { backgroundColor: semantic.accentSoft, borderColor: CENTER_BORDER },
  // 值符宫：金边 + 内金环。
  zhi: { borderColor: ZHI_BORDER, boxShadow: ZHI_RING },
  // 原型 .men：衬线 17 / 象牙。
  men: { fontFamily: fonts.serif, fontSize: 17, color: semantic.textPrimary },
  // 中宫 / 值符宫的门转 gold-2。
  menEmphasis: { color: semantic.accentBright },
  // 原型 .star：10.5 / muted / .08em。
  star: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
    letterSpacing: tracking(0.08, 10.5),
    color: semantic.textSecondary,
    textAlign: 'center',
  },
});
