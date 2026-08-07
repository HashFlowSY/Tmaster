# 打包字体（Noto Serif SC / Noto Sans SC）

设计系统在 **iOS 与 Android 双端**内嵌以下字体（ADR-0006、spec §Fonts）。这些是**构建输入**,
必须存在于仓库里才能出 dev build——`app.json` 的 `expo-font` 插件在打包时读取它们。

## 需要的四个文件（文件名必须与 `src/design/typography.ts` 的 `fonts` 完全一致）

| 文件名 | 字族 | 字重 | 代码里的 fontFamily |
|---|---|---|---|
| `NotoSerifSC-Regular.ttf` | Noto Serif SC | Regular (400) | `NotoSerifSC-Regular` |
| `NotoSansSC-Regular.ttf` | Noto Sans SC | Regular (400) | `NotoSansSC-Regular` |
| `NotoSansSC-Medium.ttf` | Noto Sans SC | Medium (500) | `NotoSansSC-Medium` |
| `NotoSansSC-SemiBold.ttf` | Noto Sans SC | SemiBold (600) | `NotoSansSC-SemiBold` |

- 格式 **必须是 TTF/OTF**（Android 内嵌不吃 woff2）。本仓用 TTF。
- 每个文件的 **family / PostScript name 已改名为与文件名 stem 一致**（如 `NotoSansSC-SemiBold`），
  这样 `fontFamily: "NotoSansSC-SemiBold"` 在 iOS（按 PS/family 名解析）与 Android（按内嵌文件名解析）双端都能命中；
  否则三个 Sans 权重会共用同一 PS 名 `NotoSansSC-Regular` 而在 iOS 冲突。

## 现状与生成方法

**已放入四个全量静态权重（本仓已提交，约 44 MB：Serif 14 MB + Sans 3×10 MB）**，dev build 不再因缺字体报错。
它们由本目录 `_src/instance.py` 从 Google Fonts 的**可变字体**实例化而来（`google/fonts` 的
`NotoSansSC[wght].ttf` / `NotoSerifSC[wght].ttf` → `wght=400/500/600` 实例 + 改名 name 表）。
`_src/`（可变源 + 脚本）被 git 忽略。

复现（需联网 + `pip install fonttools`）:
```
cd assets/fonts/_src
curl -L -o NotoSansSC-VF.ttf  "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf"
curl -L -o NotoSerifSC-VF.ttf "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf"
python3 instance.py   # 输出四个 .ttf 到 assets/fonts/
```

出 dev build:`pnpm --filter @tianji/mobile ios`(或 `android`)。**Expo Go 不支持内嵌字体,必须 dev build。**

## 待办:子集化(体积优化,非阻塞)

当前是**全量**字体(~44 MB),尚未子集化——功能可用但包体偏大。目标是子集到 ~4,000 常用汉字 + ASCII + CJK 标点,
四个合计约 6–10 MB(spec §Fonts、ADR-0006)。做法:准备 `_src/hanzi.txt`(如《通用规范汉字表》一级字 ~3500),
把四个全量静态权重放到 `_src/`,`pip install fonttools brotli`,再 `pnpm --filter @tianji/mobile fonts:subset`
(即 `scripts/build-fonts.sh`,已指向 `.ttf` 目标名),子集产物覆盖本目录四个文件。

## 许可(OFL)

Noto 系列为 SIL OFL 1.1,可免费商用内嵌。[`OFL.txt`](./OFL.txt) 已填入 **OFL 1.1 官方原文 +
Noto CJK 上游(Adobe Source Han)版权与保留字体名声明**(issue 12)。该文件随字体二进制一起重分发
(OFL 条款 2:许可须随 Font Software 分发)。

App「开源许可 / 致谢」页(`app/(app)/licenses.tsx`,从「我的」进入)就地展示同一份原文——其真源是
`src/legal/fontLicense.ts` 的 `FONT_LICENSE` 常量(RN/Metro 不能 import `.txt`,故另存一份)。两份由
`src/legal/fontLicense.test.ts` 断言**逐字一致**;改其一必须同步改另一。

> 若从**其他分发源**(如 Google Fonts)取字体,请以该源附带的 OFL 原文覆盖 `OFL.txt` 与
> `FONT_LICENSE` 两处(版权行/保留字体名可能不同),测试会守住二者同步。
