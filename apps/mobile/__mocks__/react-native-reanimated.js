// 手写的 reanimated 手动 mock（spec Testing Decisions：顶掉原生动画驱动）。
//
// 为什么不用官方 `react-native-reanimated/mock`：reanimated 4 的官方 mock 仍会 require 真包，
// 进而加载 `react-native-worklets` 的原生模块（NativeWorklets），在 jest 里抛
// `loadUnpackersWithCode of undefined`。这里提供一份零原生依赖的等价面，覆盖本 app 用到的 API，
// 让动画型 primitive（Button breathe/press、Field 焦点环、Toast）能在 jest 渲染并断言外部行为。
//
// 语义：动画函数在测试里「立即完成」——withTiming/withRepeat 直接返回目标值，
// useAnimatedStyle 同步求值一次。测试只断言可观察行为，不校验动画过程（spec）。
const React = require('react');
const { View, Text, Image, ScrollView } = require('react-native');

function createAnimatedComponent(Component) {
  return Component;
}

const Animated = {
  View,
  Text,
  Image,
  ScrollView,
  createAnimatedComponent,
};

function useSharedValue(initial) {
  return React.useRef({ value: initial }).current;
}

// useAnimatedStyle 同步调用一次 worklet，返回其样式对象。
function useAnimatedStyle(factory) {
  return factory();
}

function useDerivedValue(factory) {
  return { value: factory() };
}

// 动画构造子在 mock 里「瞬时完成」：返回目标值本身。
function withTiming(toValue) {
  return toValue;
}
function withSpring(toValue) {
  return toValue;
}
function withRepeat(animation) {
  return animation;
}
function withDelay(_delay, animation) {
  return animation;
}
function withSequence(...animations) {
  return animations[animations.length - 1];
}
function cancelAnimation() {}
function runOnJS(fn) {
  return fn;
}
function runOnUI(fn) {
  return fn;
}

function interpolate(value, inputRange, outputRange) {
  const [inMin, inMax] = [inputRange[0], inputRange[inputRange.length - 1]];
  const [outMin, outMax] = [outputRange[0], outputRange[outputRange.length - 1]];
  if (inMax === inMin) return outMin;
  const clamped = Math.max(inMin, Math.min(inMax, value));
  return outMin + ((clamped - inMin) / (inMax - inMin)) * (outMax - outMin);
}

// 颜色插值在 mock 里只需返回一个合法值——起点色即可（测试不校验色值）。
function interpolateColor(_value, _inputRange, outputRange) {
  return outputRange[0];
}

const identityEasing = (t) => t;
const Easing = {
  linear: identityEasing,
  ease: identityEasing,
  quad: identityEasing,
  cubic: identityEasing,
  bezier: () => identityEasing,
  bezierFn: () => identityEasing,
  in: (fn) => fn,
  out: (fn) => fn,
  inOut: (fn) => fn,
};

module.exports = {
  __esModule: true,
  default: Animated,
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  withSpring,
  withRepeat,
  withDelay,
  withSequence,
  cancelAnimation,
  runOnJS,
  runOnUI,
  interpolate,
  interpolateColor,
  Easing,
};
