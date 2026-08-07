import { Fragment } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { radii } from '../radii';
import { semantic } from '../semantic';
import { fonts, tracking } from '../typography';

// 选项列表最大高度（原型 .cascader .opts max-height:184）——超出滚动。
const OPTS_MAX_HEIGHT = 184;

export interface CascaderCrumb {
  /** 该级显示文字（原型 .crumbs 内的省 / 市 / 当前级）。 */
  label: string;
  /** true = 当前正在选择的级（原型 .cur：象牙色 + 金色下划线）；否则为已选级（gold-2 加粗）。 */
  current?: boolean;
}

export interface CascaderOption {
  /** 选项显示文字（原型 .opt 文本，如「西湖区」）。 */
  label: string;
  /** 选中时回传给 onSelect 的值。 */
  value: string;
}

export interface CascaderProps {
  /** 面包屑各级（原型 .crumbs：省 / 市 / 区县）。级间自动插入「/」分隔。 */
  crumbs: readonly CascaderCrumb[];
  /** 当前级的可选项（原型 .opts 列表）。 */
  options: readonly CascaderOption[];
  /** 当前选中项的 value（原型 .opt.sel）。 */
  selected?: string;
  /** 按下某个选项时以其 value 触发。 */
  onSelect: (value: string) => void;
  /**
   * 按下**已选级**面包屑时以其索引触发,用于逐级下钻的「回上一级」（当前级 `current` 面包屑不可点）。
   * 省略时面包屑为静态展示（原型的静态面包屑行为）。
   */
  onCrumbPress?: (index: number) => void;
}

/**
 * Cascader —— Tier-2 级联选择器（spec §Primitives，生辰引导页属主）。
 * 结构：ink-3 底 + line 描边容器；顶部面包屑（已选级 gold-2 加粗 · 当前级象牙+金下划线，级间「/」分隔），
 * 下方可滚动选项列表，选中项 = gold-2 文字 + 尾部金色 ✓（原型 .opt.sel::after）。按下选项以其 value 触发
 * onSelect，button 角色 + selected 状态供无障碍与测试断言——由 Cascader.test 覆盖（只断言行为与选中态，
 * 不断言 ✓ / 颜色样式，spec Testing Decisions）。
 * 逐级下钻场景可传 onCrumbPress:已选级面包屑变为可点,回退到该级重新选择（当前级 current 面包屑不可点）。
 */
export function Cascader({ crumbs, options, selected, onSelect, onCrumbPress }: CascaderProps) {
  return (
    <View style={styles.cascader}>
      <View style={styles.crumbs}>
        {crumbs.map((crumb, i) => {
          // 已选级(非 current)在提供 onCrumbPress 时可点,用于回上一级下钻。
          const pressable = onCrumbPress != null && !crumb.current;
          const text = (
            <Text style={crumb.current ? styles.crumbCurrent : styles.crumbChosen}>{crumb.label}</Text>
          );
          return (
            <Fragment key={`${crumb.label}-${i}`}>
              {i > 0 ? <Text style={styles.sep}>/</Text> : null}
              {pressable ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={crumb.label}
                  onPress={() => onCrumbPress(i)}
                  hitSlop={6}
                >
                  {text}
                </Pressable>
              ) : (
                text
              )}
            </Fragment>
          );
        })}
      </View>
      <ScrollView style={styles.opts} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        {options.map((opt, i) => {
          const isSelected = opt.value === selected;
          const isLast = i === options.length - 1;
          return (
            <Pressable
              key={opt.value}
              accessibilityRole="button"
              // 显式标签：让无障碍名保持为选项文字，不被选中态尾部的 ✓ 污染。
              accessibilityLabel={opt.label}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(opt.value)}
              style={[styles.opt, isLast && styles.optLast]}
            >
              <Text style={[styles.optLabel, isSelected && styles.optLabelSelected]}>{opt.label}</Text>
              {isSelected ? <Text style={styles.check}>✓</Text> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // 原型 .cascader：ink-3 底 + line 描边 + r13 + 裁剪内容到圆角。
  cascader: {
    backgroundColor: semantic.surfaceInput,
    borderWidth: 1,
    borderColor: semantic.border,
    borderRadius: radii.input, // 13
    overflow: 'hidden',
  },
  // 原型 .opts：max-height:184,超出滚动。
  opts: { maxHeight: OPTS_MAX_HEIGHT },
  // 原型 .crumbs：横排 gap6 / padding 13-15 / 底部 line-2 分隔 / 可换行。
  crumbs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: semantic.borderFaint,
  },
  // 分隔「/」与说明：muted（原型 .crumbs span）。
  sep: { fontFamily: fonts.sans, fontSize: 13, color: semantic.textSecondary },
  // 已选级：gold-2 / Medium（原型 .crumbs b，font-weight:500）。
  crumbChosen: { fontFamily: fonts.sansMedium, fontSize: 13, color: semantic.accentBright },
  // 当前级：象牙 + 金色下划线（原型 .crumbs .cur）。
  crumbCurrent: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: semantic.textPrimary,
    borderBottomWidth: 1.5,
    borderBottomColor: semantic.accent,
  },
  // 原型 .opt：padding 12-15 / 底部 line-2 分隔 / 两端对齐。
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: semantic.borderFaint,
  },
  // 最后一项无下分隔线（原型末项 border-bottom 被容器裁剪，观感等价）。
  optLast: { borderBottomWidth: 0 },
  // 原型 .opt：14 / 象牙。
  optLabel: { fontFamily: fonts.sans, fontSize: 14, color: semantic.textPrimary },
  // 选中文字：gold-2（原型 .opt.sel）。
  optLabelSelected: { color: semantic.accentBright },
  // 选中标记 ✓：金色（原型 .opt.sel::after content:"✓" color:gold）。
  check: { fontFamily: fonts.sans, fontSize: 14, color: semantic.accent },
});
