import type { Conversation } from '@tianji/shared';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ConversationList } from '../../src/components/ConversationList';
import { ConversationApi } from '../../src/api/endpoints';
import { Screen } from '../../src/ui';

export default function HistoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Conversation[]>([]);

  useFocusEffect(
    useCallback(() => {
      ConversationApi.list()
        .then(setItems)
        .catch(() => {});
    }, []),
  );

  return (
    <Screen>
      <ConversationList items={items} emptyText="暂无历史对话" onPress={() => router.push('/chat')} />
    </Screen>
  );
}
