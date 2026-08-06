import type { Gender } from '@tianji/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { ApiError } from '../src/api/client';
import { BirthApi } from '../src/api/endpoints';
import { theme } from '../src/theme';
import { Field, Muted, PrimaryButton, Screen, Title } from '../src/ui';

export default function Onboarding() {
  const router = useRouter();
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [birthplace, setBirthplace] = useState('');
  const [longitude, setLongitude] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    const lng = Number(longitude);
    if (Number.isNaN(lng)) {
      Alert.alert('经度需为数字');
      return;
    }
    setBusy(true);
    try {
      await BirthApi.save({
        birthDate,
        birthTime: timeUnknown ? null : birthTime,
        timeUnknown,
        birthplace,
        longitude: lng,
        gender,
      });
      router.replace('/chart');
    } catch (err) {
      Alert.alert('保存失败', err instanceof ApiError ? err.message : '请检查填写');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Title>完善生辰</Title>
        <Muted>用于四柱八字排盘（含真太阳时校正）</Muted>
        <Field placeholder="出生日期 YYYY-MM-DD" value={birthDate} onChangeText={setBirthDate} />
        {!timeUnknown && (
          <Field placeholder="出生时间 HH:mm" value={birthTime} onChangeText={setBirthTime} />
        )}
        <View style={styles.row}>
          <Text style={{ color: theme.text }}>时辰未知（降级为三柱）</Text>
          <Switch value={timeUnknown} onValueChange={setTimeUnknown} trackColor={{ true: theme.gold }} />
        </View>
        <Field placeholder="出生地（城市）" value={birthplace} onChangeText={setBirthplace} />
        <Field
          placeholder="出生地经度（东经为正，如 116.4）"
          keyboardType="numbers-and-punctuation"
          value={longitude}
          onChangeText={setLongitude}
        />
        <View style={{ flexDirection: 'row', gap: 12, marginVertical: 8 }}>
          <GenderPick label="男" active={gender === 'male'} onPress={() => setGender('male')} />
          <GenderPick label="女" active={gender === 'female'} onPress={() => setGender('female')} />
        </View>
        <PrimaryButton label={busy ? '保存中…' : '保存并排盘'} onPress={onSubmit} disabled={busy} />
      </ScrollView>
    </Screen>
  );
}

function GenderPick({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.gender, active && styles.genderActive]}>
      <Text style={{ color: active ? '#1a1400' : theme.text, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },
  gender: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  genderActive: { backgroundColor: theme.gold, borderColor: theme.gold },
});
