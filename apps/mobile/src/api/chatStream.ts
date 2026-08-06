import type { ChatStreamEvent } from '@tianji/shared';
import { fetch as expoFetch } from 'expo/fetch';
import { getToken } from '../auth/token';
import { apiUrl } from './client';

/**
 * 发送消息并流式接收 AI 回复。用 expo/fetch（RN 下支持流式 body）读取 SSE，
 * 逐条把 ChatStreamEvent 回调出去。见 shared 的 ChatStreamEvent 契约。
 */
export async function sendMessageStream(
  conversationId: string,
  content: string,
  onEvent: (event: ChatStreamEvent) => void,
): Promise<void> {
  const token = await getToken();
  const res = await expoFetch(apiUrl(`/api/conversations/${conversationId}/messages`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ content }),
  });

  if (!res.body) throw new Error('服务端未返回流式响应');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data) continue;
      try {
        onEvent(JSON.parse(data) as ChatStreamEvent);
      } catch {
        // 半包/心跳，忽略
      }
    }
  }
}
