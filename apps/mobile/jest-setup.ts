// 组件行为测试台的共享 setup（spec Testing Decisions：唯一新增的测试 seam）。
//
// 用官方 mock 顶掉 reanimated 的原生驱动，让后续动画型 primitive（Button 的
// breathe/press、Field 焦点环等，issue 02+）能在 jest 里渲染而不触碰原生层。
// 工厂仅在某个测试真正 import reanimated 时才执行，对不用动画的测试零影响。
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
