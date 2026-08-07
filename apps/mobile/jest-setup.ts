// 组件行为测试台的共享 setup（spec Testing Decisions：唯一新增的测试 seam）。
//
// 用 __mocks__/react-native-reanimated.js（手写手动 mock）顶掉 reanimated 的原生驱动，
// 让动画型 primitive（Button 的 breathe/press、Field 焦点环、Toast 等）能在 jest 渲染而不触碰
// 原生层。不用官方 `react-native-reanimated/mock`——它在 reanimated 4 下仍会加载 worklets 原生
// 模块而在 jest 抛错，详见该 mock 文件顶部注释。无参 jest.mock 即启用 __mocks__ 里的手动 mock。
jest.mock('react-native-reanimated');
