import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import { radii } from '../radii';
import { semantic } from '../semantic';

export interface CheckboxProps {
  /** 勾选态（受控）。 */
  checked: boolean;
  /** 切换回调，收到取反后的新值。 */
  onChange: (checked: boolean) => void;
  /** true 时惰性：不触发 onChange、降透明度。 */
  disabled?: boolean;
  /** 勾选框右侧标签内容（原型 consent /「时辰未知」的说明文字）。 */
  children?: ReactNode;
  /** 无障碍标签；省略时由 children 提供可读文本。 */
  accessibilityLabel?: string;
}

/**
 * Checkbox —— Tier-2 自定义金色勾选框（spec §7 裁定：RN 无可样式化原生 checkbox，故自绘）。
 * 结构：16×16 方框（勾选=金填充 + 深墨金对勾，未勾=输入底 + line 描边）+ 右侧标签内容。
 * 切换 checked 并以取反值触发 onChange；checkbox 角色/状态供无障碍与测试断言——由 Checkbox.test 覆盖
 * （只断言行为与状态，不断言对勾 SVG / 颜色，spec Testing Decisions）。
 */
export function Checkbox({ checked, onChange, disabled = false, children, accessibilityLabel }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={6}
      onPress={() => onChange(!checked)}
      style={[styles.row, disabled && styles.disabled]}
    >
      <View style={[styles.box, checked ? styles.boxChecked : styles.boxUnchecked]}>
        {checked ? (
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path
              d="M5 12.5l4 4 10-10.5"
              stroke={semantic.onAccent}
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : null}
      </View>
      {children != null ? <View style={styles.label}>{children}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // 原型 consent 行：align-items:flex-start + gap:9（顶对齐首行文字）。
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  disabled: { opacity: 0.4 },
  // 16×16 方框，marginTop:1 对齐首行文字基线（原型 checkbox margin-top:1px）。
  box: {
    width: 16,
    height: 16,
    marginTop: 1,
    borderRadius: radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxUnchecked: {
    backgroundColor: semantic.surfaceInput,
    borderWidth: 1,
    borderColor: semantic.border,
  },
  // accent-color:var(--gold) → 金填充（勾选态）。
  boxChecked: { backgroundColor: semantic.accent },
  label: { flex: 1 },
});
