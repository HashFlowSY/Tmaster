import { View } from 'react-native';
import { Title } from '../src/ui';
import { theme } from '../src/theme';

// 根路由：实际跳转由 app/_layout 的 RootNav 依据登录态处理，这里只显示启动占位。
export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Title>天机</Title>
    </View>
  );
}
