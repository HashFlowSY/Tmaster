import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii } from '../radii';
import { semantic } from '../semantic';
import { shadows } from '../shadows';
import { fonts, tracking } from '../typography';

// 选中项内描边圆角（原型 .seg button border-radius:9）——非通用 radii 档，就地成常量。
const SEG_ITEM_RADIUS = 9;

export interface SegmentedOption<T extends string> {
  /** 选项显示文字（原型 .seg button 文本，如「乾造 · 男」「公历」）。 */
  label: string;
  /** 选中时回传给 onChange 的值。 */
  value: T;
}

export interface SegmentedControlProps<T extends string> {
  /** 分段选项（原型 .seg 内的按钮组）。 */
  options: readonly SegmentedOption<T>[];
  /** 当前选中值（受控）。 */
  value: T;
  /** 选中某项时以其 value 触发。 */
  onChange: (value: T) => void;
  /** 分段组的无障碍标签（原型 role="group" aria-label，如「性别」「历法」）。 */
  accessibilityLabel?: string;
}

/**
 * SegmentedControl —— Tier-1 交互 primitive（spec §Primitives）。
 * 结构：ink-3 底 + line 描边的胶囊容器（原型 .seg），内含等宽分段按钮。选中项 = accentSoft(gold-soft)
 * 填充 + gold-2 文字 + 金色内描边环（原型 .seg button[aria-pressed]）。按下任一项以其 value 触发 onChange，
 * button 角色 + selected 状态供无障碍与测试断言——由 SegmentedControl.test 覆盖（只断言行为与选中态，
 * 不断言填充 / 内描边样式，spec Testing Decisions）。
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.group} accessibilityLabel={accessibilityLabel}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(opt.value)}
            style={[styles.item, selected && styles.itemSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // 原型 .seg：ink-3 底 + line 描边 + r12 + padding4 + gap4。
  group: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    backgroundColor: semantic.surfaceInput,
    borderWidth: 1,
    borderColor: semantic.border,
    borderRadius: radii.md, // 12
  },
  // 原型 .seg button：等宽、padding10、r9。
  item: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: SEG_ITEM_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 选中：gold-soft 填充 + 金色内描边（原型 .seg button[aria-pressed=true]）。
  itemSelected: {
    backgroundColor: semantic.accentSoft,
    boxShadow: shadows.segRing,
  },
  // 原型 .seg button：14 / muted / .06em。
  label: {
    fontFamily: fonts.sans,
    fontSize: 14,
    letterSpacing: tracking(0.06, 14),
    color: semantic.textSecondary,
  },
  // 选中文字：gold-2。
  labelSelected: { color: semantic.accentBright },
});
