import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { durations, easing } from '../motion';
import { radii } from '../radii';
import { semantic } from '../semantic';
import { shadows } from '../shadows';
import { fonts, tracking } from '../typography';
import { useReducedMotion } from '../useReducedMotion';
import { Icon } from './Icon';

// 展开菜单最大高度（原型 .tabmenu max-height:520）——超出滚动。
const MENU_MAX_HEIGHT = 520;
// 选中项尾部对勾（原型 .tabmenu button[aria-selected]::after content:"✓"）——金色一次性标记。
const CHECK = '✓';

export interface TabDropItem {
  /** 稳定标识（= 对话 id）；onSelect / selectedKey 均以此为准。 */
  key: string;
  /** 对话标题（原型 .opt-t，同作折叠态 .td-label）。 */
  title: string;
  /** 副标题「系统 · 时间」（原型 .opt-m）；由 chat/conversationMeta 生成。 */
  meta: string;
}

export interface TabDropProps {
  /** 最近对话列表（原型 .tabmenu 的 recent-10）。 */
  items: readonly TabDropItem[];
  /** 当前对话 key（受控）——决定折叠标签与选中项。 */
  selectedKey: string;
  /** 选择某个对话时以其 key 触发；触发后菜单自动收起。 */
  onSelect: (key: string) => void;
  /**
   * 提供即在菜单顶部渲染一个「新对话」入口（原型未画——为保留建对话能力而加的必要入口，
   * 见 issue 07 决策）；按下后菜单收起并触发它（系统 八字/奇门 的二选一由调用方 ADR-0004 承担）。
   */
  onNew?: () => void;
  /** 新对话入口的文案与无障碍名，默认「新对话」。 */
  newLabel?: string;
  /** 当 selectedKey 无匹配项（如尚无对话）时折叠标签的占位文案，默认「选择对话」。 */
  placeholder?: string;
  /** 开关的无障碍名，默认「切换对话」。 */
  accessibilityLabel?: string;
}

const BEZIER = Easing.bezier(...easing.standard);

/**
 * TabDrop —— Tier-2 对话切换器（spec §Primitives / issue 07，对话页属主）。
 * 结构：居中胶囊开关（原型 .tabdrop）显示当前对话标题 + 下箭头 caret；按下展开一个覆盖在其下、
 * 可滚动的最近对话菜单（原型 .tabmenu），每项 = 标题 + 「系统 · 时间」副标题，选中项 gold-2 文字 +
 * 尾部金色 ✓。caret 展开时旋转 180°、菜单淡入 + 上移落位，皆走 Reanimated 并订阅「减少动态效果」。
 * 展开时在其后铺一层透明背板，点击空白处收起。行为（开合 / 选择 / 选中态）由 TabDrop.test 覆盖；
 * 视觉忠实度双端人工核对。
 */
