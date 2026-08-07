import { Pressable, StyleSheet, Text, View } from 'react-native';
import { semantic } from '../semantic';
import { fonts, tabularNums, tracking } from '../typography';

// 原型 .pg[aria-current] 选中项金边（gold@42%）——分页专用一次性色，非通用 token（原型 §分页）。
const CURRENT_BORDER = 'rgba(201,162,74,0.42)';
// 原型 .pg border-radius:11 —— 非通用 radii 档（介于 sm10/md12），就地成常量（同注册页/命盘的 r11 键）。
const PG_RADIUS = 11;
// 原型上一页/下一页导航符（‹ / ›）。
const PREV_GLYPH = '‹';
const NEXT_GLYPH = '›';

export interface PagerProps {
  /** 当前页（1-based）。 */
  page: number;
  /** 总页数。 */
  totalPages: number;
  /** 请求切换到某页时触发（页码 / 上一页 / 下一页统一走它）。 */
  onPageChange: (page: number) => void;
  /** 容器无障碍名，默认「分页」。 */
  accessibilityLabel?: string;
  /** 上一页按钮无障碍名，默认「上一页」。 */
  prevLabel?: string;
  /** 下一页按钮无障碍名，默认「下一页」。 */
  nextLabel?: string;
}

/**
 * Pager —— Tier-2 分页控件（历史/收藏页属主，spec §Primitives / issue 10）。
 * 原型 .pager：居中一行「‹ · 页码… · ›」。页码 = min-width 38 的 ink-2 胶囊按钮，选中页（aria-current）
 * gold-soft 底 + gold-2 文字 + 金边；首/末页时上/下一页按钮禁用（opacity .3、不可按）。按下页码/上下页
 * 以目标页码触发 onPageChange。区间计算是 list/pager 的纯函数（见其单测），本组件只渲染控件。
 * `button` 角色 + 选中/禁用无障碍状态供读屏；行为测试见 Pager.test.tsx；视觉忠实度双端人工核对。
 */
export function Pager({
  page,
  totalPages,
  onPageChange,
  accessibilityLabel = '分页',
  prevLabel = '上一页',
  nextLabel = '下一页',
}: PagerProps) {
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <View style={styles.pager} accessibilityRole="toolbar" accessibilityLabel={accessibilityLabel}>
      <Nav glyph={PREV_GLYPH} label={prevLabel} disabled={!hasPrev} onPress={() => onPageChange(page - 1)} />
      {pages.map((n) => {
        const current = n === page;
        return (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={String(n)}
            accessibilityState={{ selected: current }}
            onPress={() => onPageChange(n)}
            style={[styles.pg, current && styles.pgCurrent]}
          >
            <Text style={[styles.pgText, current && styles.pgTextCurrent]}>{n}</Text>
          </Pressable>
        );
      })}
      <Nav glyph={NEXT_GLYPH} label={nextLabel} disabled={!hasNext} onPress={() => onPageChange(page + 1)} />
    </View>
  );
}

/** 上/下一页导航键（原型 .pg.nav）：象牙大号符号；禁用时降透明度且不可按。 */
function Nav({
  glyph,
  label,
  disabled,
  onPress,
}: {
  glyph: string;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.pg, disabled && styles.pgDisabled]}
    >
      <Text style={styles.navText}>{glyph}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // 原型 .pager：横排、居中、gap8、上外边距 24 下 6。
  pager: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 6,
  },
  // 原型 .pg：min-width 38、高 38、padding 0/11、ink-2 底、line 描边、r11、居中。
  pg: {
    minWidth: 38,
    height: 38,
    paddingHorizontal: 11,
    borderRadius: PG_RADIUS, // 原型 11
    backgroundColor: semantic.surface,
    borderWidth: 1,
    borderColor: semantic.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 原型 .pg[aria-current]：gold-soft 底 + 金边。
  pgCurrent: { backgroundColor: semantic.accentSoft, borderColor: CURRENT_BORDER },
  // 原型 .pg:disabled：opacity .3。
  pgDisabled: { opacity: 0.3 },
  // 原型 .pg：14、muted、等宽数字。
  pgText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    letterSpacing: tracking(0.02, 14),
    color: semantic.textSecondary,
    ...tabularNums,
  },
  // 原型 .pg[aria-current]：gold-2 文字。
  pgTextCurrent: { color: semantic.accentBright },
  // 原型 .pg.nav：象牙、17、行高 1。
  navText: { fontFamily: fonts.sans, fontSize: 17, lineHeight: 17, color: semantic.textPrimary },
});
