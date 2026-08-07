# 移动端设计系统:原生 StyleSheet + 类型化 token,不引入样式库

以 React Native 原生 `StyleSheet` 加一个类型化的 token 模块(`apps/mobile/src/theme/`)承载设计系统,**不引入** NativeWind / Tamagui / Unistyles 等样式库。原型 `docs/ui/tianji-app-design.html` 的写法能 1:1 映射到 `StyleSheet`,现有代码已是这一形态,token 以纯 TS 对象表达,保留日后迁移空间。

## Considered Options

- **NativeWind(Tailwind)/ Tamagui / Unistyles**:被否。都带来构建配置、运行时或编译期依赖与真实锁定成本;对单人、pre-launch、仅需忠实还原一张既定原型的项目属过度工程。样式库的 variant/主题能力我们用不上——只有一个锁定的深色主题,不反色。

## Consequences

- token 是可被 `tsc` 检查的普通对象,零运行时开销;组件用 `StyleSheet.create` + token 语义别名。
- 没有工具类/variant 语法糖,重复样式靠抽取 primitive 组件消解(见 spec 的 primitive 清单)。
- 若日后出现 Web 端复用需求,token 模块可平移;届时再评估是否引入样式方案,不被现有选择绑死。
