import { Circle, G, Path, Svg } from 'react-native-svg';
import { palette } from '../palette';

export interface LoginMarkProps {
  /** 方形边长 px。默认 96(原型 .mark 为 96×96)。 */
  size?: number;
}

/**
 * 登录页品牌标记(原型 .mark)—— 1:1 移植自原型两枚 100×100 SVG:外圈 ring-spin + 中心太极。
 * 从原型 SVG 路径移植而来,兑现 issue 02「Icon 渲染 ~22 图标 + 登录标记」中的登录标记部分。
 *
 * 与线性 Icon 不同:此标记是**多色固定**复合体(金 / 金亮 / 墨,含各自透明度),不受 color prop 驱动。
 * 静态呈现——旋转(spin 60s)、glow 光晕、breathe 呼吸皆属登录页改造(issue 03,见 spec §Effects),此处不含。
 */
export function LoginMark({ size = 96 }: LoginMarkProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      accessible
      accessibilityRole="image"
      accessibilityLabel="天机"
    >
      {/* 外圈(原型 .ring-spin):两道同心圆 + 八向放射刻度 */}
      <Circle cx={50} cy={50} r={47} stroke={palette.gold} strokeWidth={1} opacity={0.55} />
      <Circle cx={50} cy={50} r={38} stroke={palette.gold2} strokeWidth={1} opacity={0.7} />
      <G stroke={palette.gold} strokeWidth={0.7} opacity={0.5}>
        <Path d="M50 3v10M50 87v10M3 50h10M87 50h10M15 15l7 7M78 78l7 7M85 15l-7 7M22 78l-7 7" />
      </G>
      {/* 中心太极 */}
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
