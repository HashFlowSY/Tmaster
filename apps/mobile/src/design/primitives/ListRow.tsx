import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii } from '../radii';
import { semantic } from '../semantic';
import { fonts, tabularNums, tracking } from '../typography';
import { Icon } from './Icon';
import type { IconName } from './icons';

// 原型 .convrow:hover 的极淡象牙覆盖（rgba(233,220,190,.025)）——会话行专用一次性按压反馈色
// （hover→press 映射），非通用调色板 token，就地成常量并注明出处。
const PRESSED_BG = 'rgba(233,220,190,0.025)';

/**
 * 标题变体：
 * - `default`（历史页）——原型 .ctitle：单行省略。
 * - `favorite`（收藏页）——原型 .favtitle：两行截断（-webkit-line-clamp:2），字号/行高/下边距不同。
 */
export type ListRowVariant = 'default' | 'favorite';

export interface ListRowProps {
  /** 分型图标名（原型 .cico 内线性图标，如八字=chart / 奇门=grid；收藏行=bookmarkFilled）；金亮着色。 */
  icon: IconName;
  /** 会话标题（原型 .ctitle / .favtitle）——同时作该行无障碍名。default 单行省略、favorite 两行截断。 */
  title: string;
  /** 断语摘要（原型 .csnip）——单行省略。数据模型无预览时可省（见属主页裁定）。 */
  snippet?: string;
  /** 相对时间（原型 .ctime，如「今天 09:24」）——等宽数字，由 chat/relativeTime 生成。 */
  time: string;
  /** 系统标签（原型 .ctag，如「八字」）——胶囊描边。 */
  tag: string;
  onPress: () => void;
  /** 行间 line-2 分隔线；末行传 false（原型 .convrow:last-child 无分隔）。默认 true。 */
  divider?: boolean;
  /** 标题变体，默认 `default`（历史页单行）；`favorite` 走原型 .favtitle 两行截断。 */
  variant?: ListRowVariant;
}

/**
 * ListRow —— Tier-2 会话列表行（历史/收藏页属主，spec §Primitives / issue 10）。
 * 原型 .convrow：左侧 40×40 图标方片（.cico，ink-3 底 r12 + line 描边，金亮线性图标）+ 中部主体
 * （.ctitle 标题 + 可选 .csnip 断语，均单行省略）+ 右侧竖排 meta（.ctime 相对时间 + .ctag 系统标签胶囊）。
 * 整行可按下走 onPress，`button` 角色 + 标题作无障碍名（meta/断语不污染）。行间 line-2 分隔（末行无）。
 * 行为测试见 ListRow.test.tsx；视觉忠实度双端人工核对（spec Testing Decisions）。
 *
 * 与我的页 MenuList 的 .mitem 刻意分开：那是「图标片+标题+尾注」的设置式菜单，本组件是
 * 「标题+断语+系统分型」的可搜索长列表行，结构不同，不复用同一形状（避免过早泛化）。
 *
 * 收藏页（issue 11）复用本组件的 `favorite` 变体:标题走原型 .favtitle 两行截断（收藏 = 一整条对话，
 * 标题较长故两行；见属主页裁定），图标传 bookmarkFilled;其余结构（图标片 / meta / 分隔 / 按压）不变。
 */
export function ListRow({
  icon,
  title,
  snippet,
  time,
  tag,
  onPress,
  divider = true,
  variant = 'default',
}: ListRowProps) {
  const favorite = variant === 'favorite';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Icon name={icon} color={semantic.accentBright} size={18} />
      </View>
      <View style={styles.main}>
        <Text style={favorite ? styles.favTitle : styles.title} numberOfLines={favorite ? 2 : 1}>
          {title}
        </Text>
        {snippet != null ? (
          <Text style={styles.snippet} numberOfLines={1}>
            {snippet}
          </Text>
        ) : null}
      </View>
      <View style={styles.meta}>
        <Text style={styles.time} numberOfLines={1}>
          {time}
        </Text>
        <Text style={styles.tag} numberOfLines={1}>
          {tag}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // 原型 .convrow：横排、居中、gap13、padding 14/4、r10。
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: radii.sm, // 10
  },
  // 原型 .convrow 行间 line-2 分隔（:last-child 无）。
  divider: { borderBottomWidth: 1, borderBottomColor: semantic.borderFaint },
  // 原型 .convrow:hover → 按压反馈（极淡象牙覆盖）。
  pressed: { backgroundColor: PRESSED_BG },
  // 原型 .cico：40×40、ink-3 底、line 描边、r12、居中、不收缩。
  icon: {
    width: 40,
    height: 40,
    borderRadius: radii.md, // 12
    backgroundColor: semantic.surfaceInput,
    borderWidth: 1,
    borderColor: semantic.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 原型 .cmain：占满剩余、可收缩以让标题/断语省略。
  main: { flex: 1, minWidth: 0 },
  // 原型 .ctitle：14.5、象牙、.02em、单行省略、mb4。
  title: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    letterSpacing: tracking(0.02, 14.5),
    color: semantic.textPrimary,
    marginBottom: 4,
  },
  // 原型 .favtitle（收藏行变体）：14、象牙、行高 1.55、.02em、mb6、两行截断（numberOfLines=2）。
  favTitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 14 * 1.55,
    letterSpacing: tracking(0.02, 14),
    color: semantic.textPrimary,
    marginBottom: 6,
  },
  // 原型 .csnip：12.5、muted、行高 1.5、单行省略。
  snippet: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 12.5 * 1.5,
    color: semantic.textSecondary,
  },
  // 原型 .cmeta：竖排、右对齐、gap8、不收缩。
  meta: { flexDirection: 'column', alignItems: 'flex-end', gap: 8 },
  // 原型 .ctime：11、muted-2、等宽数字、.02em。
  time: {
    fontFamily: fonts.sans,
    fontSize: 11,
    letterSpacing: tracking(0.02, 11),
    color: semantic.textFaint,
    ...tabularNums,
  },
  // 原型 .ctag：10.5、muted、.12em、padding 2/9、line 描边、胶囊。
  tag: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
    letterSpacing: tracking(0.12, 10.5),
    color: semantic.textSecondary,
    paddingVertical: 2,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: semantic.border,
    borderRadius: radii.pill, // 999
    overflow: 'hidden',
  },
});
