import type { PublicUser } from '@tianji/shared';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Circle, Defs, RadialGradient, Stop, Svg } from 'react-native-svg';
import { AuthApi, ChartApi, ConversationApi } from '../../../src/api/endpoints';
import { useAuth } from '../../../src/auth/AuthContext';
import {
  HSerif,
  Icon,
  MenuList,
  type MenuRow,
  Screen,
  StatTile,
  Toast,
} from '../../../src/design/primitives';
import { radii } from '../../../src/design/radii';
import { semantic } from '../../../src/design/semantic';
import { fonts, tabularNums, tracking } from '../../../src/design/typography';

/**
 * 我的页 —— 与原型 docs/ui/tianji-app-design.html 的 profile 屏 1:1（spec §8、issue 09）。
 * 命主抬头（径向渐变头像 + 姓名/UID）、统计条（累计提问 / 收藏）、两组菜单（导航项 + 危险登出）。
 * 顶部标题区含「设置」占位键 → Toast「敬请期待」；登出经确认后走 useAuth().logout（RootNav 依登录态跳登录）。
 *
 * 数据边界裁定（spec Out of Scope：禁改 schema / 不加新功能）：
 * - 命主 = 当前登录 User（CONTEXT.md：v1 命主 ≡ User，以邮箱标识）。PublicUser 仅 { id, email, createdAt }。
 * - 头像字（.in）：邮箱首字母大写（原型示例是姓名首字「林」；schema 无姓名字段,故取邮箱首字母）。
 * - 姓名（.n）：邮箱（账号身份即命主身份）。UID（.uid）：真实账号 id（cuid2）。二者皆真实,不编造。
 * - VIP 徽标（原型 .vip）：验收点写「if present」。PublicUser 无会员字段 → 恒不渲染,不造假会员态。
 * - 累计提问 / 历史对话段数：命主的对话总数（ConversationApi.list().length，与原型 128 = 128 段一致）。
 * - 收藏 / 我的收藏条数：其中 favorited 的条数（同一次 list 客户端清点,避免二次请求）。
 * - 「我的命盘」尾注（日柱 · 命造）：best-effort 取 ChartApi;未完善生辰(404)或失败则省略,只留 ›。
 */
