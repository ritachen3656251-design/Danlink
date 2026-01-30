import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { syncZeroChatData } from '../lib/chatStorage';
import { useNotification } from '../context/NotificationContext';

const MESSAGE_LIST_KEY_PREFIX = 'message_list_conversations_';

type ConversationEntry = {
  taskId: string;
  task: {
    id: string;
    type: string;
    title: string;
    price: string;
    description?: string;
    publisher: { name: string; avatar?: string; major?: string; rating?: string };
  };
  /** 当前用户视角下的“对方”（消息栏显示的头像和姓名） */
  otherParty?: { name: string; avatar?: string };
  /** 对方的 profile UUID，用于进入聊天时区分同一任务下的多个人（A-B / A-C 独立私聊） */
  otherPartyProfileId?: string;
  /** 会话 UUID，用于未读红点 */
  conversationId?: string;
  lastMessage: string;
  lastMessageAt: number;
};

function formatMessageTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60 * 1000) return '刚刚';
  const d = new Date(ts);
  const today = new Date();
  const sameDay = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  if (sameDay) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return '昨天';
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);
  if (d >= weekStart) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[d.getDay()];
  }
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 历史 Mock 的 taskId，从列表加载时过滤掉，只显示真实数据 */
const MOCK_TASK_IDS = new Set(['msg_delivery', 'msg_study', 'msg_tutor']);

function getMessageListKey(userId: string | undefined): string {
  return `${MESSAGE_LIST_KEY_PREFIX}${userId ?? 'guest'}`;
}

function loadConversations(userId: string | undefined): ConversationEntry[] {
  try {
    const raw = localStorage.getItem(getMessageListKey(userId));
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    const byConversation = new Map<string, ConversationEntry>();
    list.forEach((e: ConversationEntry) => {
      const taskId = e.taskId ?? e.task?.id;
      if (!taskId || MOCK_TASK_IDS.has(String(taskId))) return;
      const otherId = e.otherPartyProfileId ?? '';
      const key = `${taskId}:${otherId}`;
      const existing = byConversation.get(key);
      if (!existing || (e.lastMessageAt > existing.lastMessageAt))
        byConversation.set(key, { ...e, otherParty: e.otherParty ?? (e.task?.publisher ? { name: e.task.publisher.name, avatar: e.task.publisher.avatar } : undefined) });
    });
    return Array.from(byConversation.values());
  } catch {
    return [];
  }
}