export function TabDrop({
  items,
  selectedKey,
  onSelect,
  onNew,
  newLabel = '新对话',
  placeholder = '选择对话',
  accessibilityLabel = '切换对话',
}: TabDropProps) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const label = items.find((i) => i.key === selectedKey)?.title ?? placeholder;

  // 0↔1 驱动 caret 旋转 + 菜单透明度/位移。
  const anim = useSharedValue(0);
  useEffect(() => {
    anim.value = reduced
      ? open
        ? 1
        : 0
      : withTiming(open ? 1 : 0, { duration: durations.base, easing: BEZIER });
  }, [open, reduced, anim]);

  const caretStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${anim.value * 180}deg` }],
  }));
  const menuStyle = useAnimatedStyle(() => ({
    opacity: anim.value,
    transform: [{ translateY: (1 - anim.value) * -6 }],
  }));

  const choose = (key: string) => {
    setOpen(false);
    onSelect(key);
  };

  const startNew = () => {
    setOpen(false);
    onNew?.();
  };

  return (
    <View style={styles.head}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={styles.trigger}
      >
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Animated.View style={caretStyle}>
          <Icon name="chevronDown" color={semantic.accentBright} size={15} />
        </Animated.View>
      </Pressable>

      {open ? (
        <>
          {/* 透明背板：点击菜单外空白处收起（原型点选/失焦收起）。 */}
          <Pressable
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.backdrop}
            onPress={() => setOpen(false)}
          />
          <Animated.View style={[styles.menu, menuStyle]}>
            <ScrollView
              style={styles.menuScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {onNew != null ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={newLabel}
                  onPress={startNew}
                  style={[styles.opt, styles.newOpt]}
                >
                  <Icon name="chat" color={semantic.accentBright} size={16} />
                  <Text style={styles.newLabel}>{newLabel}</Text>
                </Pressable>
              ) : null}
              {items.map((item) => {
                const selected = item.key === selectedKey;
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                    accessibilityState={{ selected }}
                    onPress={() => choose(item.key)}
                    style={styles.opt}
                  >
                    <View style={styles.optMain}>
                      <Text
                        style={[styles.optTitle, selected && styles.optTitleSelected]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.optMeta} numberOfLines={1}>
                        {item.meta}
                      </Text>
                    </View>
                    {selected ? <Text style={styles.check}>{CHECK}</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // 原型 .chat-head：居中、相对定位（供菜单绝对定位其下）。
  head: { alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  // 原型 .tabdrop：ink-2 底 + line 描边 + 胶囊 + 衬线 16.5/.14em。
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 290,
    backgroundColor: semantic.surface,
    borderWidth: 1,
    borderColor: semantic.border,
    borderRadius: radii.pill, // 999
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  // 原型 .td-label：象牙、.06em、省略号截断。
  label: {
    flexShrink: 1,
    fontFamily: fonts.serif,
    fontSize: 16.5,
    letterSpacing: tracking(0.06, 16.5),
    color: semantic.textPrimary,
  },
  // 覆盖全区的透明背板（点击收起）；置于菜单之下、开关之上。
  backdrop: {
    position: 'absolute',
    top: 0,
    left: -1000,
    right: -1000,
    bottom: -2000,
    zIndex: 40,
  },
  // 原型 .tabmenu：ink-3 底 + line 描边 + r16 + 阴影，绝对定位在开关下方、通栏（左右 20 留白由外层给足）。
  menu: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    zIndex: 60,
    backgroundColor: semantic.surfaceInput,
    borderWidth: 1,
    borderColor: semantic.border,
    borderRadius: radii.lg, // 16
    padding: 6,
    boxShadow: shadows.menu,
  },
  menuScroll: { maxHeight: MENU_MAX_HEIGHT },
  // 原型 .tabmenu button：两端对齐、padding 12-14、r10。
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.sm, // 10
  },
  // 新对话入口：横排图标 + 文字，底部一条 line 分隔以与最近列表区隔（原型未画的必要入口）。
  newOpt: {
    gap: 10,
    justifyContent: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: semantic.border,
  },
  newLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    letterSpacing: tracking(0.04, 14),
    color: semantic.accentBright,
  },
  // 原型 .opt-main：纵向、gap3、左对齐、可收缩以让 ✓ 靠右。
  optMain: { flex: 1, flexDirection: 'column', gap: 3, alignItems: 'flex-start' },
  // 原型 .opt-t：14 / 象牙 / .04em / 省略号。
  optTitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    letterSpacing: tracking(0.04, 14),
    color: semantic.textPrimary,
  },
  // 选中标题：gold-2（原型 button[aria-selected] .opt-t）。
  optTitleSelected: { color: semantic.accentBright },
  // 原型 .opt-m：11 / muted-2 / .08em。
  optMeta: {
    fontFamily: fonts.sans,
    fontSize: 11,
    letterSpacing: tracking(0.08, 11),
    color: semantic.textFaint,
  },
  // 选中 ✓：金色（原型 ::after color:gold）。
  check: { fontFamily: fonts.sans, fontSize: 13, color: semantic.accent },
});
