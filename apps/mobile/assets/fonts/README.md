# 打包字体（Noto Serif SC / Noto Sans SC）

设计系统在 **iOS 与 Android 双端**内嵌以下字体（ADR-0006、spec §Fonts）。这些是**构建输入**,
必须存在于仓库里才能出 dev build——`app.json` 的 `expo-font` 插件在打包时读取它们。

## 需要的四个文件（文件名必须与 `src/design/typography.ts` 的 `fonts` 完全一致）

| 文件名 | 字族 | 字重 | 代码里的 fontFamily |
|---|---|---|---|
| `NotoSerifSC-Regular.otf` | Noto Serif SC | Regular (400) | `NotoSerifSC-Regular` |
| `NotoSansSC-Regular.otf` | Noto Sans SC | Regular (400) | `NotoSansSC-Regular` |
| `NotoSansSC-Medium.otf` | Noto Sans SC | Medium (500) | `NotoSansSC-Medium` |
| `NotoSansSC-SemiBold.otf` | Noto Sans SC | SemiBold (600) | `NotoSansSC-SemiBold` |

- 格式 **必须是 TTF/OTF**（Android 内嵌不吃 woff2）。
- 每个文件需**子集化**到 ~4,000 常用汉字 + ASCII + CJK 标点,单权重约 1.5–3 MB,四个合计约 6–10 MB。
- 未放入这四个文件前,`expo prebuild` / dev build 会因找不到字体而报错——这是预期的,补齐即可。

## 生成步骤（需联网 + Python,一次性)

1. 取源字体(全量 OTF/TTF静态字重):
   - Noto Serif SC / Noto Sans SC 的官方分发在 `notofonts/noto-cjk`(GitHub)与 Google Fonts。
   - 需要 Serif 的 Regular,Sans 的 Regular / Medium / SemiBold 四个静态权重。
   - 放到 `assets/fonts/_src/`(此目录被 git 忽略,见下)。
2. 准备常用汉字表 `assets/fonts/_src/hanzi.txt`(如《通用规范汉字表》一级字表 ~3500 字,纯文本、无分隔)。
3. 安装子集化工具:`pip install fonttools brotli`。
4. 运行:`pnpm --filter @tianji/mobile fonts:subset`(即 `scripts/build-fonts.sh`)。
   脚本把 `_src/` 里的四个源文件子集化并输出到本目录的四个目标文件名。
5. 出 dev build:`pnpm --filter @tianji/mobile ios`(或 `android`)。**Expo Go 不支持内嵌字体,必须 dev build。**

> 为什么不自动下载:取字体与子集化需要联网与本地 Python 工具链,属维护者的一次性人工步骤;
> `build-fonts.sh` 负责其中可自动化的子集化环节。

## 许可(OFL)

Noto 系列为 SIL OFL 1.1,可免费商用内嵌。[`OFL.txt`](./OFL.txt) 已填入 **OFL 1.1 官方原文 +
Noto CJK 上游(Adobe Source Han)版权与保留字体名声明**(issue 12)。该文件随字体二进制一起重分发
(OFL 条款 2:许可须随 Font Software 分发)。

App「开源许可 / 致谢」页(`app/(app)/licenses.tsx`,从「我的」进入)就地展示同一份原文——其真源是
`src/legal/fontLicense.ts` 的 `FONT_LICENSE` 常量(RN/Metro 不能 import `.txt`,故另存一份)。两份由
`src/legal/fontLicense.test.ts` 断言**逐字一致**;改其一必须同步改另一。

> 若从**其他分发源**(如 Google Fonts)取字体,请以该源附带的 OFL 原文覆盖 `OFL.txt` 与
> `FONT_LICENSE` 两处(版权行/保留字体名可能不同),测试会守住二者同步。
