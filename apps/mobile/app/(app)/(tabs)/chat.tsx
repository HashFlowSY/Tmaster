import { type Conversation, type MessageCard, type System, systemLabel } from '@tianji/shared';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '../../../src/api/client';
import { sendMessageStream } from '../../../src/api/chatStream';
import { ConversationApi } from '../../../src/api/endpoints';
import { conversationMeta } from '../../../src/chat/conversationMeta';
import {
  ChatMessage,
  Composer,
  KvCard,
  Persona,
  TabDrop,
  type TabDropItem,
} from '../../../src/design/primitives';
import { gutter, spacing } from '../../../src/design/spacing';
import { semantic } from '../../../src/design/semantic';
import { fonts, tracking } from '../../../src/design/typography';

interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** 可选结构化要点卡（shared MessageCard）——AI 消息可携带，渲染为内嵌 KvCard。 */
  card?: MessageCard;
}

/**
 * 对话主页 —— 与原型 docs/ui/tianji-app-design.html 的 chat 屏 1:1（spec §8、issue 07）。
 * 顶部居中 TabDrop 切换器（当前对话标签 + 最近列表，caret 旋转，切换所显线程；「新对话」入口按 issue 07
 * 决策收在菜单里）；中部 Persona 抬头 + me/AI 气泡线程（msgin 入场、减动效感知）；底部 Composer（金渐变
 * 发送键）。BottomNav 由 (tabs) 布局提供。真实拉取/开/发走 ConversationApi + sendMessageStream。
 * 每条对话按 system（八字/奇门，ADR-0004）分型，切换器副标题显示系统标签。
 */
export default function ChatScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  // 拉取对话列表（切回本 tab 时刷新）；首次落地自动选中最近一条，让页面呈现原型的已填充态。
  const loadConversations = useCallback(() => {
    ConversationApi.list()
      .then((list) => {
        setConversations(list);
        setActiveId((cur) => cur ?? list[0]?.id ?? null);
      })
      .catch(() => {});
  }, []);
  useFocusEffect(loadConversations);

  // 切换当前对话时载入其消息；流式发送直接改 messages，不在此重载（故仅依赖 activeId）。
  useEffect(() => {
    if (activeId == null) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    ConversationApi.messages(activeId)
      .then((msgs) => {
        if (!cancelled)
          setMessages(msgs.map((m) => ({ id: m.id, role: m.role, content: m.content, card: m.card })));
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  // 切换器项：标题 + 「系统 · 时间」副标题（纯函数 conversationMeta，见其单测）。
  // 列表短（最近若干条），每 render 内联重算即可，相对时间也随之保持新鲜。
  const now = new Date();
  const items: TabDropItem[] = conversations.map((c) => ({
    key: c.id,
    title: c.title,
    meta: conversationMeta(c.system, c.updatedAt, now),
  }));

  const newConversation = async (system: System) => {
    try {
      const c = await ConversationApi.create({ system });
      setConversations((prev) => [c, ...prev]);
      setActiveId(c.id);
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

  // 新对话入口（TabDrop 菜单触发）→ 二选一命理系统（ADR-0004：创建即定型、不可改）。
  const promptNewConversation = () => {
    Alert.alert('新对话', '选择命理系统', [
      { text: systemLabel('bazi'), onPress: () => newConversation('bazi') },
      { text: systemLabel('qimen'), onPress: () => newConversation('qimen') },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const send = async () => {
    if (activeId == null || !input.trim() || streaming) return;
    const content = input.trim();
    setInput('');
    // 乐观插入：命主气泡 + 空 AI 气泡；AI 气泡 key 全程稳定（流式只改 content），避免重挂载重放 msgin。
    const stamp = Date.now();
    const assistantId = `a-${stamp}`;
    setMessages((prev) => [
      ...prev,
      { id: `u-${stamp}`, role: 'user', content },
      { id: assistantId, role: 'assistant', content: '' },
    ]);
    setStreaming(true);
    try {
      await sendMessageStream(activeId, content, (ev) => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== assistantId) return m;
            if (ev.type === 'delta') return { ...m, content: m.content + ev.text };
            if (ev.type === 'done') return { ...m, content: ev.message.content, card: ev.message.card };
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

  const sendDisabled = activeId == null || !input.trim() || streaming;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* chat-head：居中切换器；新对话入口收在其菜单内（issue 07 决策）。 */}
        <View style={styles.head}>
          <TabDrop
            items={items}
            selectedKey={activeId ?? ''}
            onSelect={setActiveId}
            onNew={promptNewConversation}
            placeholder="新对话"
          />
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.thread}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {active != null ? (
            <Persona label="命主" name={active.title} tag={systemLabel(active.system)} />
          ) : null}

          {active != null && messages.length === 0 ? (
            <Text style={styles.hint}>向天机追问，开启这段对话。</Text>
          ) : null}

          {active == null ? (
            <Text style={styles.hint}>还没有对话。点击上方切换器里的「新对话」开始。</Text>
          ) : null}

          {messages.map((m) => (
            <ChatMessage
              key={m.id}
              role={m.role}
              card={m.card != null ? <KvCard title={m.card.title} rows={m.card.rows} /> : undefined}
            >
              {m.content || '…'}
            </ChatMessage>
          ))}
        </ScrollView>

        <Composer
          value={input}
          onChangeText={setInput}
          onSend={send}
          sendDisabled={sendDisabled}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: semantic.bg },
  flex: { flex: 1 },
  // 原型 .chat-head：居中、padding 6-22-14。水平留白让 TabDrop 菜单左右各约 20 内缩。
  // zIndex 抬高整个抬头子树，令 TabDrop 展开的绝对定位菜单盖在其后的 ScrollView 线程之上
  // （否则后渲染的 ScrollView 会盖住菜单）；Android boxShadow/层序按 spec 需真机核对。
  head: {
    zIndex: 50,
    paddingTop: 6,
    paddingBottom: 14,
    paddingHorizontal: gutter.header,
  },
  // 原型 .chat：纵向、gap16、padding 14-22-20。
  thread: {
    flexDirection: 'column',
    gap: spacing.lg, // 16
    paddingHorizontal: gutter.header, // 22
    paddingTop: 14,
    paddingBottom: 20,
  },
  // 空态/未选态提示：次要色、居中、舒适行高。
  hint: {
    fontFamily: fonts.sans,
    fontSize: 13.5,
    letterSpacing: tracking(0.02, 13.5),
    lineHeight: 13.5 * 1.6,
    color: semantic.textSecondary,
    textAlign: 'center',
    paddingVertical: 40,
  },
});
