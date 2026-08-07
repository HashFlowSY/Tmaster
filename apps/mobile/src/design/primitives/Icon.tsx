import { Circle, Path, Rect, Svg } from 'react-native-svg';
import { semantic } from '../semantic';
import { icons, iconNames, type IconDef, type IconElement, type IconName } from './icons';

export { iconNames };
export type { IconName };

export interface IconProps {
  /** 图标名,见 ./icons 注册表。 */
  name: IconName;
  /** 描边/填充色(原型的 stroke=currentColor → 此 color)。默认象牙 textPrimary。 */
  color?: string;
  /** 方形边长 px。默认 18(原型图标 12–21px 的中值)。 */
  size?: number;
  /** 覆盖注册表里的默认线宽。填充图标忽略此值。 */
  strokeWidth?: number;
  /** 传入即赋予无障碍标签并标记为 image;省略则为装饰性图标。 */
  accessibilityLabel?: string;
}

/**
 * Icon —— react-native-svg 封装,按名渲染原型移植的线性图标(+ 填充的 crown)。
 * 原型的 `stroke="currentColor"` 语义由 `color` prop 承载;`fill=none` 线性图标描边着色,
 * `filled` 图标(crown)改为填充着色、无描边。视觉忠实度由双端人工核对(spec §测试)。
 */
export function Icon({
  name,
  color = semantic.textPrimary,
  size = 18,
  strokeWidth,
  accessibilityLabel,
}: IconProps) {
  // 注:icons 用 `satisfies` 保留字面量键(得到 IconName 联合),但会把每项窄化成各自字面量类型,
  // 令可选的 `filled` 在联合上不可见——显式标注为 IconDef 把它还原(satisfies 已保证每项都是 IconDef)。
  // 注:icons 用 `satisfies` 保留字面量键(得到 IconName 联合),但会把每项窄化成各自字面量类型,
  // 令可选的 `filled` 在联合上不可见——显式标注为 IconDef 把它还原(satisfies 已保证每项都是 IconDef)。
  const def: IconDef = icons[name];
  // 解析后的着色三元组打包成一个 paint,统一喷到每个子元素上(线性 = 描边着色,filled = 填充着色)。
  const paint: Paint = def.filled
    ? { stroke: 'none', fill: color, strokeWidth: def.strokeWidth }
    : { stroke: color, fill: 'none', strokeWidth: strokeWidth ?? def.strokeWidth };

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${def.viewBox} ${def.viewBox}`}
      fill="none"
      accessible={accessibilityLabel != null}
      accessibilityRole={accessibilityLabel != null ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
    >
      {def.elements.map((element, i) => renderElement(element, i, paint))}
    </Svg>
  );
}

interface Paint {
  stroke: string;
  fill: string;
  strokeWidth: number;
}

function renderElement(element: IconElement, key: number, paint: Paint) {
  switch (element.kind) {
    case 'path':
      return <Path key={key} d={element.d} {...paint} strokeLinecap="round" strokeLinejoin="round" />;
    case 'circle':
      return <Circle key={key} cx={element.cx} cy={element.cy} r={element.r} {...paint} />;
    case 'rect':
      return (
        <Rect
          key={key}
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          rx={element.rx}
          {...paint}
          strokeLinejoin="round"
        />
      );
  }
}
