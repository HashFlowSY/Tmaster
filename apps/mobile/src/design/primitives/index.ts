// Tier-1 表现型 primitive 的入口(spec §Primitives)。组件从这里取 Screen / Icon / 字体原子。
//
// 与 token 分开两个 barrel:token 从 `../design` 取(纯 TS、零组件依赖),primitive 从这里取
// (引 react-native-svg / safe-area 等 RN 组件依赖)。这样纯逻辑代码引 token 时不会被动拖入原生组件依赖。
export { Screen } from './Screen';
export type { ScreenProps } from './Screen';

export { Icon, iconNames } from './Icon';
export type { IconProps } from './Icon';
export type { IconName, IconDef, IconElement } from './icons';

export { Eyebrow, HSerif, Sub, TextMute } from './Type';
export type { HSerifVariant } from './Type';

export { LoginMark, MarkRing, MarkTaiji } from './LoginMark';
export type { LoginMarkProps } from './LoginMark';

export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Field } from './Field';
export type { FieldProps } from './Field';

export { Toast } from './Toast';
export type { ToastProps } from './Toast';

export { Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';

export { SegmentedControl } from './SegmentedControl';
export type { SegmentedControlProps, SegmentedOption } from './SegmentedControl';

export { Cascader } from './Cascader';
export type { CascaderProps, CascaderCrumb, CascaderOption } from './Cascader';
