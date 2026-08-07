import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Screen, TitleBar } from '../../src/design/primitives';
import { LegalDocText } from '../../src/legal/LegalDocText';
import { resolveLegalDoc } from '../../src/legal/legalContent';

/**
 * 法务静态页 —— auth 流内可导航到达、承载《用户协议》与《隐私政策》正文（spec §F / issue 03）。
 * 由 `?doc=terms|privacy` 参数选择展示哪一份（resolveLegalDoc，缺省 / 非法值回退用户协议）；
 * 注册 / 登录处的法务链接以 `router.push('/legal?doc=…')` 接上（链接接线属注册/登录重做工单 05/06）。
 * 复用既有 `TitleBar` primitive 承载标题 + 返回键（(auth) 布局对本页 headerShown:false，返回回到
 * 来源页；不新造 modal），可滚动正文由 LegalDocText 承载。纯展示、无取数；色/字全走设计系统 token。
 * 正文为 v1 占位，见 legalContent.ts。
 */
export default function LegalScreen() {
  const router = useRouter();
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const document = resolveLegalDoc(doc);
  const header = <TitleBar title={document.title} onBack={() => router.back()} />;

  return (
    <Screen scroll header={header} contentStyle={styles.pad}>
      <LegalDocText doc={document} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // 与历史/收藏/许可二级页一致的内容留白：顶 2、底 30（横向 26 由 Screen 承载）。
  pad: { paddingTop: 2, paddingBottom: 30 },
});
