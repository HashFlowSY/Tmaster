import { Pressable, StyleSheet, View } from 'react-native';
import { semantic } from '../semantic';
import { tracking } from '../typography';
import { Icon } from './Icon';
import { HSerif } from './Type';

// 原型 .icon-btn 圆角 11 —— 非通用 radii 档（介于 sm10/md12），就地成常量（同命盘分享键 / 我的设置键 / Pager）。
const ICON_BTN_RADIUS = 11;

export interface TitleBarProps {
  /** 居中衬线标题（原型 .apphead h1，就地 21→19）。 */
  title: string;
  /** 返回键回调（原型 .icon-btn 的 data-goto）。 */
  onBack: () => void;
  /** 返回键无障碍名，默认「返回」。 */
  backLabel?: string;
}

/**
 * TitleBar —— 二级页顶部衬线标题栏（原型 .apphead .title-row，spec §8 / issue 10、11）。
 * 左侧 38×38 返回键（.icon-btn，ink-2 底 + line 描边 + r11）+ 居中衬线标题（.apphead h1 缩到 19、.1em、
 * 象牙）+ 右侧等宽占位令标题真正居中（原型 spacer width:38）。返回键按下走 onBack，`button` 角色 + 无障碍名。
 * 传入 `Screen` 的 header 槽使用。视觉忠实度双端人工核对（spec Testing Decisions）。
 *
 * 历史（issue 10）与收藏（issue 11）两个二级列表页的标题栏结构逐字一致（仅标题不同），抽为本组件
 * 以免二级页标题栏分叉；与 `MenuList`/`ListRow` 那类结构不同故不合并的裁定相反——这里两处形状完全相同。
 */
export function TitleBar({ title, onBack, backLabel = '返回' }: TitleBarProps) {
  return (
    <View style={styles.titleRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        onPress={onBack}
        style={styles.iconBtn}
        hitSlop={6}
      >
        <Icon name="back" color={semantic.textPrimary} size={18} />
      </Pressable>
      <HSerif variant="head" style={styles.title} numberOfLines={1}>
        {title}
      </HSerif>
      {/* 右侧占位，令标题真正居中（原型 .title-row 的 width:38 spacer）。 */}
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  // 原型 .apphead .title-row：横排、居中、两端对齐；纵向 padding = apphead 顶 2 + title-row 6/14。
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 14,
  },
  // 原型 .icon-btn：38×38 / ink-2 底 / line 描边 / r11。
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: ICON_BTN_RADIUS,
    backgroundColor: semantic.surface,
    borderWidth: 1,
    borderColor: semantic.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 原型列表页 h1：衬线 19（.apphead h1 的 21 就地缩到 19）、.1em、象牙；flex 居中。
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 19,
    letterSpacing: tracking(0.1, 19),
  },
  // 与左侧返回键等宽的右侧占位，保证标题真正居中（原型 spacer width:38）。
  spacer: { width: 38 },
});