const MessageListScreen = () => {
  const navigate = useNavigate();
  const { unreadConversationIds, refreshUnread } = useNotification();
  const [userId, setUserId] = useState<string | undefined>(() => {
    try {
      const raw = localStorage.getItem('current_user');
      const u = raw ? JSON.parse(raw) : null;
      return u?.id;
    } catch {
      return undefined;
    }
  });
  const [currentUserProfileId, setCurrentUserProfileId] = useState<string | null>(null);
  const conversationIdToMetaRef = useRef<Map<string, { taskId: string; otherParty: { name: string; avatar?: string } }>>(new Map());

  useEffect(() => {
    const raw = localStorage.getItem('current_user');
    const u = raw ? JSON.parse(raw) : null;
    setUserId(u?.id);
  }, []);
  useEffect(() => {
    const onStorage = () => {
      try {
        const raw = localStorage.getItem('current_user');
        const u = raw ? JSON.parse(raw) : null;
        setUserId(u?.id);
      } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!userId) {
      setCurrentUserProfileId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('profiles').select('id').eq('student_id', userId).maybeSingle();
      if (!cancelled) setCurrentUserProfileId(data?.id ?? null);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const [conversations, setConversations] = useState<ConversationEntry[]>(() => loadConversations(userId));

  useEffect(() => {
    setConversations(loadConversations(userId));
  }, [userId]);

  useEffect(() => {
    const onUpdate = () => {
      setConversations(loadConversations(userId));
    };
    window.addEventListener('message-list-update', onUpdate);
    return () => window.removeEventListener('message-list-update', onUpdate);
  }, [userId]);

  // 订阅「当前用户参与的所有会话」的新消息，收到后更新消息栏并刷新列表
  useEffect(() => {
    if (!currentUserProfileId || !userId) return;
    let cancelled = false;
    const channel = supabase.channel('message-list-realtime');
    (async () => {
      const { data: convRows, error: convError } = await supabase
        .from('conversations')
        .select('id, task_id, publisher_id, acceptor_id')
        .or(`publisher_id.eq.${currentUserProfileId},acceptor_id.eq.${currentUserProfileId}`);
      if (cancelled) return;
      if (convError) return;
      // 零数据：与 DB 同步，清空前端会话列表和单聊缓存，确保显示「暂无会话」（仅当确实无会话时，避免请求失败误清空聊天）
      if (!convRows?.length) {
        syncZeroChatData(userId);
        return;
      }
      const byConversationId = new Map<string, { id: string; task_id: string; publisher_id: string; acceptor_id: string | null }>();
      convRows.forEach((r: any) => {
        byConversationId.set(r.id, r);
      });
      const uniqueRows = Array.from(byConversationId.values());
      const profileIds = new Set<string>();
      uniqueRows.forEach((r: any) => {
        if (r.publisher_id) profileIds.add(r.publisher_id);
        if (r.acceptor_id) profileIds.add(r.acceptor_id);
      });
      const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url').in('id', Array.from(profileIds));
      const profileMap = new Map<string, { name: string; avatar?: string }>();
      (profiles || []).forEach((p: any) => profileMap.set(p.id, { name: p.name, avatar: p.avatar_url }));
      const meta = new Map<string, { taskId: string; otherParty: { name: string; avatar?: string }; otherPartyProfileId: string }>();
      uniqueRows.forEach((r: any) => {
        const otherId = r.publisher_id === currentUserProfileId ? r.acceptor_id : r.publisher_id;
        const otherParty = otherId ? (profileMap.get(otherId) || { name: '对方', avatar: undefined }) : { name: '对方', avatar: undefined };
        meta.set(r.id, { taskId: r.task_id, otherParty, otherPartyProfileId: otherId || '' });
      });
      conversationIdToMetaRef.current = meta;
      const key = getMessageListKey(userId);
      const realList: ConversationEntry[] = [];
      for (const r of uniqueRows) {
        const m = meta.get(r.id);
        if (!m) continue;
        const { data: latest } = await supabase.from('messages').select('content, created_at').eq('conversation_id', r.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (cancelled) return;
        if (latest) {
          const lastMessageAt = new Date(latest.created_at).getTime();
          const { data: taskRow } = await supabase.from('tasks').select('id, type, title, price_display, description, publisher_id').eq('id', m.taskId).maybeSingle();
          if (taskRow) {
            const pubId = (taskRow as any).publisher_id;
            const { data: pub } = await supabase.from('profiles').select('name, avatar_url').eq('id', pubId).maybeSingle();
            const publisher = pub ? { name: pub.name, avatar: pub.avatar_url, major: '', rating: '' } : { name: '已实名同学', avatar: undefined as string | undefined, major: '', rating: '' };
            const taskSummary = { id: taskRow.id, type: taskRow.type || 'delivery', title: taskRow.title || '', price: (taskRow as any).price_display || '', description: (taskRow as any).description, publisher };
            realList.push({ taskId: m.taskId, task: taskSummary, otherParty: m.otherParty, otherPartyProfileId: m.otherPartyProfileId, conversationId: r.id, lastMessage: latest.content, lastMessageAt });
          }
        }
      }
      if (!cancelled) {
        localStorage.setItem(key, JSON.stringify(realList));
        window.dispatchEvent(new Event('message-list-update'));
      }
      uniqueRows.forEach((r: any) => {
        channel.on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${r.id}` },
          async (payload: any) => {
            const row = payload.new as { conversation_id: string; content: string; created_at: string; sender_id: string };
            const m = conversationIdToMetaRef.current.get(row.conversation_id);
            if (!m || row.sender_id === currentUserProfileId) return;
            const lastMessageAt = new Date(row.created_at).getTime();
            const existingKey = getMessageListKey(userId);
            const raw = localStorage.getItem(existingKey);
            let list: ConversationEntry[] = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(list)) list = [];
            const idx = list.findIndex((c) => c.taskId === m.taskId && (c.otherPartyProfileId || '') === (m.otherPartyProfileId || ''));
            if (idx >= 0) {
              list[idx] = { ...list[idx], otherParty: m.otherParty, conversationId: list[idx].conversationId || row.conversation_id, lastMessage: row.content, lastMessageAt };
              list = [list[idx], ...list.slice(0, idx), ...list.slice(idx + 1)];
            } else {
              const { data: taskRow } = await supabase.from('tasks').select('id, type, title, price_display, description, publisher_id').eq('id', m.taskId).single();
              if (taskRow) {
                const pubId = (taskRow as any).publisher_id;
                const { data: pub } = await supabase.from('profiles').select('name, avatar_url').eq('id', pubId).maybeSingle();
                const publisher = pub ? { name: pub.name, avatar: pub.avatar_url, major: '', rating: '' } : { name: '已实名学生', avatar: undefined as string | undefined, major: '', rating: '' };
                const taskSummary = {
                  id: taskRow.id,
                  type: taskRow.type || 'delivery',
                  title: taskRow.title || '',
                  price: (taskRow as any).price_display || '',
                  description: (taskRow as any).description,
                  publisher,
                };
                list = [{ taskId: m.taskId, task: taskSummary, otherParty: m.otherParty, otherPartyProfileId: m.otherPartyProfileId, conversationId: row.conversation_id, lastMessage: row.content, lastMessageAt }, ...list];
              } else return;
            }
            localStorage.setItem(existingKey, JSON.stringify(list));
            window.dispatchEvent(new Event('message-list-update'));
          },
        );
      });
      channel.subscribe();
    })();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [currentUserProfileId, userId]);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  const sortedList = useMemo(() => {
    return [...conversations].sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  }, [conversations]);

  const getTitleClass = (type: string) =>
    type === 'delivery'
      ? 'text-primary bg-primary/10 px-1.5 py-0.5 rounded-md'
      : 'text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md';

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-body antialiased selection:bg-primary/20 min-h-screen pb-24">
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">消息</h1>
        <div className="flex items-center gap-4">
          <button className="flex items-center justify-center p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
            <span className="material-symbols-outlined">search</span>
          </button>
          <button className="flex items-center justify-center p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
            <span className="material-symbols-outlined">add_comment</span>
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto no-scrollbar px-4 pt-2">
        <div className="flex flex-col space-y-1">
          {sortedList.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8 text-sm">暂无会话</p>
          ) : (
            sortedList.map((entry) => {
              const otherAvatar = entry.otherParty?.avatar;
              const otherName = '已实名同学';
              const hasUnread = entry.conversationId != null && unreadConversationIds.has(entry.conversationId);
              return (
              <div
                key={`${entry.taskId}:${entry.otherPartyProfileId ?? ''}`}
                onClick={() => navigate('/chat', { state: { taskId: entry.taskId, accepted: false, task: entry.task, otherPartyProfileId: entry.otherPartyProfileId } })}
                className="group relative flex items-center gap-4 rounded-2xl p-3 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <div className="relative shrink-0 h-14 w-14 rounded-full bg-slate-200 overflow-hidden shadow-inner">
                  {otherAvatar ? (
                    <img
                      src={otherAvatar}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  {hasUnread ? (
                    <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background-light dark:ring-background-dark z-10" title="未读" aria-label="未读" />
                  ) : (
                    <span className="absolute bottom-0.5 right-0.5 block h-3.5 w-3.5 rounded-full ring-2 ring-background-light dark:ring-background-dark bg-green-500" />
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-center min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">
                      {otherName}
                      <span className={`ml-1 text-xs font-medium align-middle ${getTitleClass(entry.task.type)}`}>
                        [{entry.task.title}]
                      </span>
                    </h3>
                    <span className="shrink-0 text-xs font-medium text-slate-400">
                      {formatMessageTime(entry.lastMessageAt)}
                    </span>
                  </div>
                  <p className="truncate font-body text-sm text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                    {entry.lastMessage}
                  </p>
                </div>
              </div>
            ); })
          )}
        </div>
      </main>
    </div>
  );
};

export default MessageListScreen;
