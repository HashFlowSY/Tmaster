import { type Conversation, systemLabel } from '@tianji/shared';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../theme';
import { Muted } from '../ui';

/** 对话列表（历史/收藏共用）。favorited 的项显示星标。 */
export function ConversationList({
  items,
  emptyText,
  onPress,
}: {
  items: Conversation[];
  emptyText: string;
  onPress: (c: Conversation) => void;
}) {
  if (items.length === 0) return <Muted>{emptyText}</Muted>;
  return (
    <FlatList
      data={items}
      keyExtractor={(c) => c.id}
      contentContainerStyle={{ paddingVertical: 12 }}
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => onPress(item)}>
          <Text style={styles.tag}>{systemLabel(item.system)}</Text>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          {item.favorited && <Text style={styles.star}>★</Text>}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomColor: theme.border,
    borderBottomWidth: 1,
  },
  tag: { color: theme.gold, fontSize: 13 },
  title: { color: theme.text, fontSize: 15, flex: 1 },
  star: { color: theme.gold },
});
