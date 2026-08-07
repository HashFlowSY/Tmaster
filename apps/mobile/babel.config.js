module.exports = (api) => {
  api.cache(true);
  return {
    // 不要手动加 react-native-worklets/reanimated 的 babel 插件：
    // babel-preset-expo 在检测到 react-native-worklets 时会自动注入
    // `react-native-worklets/plugin`（其 worklets 选项默认 true）。手动再加会重复变换。
    presets: ['babel-preset-expo'],
  };
};
