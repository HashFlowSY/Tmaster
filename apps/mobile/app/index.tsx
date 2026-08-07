import { StyleSheet, View } from 'react-native';
import { HSerif } from '../src/design/primitives';
import { semantic } from '../src/design/semantic';

// 根路由：实际跳转由 app/_layout 的 RootNav 依据登录态处理，这里只显示启动占位。
// 收敛到设计系统（issue 12 contract）：暖墨底 semantic.bg + 衬线品牌名，不再引旧 theme/ui。
export default function Index() {
  return (
    <View style={styles.splash}>
      <HSerif variant="brand">天机</HSerif>
    </View>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: semantic.bg, alignItems: 'center', justifyContent: 'center' },
});
