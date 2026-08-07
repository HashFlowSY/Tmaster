// Flat ESLint 配置 —— Expo SDK 57（eslint-config-expo/flat）+ 项目 lint 限制。
//
// 关键:eslint 与 eslint-config-expo 已作为显式 devDependencies 安装,
// 不依赖 `expo lint` 的运行时自安装（本仓 pnpm 供应链/构建脚本守卫会挡住那条路，
// 这正是 issue 10/11 里 "expo lint 无法 bootstrap" 的根因）。
const expo = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = [
  ...expo,

  // 全局忽略（构建产物 / 原生工程 / 资产 / 生成文件）
  {
    ignores: [
      '.expo/**',
      'dist/**',
      'android/**',
      'ios/**',
      'assets/**',
      'expo-env.d.ts',
    ],
  },

  // 测试与手写 mock：提供 jest / node 全局，避免 describe/it/expect/module 报未定义
  {
    files: ['**/*.test.{ts,tsx}', '__mocks__/**', 'jest.setup.*'],
    languageOptions: { globals: { ...globals.jest, ...globals.node } },
  },

  // 项目 lint 限制（在 expo 基线之上收紧）
  {
    rules: {
      // 生产代码禁止裸 console.log；warn/error 允许（诊断用）
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // 未用变量报错；下划线前缀显式忽略
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      // react-hooks@7 的 React-Compiler 实验规则与本仓 RN/Reanimated 模式不兼容，关闭：
      // - immutability：Reanimated 的 `sharedValue.value = ...` 是官方写法，被误判为「修改不可变值」；
      // - set-state-in-effect：依赖变化时「同步外部状态到本地」的合法 effect（如清空消息）被误报级联渲染。
      // 保留经典且有价值的 rules-of-hooks / exhaustive-deps。
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },

  // 设计系统纪律：组件/屏禁止硬编码颜色，必须走 src/design 的 token。
  // token 模块自身（定义色值处）豁免。呼应 spec「no hardcoded colors」与 ADR-0005。
  {
    files: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
    ignores: ['src/design/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/#(?:[0-9a-fA-F]{3,4}){1,2}\\b/]",
          message:
            '禁止硬编码颜色值,请使用 src/design 的 palette/semantic token（设计系统统一,见 ADR-0005 / spec）。',
        },
      ],
    },
  },
];
