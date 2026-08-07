import { StyleSheet, Text, View } from 'react-native';
import { semantic } from '../design/semantic';
import { fonts, lineHeightFor } from '../design/typography';
import { FONT_LICENSE } from './fontLicense';

/**
 * FontLicenseText —— 「开源许可 / 致谢」页正文（issue 12 / ADR-0006 / spec User Story 33）。
 * 顶部一段字体归属（打包了哪两款字体、依哪份许可），下接 OFL 1.1 原文（FONT_LICENSE，与随字体
 * 分发的 assets/fonts/OFL.txt 逐字一致，见 fontLicense.ts）。纯展示：色/字全走 token，无硬编码色。
 * 供 app/(app)/licenses.tsx 放进可滚动 Screen；正文渲染逻辑抽出以便像 primitive 一样单测。
 */
export function FontLicenseText() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.attribution}>
        本 App 在 iOS 与 Android 双端内嵌 Noto Serif SC（标题）与 Noto Sans SC（正文），
        依 SIL Open Font License 1.1 授权使用与重分发。以下为许可原文。
      </Text>
      {/* OFL 原文：英文 ASCII，等宽数字对齐、舒适行高；可长按选择复制。 */}
      <Text style={styles.body} selectable>
        {FONT_LICENSE}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  // 归属段：次要色、舒适行高的正文。
  attribution: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: lineHeightFor(1.6, 14),
    color: semantic.textSecondary,
  },
  // 许可正文：更小字号 + 最弱色，保留原文换行。
  body: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: lineHeightFor(1.55, 12),
    color: semantic.textFaint,
  },
});
