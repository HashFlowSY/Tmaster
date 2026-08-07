// Metro 配置：pnpm monorepo 需要监听 workspace 根并解析根 node_modules。
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// 保留分层查找：pnpm 的传递依赖位于虚拟 store 的包级 node_modules 中。
// 若关闭，Metro 只能看到上面的两个顶层目录，会把已安装的 Expo 运行时依赖误报为缺失。
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
