import type { BaziChart, Pillar } from '@tianji/shared';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../../src/api/client';
import { ChartApi } from '../../src/api/endpoints';
import { theme } from '../../src/theme';
import { Muted, PrimaryButton, Screen, Title } from '../../src/ui';

export default function ChartScreen() {
  const router = useRouter();
  const [chart, setChart] = useState<BaziChart | null>(null);
  const [missing, setMissing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      ChartApi.get()
        .then((c) => {
          setChart(c);
          setMissing(false);
        })
        .catch((err) => {
          if (err instanceof ApiError && err.status === 404) setMissing(true);
        });
    }, []),
  );

  if (missing) {
    return (
      <Screen>
        <Title>命盘</Title>
        <Muted>尚未完善生辰</Muted>
        <PrimaryButton label="去完善生辰" onPress={() => router.push('/onboarding')} />
      </Screen>
    );
  }
  if (!chart) {
    return (
      <Screen>
        <Title>命盘</Title>
        <Muted>加载中…</Muted>
      </Screen>
    );
  }

  const cols: { key: string; pillar: Pillar | null }[] = [
    { key: '年', pillar: chart.pillars.year },
    { key: '月', pillar: chart.pillars.month },
    { key: '日', pillar: chart.pillars.day },
    { key: '时', pillar: chart.pillars.hour },
  ];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Muted>
          {chart.solarDate} · {chart.lunarDate} · 生肖{chart.zodiac} · 日主 {chart.dayMaster}
        </Muted>
        <View style={styles.grid}>
          {cols.map(({ key, pillar }) => (
            <View key={key} style={styles.col}>
              <Text style={styles.colHead}>{key}柱</Text>
              <Text style={styles.gz}>{pillar ? pillar.ganZhi : '—'}</Text>
              <Text style={styles.small}>{pillar?.tenGod ?? (key === '日' ? '日主' : '')}</Text>
              <Text style={styles.small}>{pillar ? pillar.hiddenStems.join(' ') : ''}</Text>
            </View>
          ))}
        </View>

        <Title>大运</Title>
        {chart.decadeFortunes.length === 0 ? (
          <Muted>时辰未知，暂无大运</Muted>
        ) : (
          chart.decadeFortunes.map((d) => (
            <Text key={d.startAge} style={styles.fortune}>
              {d.startAge} 岁起 · {d.ganZhi}
            </Text>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  col: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 10,
    paddingVertical: 14,
    gap: 6,
  },
  colHead: { color: theme.textDim, fontSize: 13 },
  gz: { color: theme.gold, fontSize: 22, fontWeight: '700' },
  small: { color: theme.text, fontSize: 12 },
  fortune: { color: theme.text, paddingVertical: 4 },
});