export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [convCount, setConvCount] = useState<number | null>(null);
  const [favCount, setFavCount] = useState<number | null>(null);
  const [chartMeta, setChartMeta] = useState<string | undefined>(undefined);
  const [toast, setToast] = useState<string | null>(null);

  // 聚焦即刷新：从 收藏/历史 返回时统计与尾注保持最新（同命盘页的 useFocusEffect 取数模式）。
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      AuthApi.me()
        .then((u) => {
          if (!cancelled) setUser(u);
        })
        .catch(() => {});
      ConversationApi.list()
        .then((list) => {
          if (cancelled) return;
          setConvCount(list.length);
          setFavCount(list.filter((c) => c.favorited).length);
        })
        .catch(() => {});
      // 「我的命盘」尾注（原型「己巳日 · 乾造」）——日柱干支 + 命造。缺生辰/失败则清空,行只剩 ›。
      ChartApi.get()
        .then((c) => {
          if (cancelled) return;
          const zao = c.gender === 'male' ? '乾造' : '坤造';
          setChartMeta(`${c.pillars.day.stem}${c.pillars.day.branch}日 · ${zao}`);
        })
        .catch(() => {
          if (!cancelled) setChartMeta(undefined);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const email = user?.email ?? '';
  const initial = email.length > 0 ? email[0].toUpperCase() : '·';
  const displayName = user != null ? email : '加载中…';
  const uidLine = user != null ? `UID ${user.id}` : '';

  const confirmLogout = () => {
    Alert.alert('退出登录', '确定要退出当前账号吗？', [
      { text: '取消', style: 'cancel' },
      { text: '退出', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  // 原型两组 .menu：导航项（命盘/历史/收藏,带尾注 + ›）与危险登出（danger,无尾注）。
  const navRows: MenuRow[] = [
    { key: 'chart', icon: 'chart', label: '我的命盘', meta: chartMeta, onPress: () => router.push('/chart') },
    {
      key: 'history',
      icon: 'clock',
      label: '历史对话',
      meta: convCount != null ? `${convCount} 段` : undefined,
      onPress: () => router.push('/history'),
    },
    {
      key: 'favorites',
      icon: 'bookmark',
      label: '我的收藏',
      meta: favCount != null ? `${favCount} 条` : undefined,
      onPress: () => router.push('/favorites'),
    },
  ];
  const logoutRow: MenuRow = {
    key: 'logout',
    icon: 'logout',
    label: '退出登录',
    danger: true,
    onPress: confirmLogout,
  };

  const header = (
    <View style={styles.titleRow}>
      <HSerif variant="head">我的</HSerif>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="设置"
        onPress={() => setToast('敬请期待')}
        style={styles.iconBtn}
        hitSlop={6}
      >
        <Icon name="settings" color={semantic.textPrimary} size={18} strokeWidth={1.5} />
      </Pressable>
    </View>
  );

  return (
    <Screen scroll header={header} contentStyle={styles.pad}>
      {/* 命主抬头：径向渐变头像 + 姓名/UID（VIP 恒不渲染,见文首裁定）。 */}
      <View style={styles.profhead}>
        <ProfAvatar initial={initial} />
        <View style={styles.profName}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.uid} numberOfLines={1}>
            {uidLine}
          </Text>
        </View>
      </View>

      {/* 统计条：累计提问 / 收藏（真实对话数,等宽数字）。 */}
      <View style={styles.statsWrap}>
        <StatTile
          items={[
            { value: convCount ?? '—', label: '累计提问' },
            { value: favCount ?? '—', label: '收藏' },
          ]}
        />
      </View>

      {/* 导航菜单 + 危险登出（两组 .menu，间距 16）。 */}
      <View style={styles.navWrap}>
        <MenuList rows={navRows} />
      </View>
      <MenuList rows={[logoutRow]} />

      <Toast message={toast} onHide={() => setToast(null)} />
    </Screen>
  );
}

// 头像离心径向渐变（原型 .prof-avatar radial circle at 38% 32% #2c3242→#12151e）——头像专用一次性色
// （#12151e 恰为 ink-2,但此处按原型渐变字面量就地成常量,不经语义层）。金环 = gold-soft 4px 描边环。
const AVATAR_SIZE = 66;
const AVATAR_INNER = '#2c3242';
const AVATAR_OUTER = '#12151e';
const AVATAR_RING = `0px 0px 0px 4px ${semantic.accentSoft}`; // 原型 box-shadow:0 0 0 4px var(--gold-soft)

/** 命主头像：离心径向渐变圆 + 金描边 + 金软外环 + 中心衬线首字（原型 .prof-avatar，radial→svg RadialGradient）。 */
function ProfAvatar({ initial }: { initial: string }) {
  return (
    <View style={styles.avatar} accessible accessibilityRole="image" accessibilityLabel="头像">
      <Svg width={AVATAR_SIZE} height={AVATAR_SIZE} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* 原型 circle at 38% 32%：离心高光。 */}
          <RadialGradient id="profAvatarBg" cx="38%" cy="32%" r="75%">
            <Stop offset="0" stopColor={AVATAR_INNER} />
            <Stop offset="1" stopColor={AVATAR_OUTER} />
          </RadialGradient>
        </Defs>
        <Circle cx={AVATAR_SIZE / 2} cy={AVATAR_SIZE / 2} r={AVATAR_SIZE / 2} fill="url(#profAvatarBg)" />
      </Svg>
      <Text style={styles.avatarInitial}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // 原型 .apphead .title-row：横排两端对齐、padding 6/14。
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 14,
  },
  // 原型 .icon-btn：38×38 / ink-2 底 / line 描边 / r11。
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: semantic.surface,
    borderWidth: 1,
    borderColor: semantic.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 内容区：原型 .pad 顶 8、底 30（横向 26 由 Screen 承载）。
  pad: { paddingTop: 8, paddingBottom: 30 },

  // 原型 .profhead：横排、居中、gap16、padding 8/4。
  profhead: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 8, paddingBottom: 4 },
  // 原型 .prof-avatar：66×66 圆、金描边、金软外环、居中放首字。
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radii.round,
    borderWidth: 2,
    borderColor: semantic.accent,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: AVATAR_RING,
  },
  // 原型 .prof-avatar .in：衬线 26、gold-2。
  avatarInitial: { fontFamily: fonts.serif, fontSize: 26, color: semantic.accentBright },
  // 原型 .prof-name：纵列、gap6,可收缩以让长邮箱在行内截断。
  profName: { flexShrink: 1, gap: 6 },
  // 原型 .prof-name .n：衬线 21、.1em、象牙。
  name: {
    fontFamily: fonts.serif,
    fontSize: 21,
    letterSpacing: tracking(0.1, 21),
    color: semantic.textPrimary,
  },
  // 原型 .prof-name .uid：12、muted-2、等宽数字、.04em。
  uid: {
    fontFamily: fonts.sans,
    fontSize: 12,
    letterSpacing: tracking(0.04, 12),
    color: semantic.textFaint,
    ...tabularNums,
  },

  // 原型 .stats margin:20 0（外边距不入 StatTile,由属主页控制）。
  statsWrap: { marginVertical: 20 },
  // 原型首个 .menu margin-bottom:16（与登出组的间距）。
  navWrap: { marginBottom: 16 },
});
