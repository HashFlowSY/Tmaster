import { StyleSheet, Text, View } from 'react-native';
import { semantic } from '../design/semantic';
import { fonts, lineHeightFor, tracking } from '../design/typography';
import { LEGAL_DISCLAIMER, type LegalDoc } from './legalContent';

/**
 * LegalDocText —— 法务静态页正文（auth 内 (auth)/legal，spec §F / issue 03）。
 * 顶部一条「非律师审阅 · v1 占位」标注（LEGAL_DISCLAIMER），其下为该文档的引言与分节正文
 * （LegalDoc.sections）。纯展示：色/字全走设计系统 token，无硬编码色；正文渲染逻辑抽出以便像
 * FontLicenseText 一样单测（spec Testing Decisions）。供路由页放进可滚动 Screen。
 */
export function LegalDocText({ doc }: { doc: LegalDoc }) {
  return (
    <View style={styles.wrap}>
      {/* 占位标注：危险色描边的柔和卡片，明确本文非正式法律文本。 */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>{LEGAL_DISCLAIMER}</Text>
      </View>

      <Text style={styles.intro}>{doc.intro}</Text>

      {doc.sections.map((section) => (
        <View key={section.heading} style={styles.section}>
          <Text accessibilityRole="header" style={styles.heading}>
            {section.heading}
          </Text>
          {section.paragraphs.map((p, i) => (
            <Text key={i} style={styles.body} selectable>
              {p}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 20 },
  // 占位标注卡：ink-2 底 + 金色描边（注意提示，非报错——故用 accent 而非 danger），与正文明显区隔。
  disclaimer: {
    backgroundColor: semantic.surface,
    borderWidth: 1,
    borderColor: semantic.accent,
    borderRadius: 12,
    padding: 14,
  },
  disclaimerText: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: lineHeightFor(1.6, 12.5),
    color: semantic.textSecondary,
  },
  // 引言：次要色、稍大、舒适行高。
  intro: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: lineHeightFor(1.7, 14),
    color: semantic.textSecondary,
  },
  section: { gap: 8 },
  // 小节标题：象牙、无衬线、字距，语义为 heading。
  heading: {
    fontFamily: fonts.sans,
    fontSize: 15,
    letterSpacing: tracking(0.02, 15),
    color: semantic.textPrimary,
  },
  // 正文段落：最弱色、舒适行高，可长按选择复制。
  body: {
    fontFamily: fonts.sans,
    fontSize: 13.5,
    lineHeight: lineHeightFor(1.75, 13.5),
    color: semantic.textFaint,
  },
});
