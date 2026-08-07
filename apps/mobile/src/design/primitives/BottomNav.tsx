import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { semantic } from '../semantic';
import { fonts, tracking } from '../typography';
import { Icon, type IconName } from './Icon';

// 底栏底色 —— 原型 .bottomnav background:rgba(11,13,18,.92)（= ink@92%）。裁定：drop backdrop-filter
// blur，用这个已 92% 不透明的实底（spec §7 effects 表 / issue 06）。一次性值，非通用 token。
const NAV_BG = 'rgba(11,13,18,0.92)';
// 图标尺寸 —— 原型 .navbtn svg 21×21（比通用 Icon 默认 18 大）。一次性值，非通用 token。
const NAV_ICON_SIZE = 21;
// 底栏上下内边距 —— 原型 .bottomnav padding 9（底部再叠安全区 inset）。
const BAR_PAD_V = 9;

export interface BottomNavItem {
  /** 该 tab 的稳定标识（= expo-router 路由名，如 'chat'）；onSelect / activeKey 均以此为准。 */
  key: string;
  /** tab 文字（原型 .navbtn span，如「对话」「命盘」「我的」）。同时作无障碍名。 */
  label: string;
  /** tab 图标名（见 ./icons 注册表）。原型 stroke=currentColor 随激活态在 gold-2 / muted 间切换。 */
  icon: IconName;
}

export interface BottomNavProps {
  /** tab 列表（原型三项：对话 / 命盘 / 我的）。 */
  items: readonly BottomNavItem[];
  /** 当前激活 tab 的 key（受控）。命中项高亮 accentBright，其余 textSecondary。 */
  activeKey: string;
  /** 按下某个 tab 时以其 key 触发（路由跳转由调用方 —— (tabs) 布局的 tabBar 适配器 —— 负责）。 */
  onSelect: (key: string) => void;
}

/**
 * BottomNav —— Tier-1 主导航底栏（spec §Primitives）。表现型 + 行为型:渲染实底（ink@92%,裁定去 blur）
 * + 顶描边的横向 tab 条,每个 tab = Icon + 文字,激活项 icon/文字取 accentBright、其余 textSecondary。
 * 底部内边距吃安全区（原型 env(safe-area-inset-bottom)）。与 expo-router 解耦——只吐 onSelect(key)，
 * 由 (tabs) 布局的 tabBar 适配器把 react-navigation 的 state/navigation 桥到这里（spec：BottomNav 整合
 * expo-router Tabs）。行为（onSelect / 选中态）由 BottomNav.test 覆盖；视觉忠实度双端人工核对。
 */
export function BottomNav({ items, activeKey, onSelect }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: BAR_PAD_V + insets.bottom }]}>
      {items.map((item) => {
        const selected = item.key === activeKey;
        const color = selected ? semantic.accentBright : semantic.textSecondary;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={item.label}
            onPress={() => onSelect(item.key)}
            style={styles.item}
          >
            <Icon name={item.icon} color={color} size={NAV_ICON_SIZE} />
            <Text style={[styles.label, { color }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // 原型 .bottomnav：flex 行、实底、顶描边、padding 9/12（底部再叠安全区，见上方 paddingBottom）。
  bar: {
    flexDirection: 'row',
    backgroundColor: NAV_BG,
    borderTopWidth: 1,
    borderTopColor: semantic.border,
    paddingTop: BAR_PAD_V,
    paddingHorizontal: 12,
  },
  // 原型 .navbtn：等宽、纵向、居中、gap4、padding 上下 5。
  item: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
  },
  // 原型 .navbtn span：11 / .08em（色随激活态注入，见上方 color）。
  label: {
    fontFamily: fonts.sans,
    fontSize: 11,
    letterSpacing: tracking(0.08, 11),
  },
});
