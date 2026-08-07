import { StyleSheet, View } from 'react-native';
import { Circle, G, Path, Svg } from 'react-native-svg';
import { palette } from '../palette';

export interface LoginMarkProps {
  /** 方形边长 px。默认 96(原型 .mark 为 96×96)。 */
  size?: number;
}

/**
 * 登录页品牌标记(原型 .mark)—— 1:1 移植自原型两枚 100×100 SVG。拆成两层导出:
 *  - `MarkRing`  外圈(原型 .ring-spin)：登录页自转的那一层。
 *  - `MarkTaiji` 中心太极：静止层。
 * 由 `LoginMark` 静态叠合两层(供非动画场景);登录页改造(issue 03)则分别对 MarkRing 施加
 * 旋转、在其后叠 breathe 辉光——见登录路由。几何单一真源在此,避免动画版重复描点。
 *
 * 多色固定复合体(金 / 金亮 / 墨,含各自透明度),**不**受 color prop 驱动——与线性 <Icon> 不同。
 */
export function MarkRing({ size = 96 }: LoginMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Circle cx={50} cy={50} r={47} stroke={palette.gold} strokeWidth={1} opacity={0.55} />
      <Circle cx={50} cy={50} r={38} stroke={palette.gold2} strokeWidth={1} opacity={0.7} />
      <G stroke={palette.gold} strokeWidth={0.7} opacity={0.5}>
        <Path d="M50 3v10M50 87v10M3 50h10M87 50h10M15 15l7 7M78 78l7 7M85 15l-7 7M22 78l-7 7" />
      </G>
    </Svg>
  );
}

export function MarkTaiji({ size = 96 }: LoginMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Circle cx={50} cy={50} r={26} stroke={palette.gold2} strokeWidth={1.2} opacity={0.85} />
      <Path
        d="M50 24a13 13 0 000 26 13 13 0 010 26 26 26 0 000-52z"
        fill={palette.gold2}
        opacity={0.85}
      />
      <Circle cx={50} cy={37} r={3.4} fill={palette.ink} />
      <Circle cx={50} cy={63} r={3.4} fill={palette.gold2} />
    </Svg>
  );
}

/** 静态叠合版:外圈 + 中心太极,整体作为一个带标签的图像。 */
export function LoginMark({ size = 96 }: LoginMarkProps) {
  return (
    <View
      style={[styles.root, { width: size, height: size }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="天机"
    >
      <MarkRing size={size} />
      <View style={StyleSheet.absoluteFill}>
        <MarkTaiji size={size} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'relative' },
});
