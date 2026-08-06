import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from './theme';

export function Screen({ children }: { children: ReactNode }) {
  return <SafeAreaView style={styles.screen}>{children}</SafeAreaView>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function Field(props: TextInputProps) {
  return <TextInput placeholderTextColor={theme.textDim} style={styles.field} {...props} />;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.buttonDisabled]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.ghost}>
      <Text style={styles.ghostText}>{label}</Text>
    </Pressable>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 20 },
  title: { color: theme.text, fontSize: 26, fontWeight: '600', marginVertical: 16 },
  muted: { color: theme.textDim, fontSize: 14 },
  field: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 10,
    color: theme.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginVertical: 6,
    fontSize: 16,
  },
  button: {
    backgroundColor: theme.gold,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#1a1400', fontSize: 16, fontWeight: '700' },
  ghost: { paddingVertical: 12, alignItems: 'center' },
  ghostText: { color: theme.gold, fontSize: 15 },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: 12 },
});
