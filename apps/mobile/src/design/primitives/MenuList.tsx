import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii } from '../radii';
import { semantic } from '../semantic';
import { fonts, tracking } from '../typography';
import { Icon } from './Icon';
import type { IconName } from './icons';

// 原型 .mitem:hover 的极淡象牙覆盖（rgba(233,220,190,.03)）——菜单行专用一次性按压反馈色
// （hover→press 映射），非通用调色板 token，就地成常量并注明出处。
const PRESSED_BG = 'rgba(233,220,190,0.03)';

export interface MenuRow {
  /** React key（也用作稳定标识）。 */
  key: string;
  /** 前置图标名（原型 .mitem .mi 内的线性图标）。 */
  icon: IconName;
  /** 行标题（原型 .mt）——也作该行的无障碍名。 */
  label: string;
  /** 尾部说明（原型 .ma，如「己巳日 · 乾造」「128 段」）；非 danger 行会自动附加 ›。省略则仅显示 ›。 */
  meta?: string;
  /** 危险项（原型 .mitem.danger，如「退出登录」）：图标 + 文字转 danger 色,且不显示尾部 meta/›。 */
  danger?: boolean;
  onPress: () => void;
}

export interface MenuListProps {
  rows: readonly MenuRow[];
}

/**
 * MenuList —— Tier-2 分组菜单（我的页属主，spec §Primitives / issue 09）。
 * 原型 .menu：ink-2 底 + line 描边 + r16 的卡,内含若干 .mitem 行——图标方片（.mi，ink-3 底 r10，
 * 金亮图标；danger→danger 色）+ 标题（.mt，象牙；danger→danger）+ 尾部说明与 ›（.ma，muted-2）。
 * 行间 line-2 分隔（末行无）。按下走各行 onPress,`button` 角色 + label 无障碍名供读屏;行为测试见 MenuList.test.tsx。
 *
 * 与 conversation 列表行（历史/收藏,issue 10/11 的属主页）刻意分开:那是「标题+断语+系统分型」的可搜索长列表,
 * 与本组件「图标片+标题+尾注」的设置式菜单结构不同,故不复用同一 ListRow,避免过早泛化锁死形状。
 */
export function MenuList({ rows }: MenuListProps) {
  return (
    <View style={styles.menu}>
      {rows.map((row, i) => (
        <Pressable
          key={row.key}
          accessibilityRole="button"
          accessibilityLabel={row.label}
          onPress={row.onPress}
          style={({ pressed }) => [
            styles.item,
            i < rows.length - 1 && styles.divider,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.chip}>
            <Icon
              name={row.icon}
              color={row.danger ? semantic.danger : semantic.accentBright}
              size={18}
            />
          </View>
          <Text style={[styles.label, row.danger && styles.labelDanger]} numberOfLines={1}>
            {row.label}
          </Text>
          {/* 尾部 .ma：非 danger 行显示「meta ›」（无 meta 则仅 ›）；danger 行原型为空,不渲染。 */}
          {row.danger ? null : (
            <Text style={styles.meta} numberOfLines={1}>
              {row.meta != null ? `${row.meta} ›` : '›'}
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // 原型 .menu：ink-2 底、line 描边、r16、裁剪行分隔到圆角。
  menu: {
    backgroundColor: semantic.surface,
    borderWidth: 1,
    borderColor: semantic.border,
    borderRadius: radii.lg, // 16
    overflow: 'hidden',
  },
  // 原型 .mitem：横排、居中、gap14、padding 16。
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  // 原型 .mitem 行间 line-2 分隔（:last-child 无）。
  divider: { borderBottomWidth: 1, borderBottomColor: semantic.borderFaint },
  // 原型 .mitem:hover → 按压反馈。
  pressed: { backgroundColor: PRESSED_BG },
  // 原型 .mi：34×34、ink-3 底、r10、居中、不收缩。
  chip: {
    width: 34,
    height: 34,
    borderRadius: radii.sm, // 10
    backgroundColor: semantic.surfaceInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 原型 .mt：占满剩余、14.5、象牙、.03em。
  label: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14.5,
    letterSpacing: tracking(0.03, 14.5),
    color: semantic.textPrimary,
  },
  // 原型 .mitem.danger .mt：火色。
  labelDanger: { color: semantic.danger },
  // 原型 .ma：13、muted-2。
  meta: { fontFamily: fonts.sans, fontSize: 13, color: semantic.textFaint },
});
