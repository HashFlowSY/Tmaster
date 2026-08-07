import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Screen, TitleBar } from '../../src/design/primitives';
import { FontLicenseText } from '../../src/legal/FontLicenseText';

/**
 * 开源许可 / 致谢页 —— 展示打包字体（Noto Serif SC / Noto Sans SC）的 SIL OFL 1.1 原文
 * （issue 12 contract / ADR-0006 / spec User Story 33：重分发内嵌字体需随 App 附上 OFL 以合规）。
 * 从「我的」推入的二级页：自绘衬线标题栏 + 返回键（(app) 布局对本页 headerShown:false），
 * 可滚动正文由 FontLicenseText 承载。纯展示、无取数；色/字全走设计系统 token。
 */
export default function LicensesScreen() {
  const router = useRouter();
  const header = <TitleBar title="开源许可" onBack={() => router.back()} />;

  return (
    <Screen scroll header={header} contentStyle={styles.pad}>
      <FontLicenseText />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // 与历史/收藏二级页一致的内容留白：顶 2、底 30（横向 26 由 Screen 承载）。
  pad: { paddingTop: 2, paddingBottom: 30 },
});
