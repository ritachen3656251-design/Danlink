/**
 * 聊天相关前端缓存清理：与 Supabase 清空后保持「零数据」一致
 */

const MESSAGE_LIST_KEY_PREFIX = 'message_list_conversations_';
const CHAT_MESSAGES_KEY_PREFIX = 'chat_messages_';

/**
 * 清除当前用户的会话列表缓存（message_list_conversations_*）
 */
export function clearMessageListCache(userId: string | undefined): void {
  try {
    const key = `${MESSAGE_LIST_KEY_PREFIX}${userId ?? 'guest'}`;
    localStorage.setItem(key, JSON.stringify([]));
  } catch (_) {}
}

/**
 * 清除所有聊天相关 localStorage：
 * - 所有用户的 message_list_conversations_*
 * - 所有 chat_messages_*
 */
export function clearChatLocalCache(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(MESSAGE_LIST_KEY_PREFIX) || k.startsWith(CHAT_MESSAGES_KEY_PREFIX))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (_) {}
}

/**
 * 当服务端返回零会话时调用：清空会话列表缓存 + 清空单聊消息缓存，并触发 UI 刷新
 */
export function syncZeroChatData(userId: string | undefined): void {
  clearChatLocalCache();
  clearMessageListCache(userId);
  window.dispatchEvent(new Event('message-list-update'));
}
