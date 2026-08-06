import { type Conversation, type System, systemLabel } from '@tianji/shared';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ApiError } from '../../src/api/client';
import { sendMessageStream } from '../../src/api/chatStream';
import { ConversationApi } from '../../src/api/endpoints';
import { theme } from '../../src/theme';

interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);

  const loadConversations = useCallback(() => {
    ConversationApi.list()
      .then(setConversations)
      .catch(() => {});
  }, []);
  useFocusEffect(loadConversations);

  const openConversation = async (c: Conversation) => {
    setActive(c);
    try {
      const msgs = await ConversationApi.messages(c.id);
      setMessages(msgs.map((m) => ({ id: m.id, role: m.role, content: m.content })));
    } catch {
      setMessages([]);
    }
  };

  const newConversation = async (system: System) => {
    try {
      const c = await ConversationApi.create({ system });
      setConversations((prev) => [c, ...prev]);
      setActive(c);
      setMessages([]);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'birth_required') {
        Alert.alert('需要生辰', '八字对话需先完善生辰', [
          { text: '去完善', onPress: () => router.push('/onboarding') },
          { text: '取消', style: 'cancel' },
        ]);
      } else {
        Alert.alert('创建失败', err instanceof ApiError ? err.message : '网络错误');
      }
    }
  };

  const send = async () => {
    if (!active || !input.trim() || streaming) return;
    const content = input.trim();
    setInput('');
    const assistantId = `a-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content },
      { id: assistantId, role: 'assistant', content: '' },
    ]);
    setStreaming(true);
    try {
      await sendMessageStream(active.id, content, (ev) => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== assistantId) return m;
            if (ev.type === 'delta') return { ...m, content: m.content + ev.text };
            if (ev.type === 'done') return { id: ev.message.id, role: 'assistant', content: ev.message.content };
            return { ...m, content: `（出错：${ev.message}）` };
          }),
        );
      });
    } catch (err) {
      Alert.alert('发送失败', err instanceof Error ? err.message : '网络错误');
    } finally {
      setStreaming(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.toolbar}>
        <Pressable style={styles.newBtn} onPress={() => newConversation('bazi')}>
          <Text style={styles.newBtnText}>+ 八字</Text>
        </Pressable>
        <Pressable style={styles.newBtn} onPress={() => newConversation('qimen')}>
          <Text style={styles.newBtnText}>+ 奇门</Text>
        </Pressable>
        <Pressable style={styles.linkBtn} onPress={() => router.push('/profile')}>
          <Text style={styles.linkText}>我的</Text>
        </Pressable>
      </View>

      <FlatList
        horizontal
        data={conversations}
        keyExtractor={(c) => c.id}
        showsHorizontalScrollIndicator={false}
        style={styles.convStrip}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openConversation(item)}
            style={[styles.convChip, active?.id === item.id && styles.convChipActive]}
          >
            <Text style={styles.convChipText} numberOfLines={1}>
              {systemLabel(item.system)} · {item.title}
            </Text>
          </Pressable>
        )}
      />

      {active ? (
        <FlatList
          style={styles.messages}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              <Text style={styles.bubbleText}>{item.content || '…'}</Text>
            </View>
          )}
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>新建一个八字或奇门对话开始</Text>
        </View>
      )}

      {active && (
        <View style={styles.composer}>
          <TextInput
            style={styles.composerInput}
            placeholder="输入你的问题"
            placeholderTextColor={theme.textDim}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <Pressable
            style={[styles.sendBtn, (streaming || !input.trim()) && styles.sendBtnDisabled]}
            onPress={send}
            disabled={streaming || !input.trim()}
          >
            <Text style={styles.sendText}>{streaming ? '…' : '发送'}</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  newBtn: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  newBtnText: { color: theme.gold, fontWeight: '600' },
  linkBtn: { marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 8 },
  linkText: { color: theme.textDim },
  convStrip: { maxHeight: 44, paddingHorizontal: 8 },
  convChip: { backgroundColor: theme.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, maxWidth: 180 },
  convChipActive: { borderColor: theme.gold, borderWidth: 1 },
  convChipText: { color: theme.text, fontSize: 13 },
  messages: { flex: 1 },
  bubble: { maxWidth: '85%', borderRadius: 12, padding: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: theme.gold },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: theme.surface },
  bubbleText: { color: theme.text },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: theme.textDim },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, borderTopColor: theme.border, borderTopWidth: 1 },
  composerInput: { flex: 1, maxHeight: 120, backgroundColor: theme.surface, borderRadius: 10, color: theme.text, paddingHorizontal: 12, paddingVertical: 10 },
  sendBtn: { backgroundColor: theme.gold, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { color: '#1a1400', fontWeight: '700' },
});
