# 设计系统自持字体:双端打包 Noto Serif SC / Noto Sans SC,放弃 Apple 系统字体

设计系统自带并在 **iOS 与 Android 双端**都内嵌 **Noto Serif SC**(标题,替代 Songti SC)与 **Noto Sans SC**(正文,替代 PingFang SC),经 `expo-font` 构建期插件在打包时嵌入。RN 层的 `fontFamily` 显式指向这两个族,原型字体栈里的 `"Songti SC"` / `"PingFang SC"` 名称从代码中移除。两端因此渲染同一套字形。

Songti SC / PingFang SC 是 Apple 私有系统字体,不可再分发——「与原型(在 Mac 浏览器里以 Apple 字体渲染)完全一致」与「iOS/Android 一致」无法同时成立。项目目标是**统一移动端风格**且 **Android 优先**,故把「双端一致」定义为 1:1 的判据。

## Considered Options

- **分端(iOS 用系统 Songti/PingFang,Android 打包 Noto)**:被否。iOS 零成本且字形最贴原型,但两端不一致,直接违背「统一风格」;且把更优字形留给非优先平台之外的 iOS。
- **仅 iOS(不打包)**:被否。Android 上未知字体名被静默忽略,汉字回退到 Noto Sans CJK(无衬线),标题的衬线气质尽失;且 MIUI/OPPO/Vivo/Samsung 等 ROM 常裁掉 CJK 衬线,连系统 `"serif"` 都不可靠。不满足「双端都要对」。

## Consequences

- 每个商店包体增加约 **6–10MB**:子集化(约 4000 常用汉字)后的单权重 TTF/OTF——衬线 Regular 一档 + 无衬线 Regular/Medium/SemiBold。**必须用 TTF/OTF**(Android 内嵌不吃 woff2)。
- 两端字形一致,且免疫 Android OEM 字体裁剪。
- Noto Sans 是 PingFang 的近似而非等同(略偏机械);Noto Serif ≠ Songti,可接受。
- Noto/Source Han 系 SIL OFL 1.1,可免费商用内嵌,但需在应用「开源许可/致谢」页附上 `OFL.txt`;不得单独售卖字体文件。
- `expo-font` 构建期插件需 dev build(非 Expo Go);项目 `expo run:ios/android` 脚本已是该流程。
- 已知风险:RN 新架构下 iOS Fabric 的 CJK 输入法合成有缺陷(#56463),影响**中文输入**(对话 composer、搜索),不影响静态 `Text` 显示——构建期单列跟踪。
