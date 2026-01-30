import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

type NotificationContextType = {
  currentUserProfileId: string | null;
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
  /** 未读会话 id 集合（用于列表红点） */
  unreadConversationIds: Set<string>;
  /** 未读消息总数（用于 Tab 红点/数字） */
  totalUnreadCount: number;
  /** 每个会话的未读数 conversationId -> count */
  conversationsUnreadMap: Record<string, number>;
  hasUnread: boolean;
  showToast: (message: string, type?: 'error') => void;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  refreshUnread: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [currentUserProfileId, setCurrentUserProfileId] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [unreadConversationIds, setUnreadConversationIds] = useState<Set<string>>(new Set());
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [conversationsUnreadMap, setConversationsUnreadMap] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<{ message: string; type?: 'error' } | null>(null);

  const showToast = useCallback((message: string, type?: 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const hasUnread = totalUnreadCount > 0;

  /** 未读 = 别人发给我且未读。必须只统计 receiver_id=me，且绝不统计 sender_id=me（我发出的不算我的未读） */
  const refreshUnread = useCallback(async () => {
    if (!currentUserProfileId) {
      setUnreadConversationIds(new Set());
      setTotalUnreadCount(0);
      setConversationsUnreadMap({});
      localStorage.setItem('has_unread', 'false');
      window.dispatchEvent(new Event('update-unread'));
      return;
    }
    const { data, error } = await supabase
      .from('messages')
      .select('conversation_id, sender_id')
      .eq('receiver_id', currentUserProfileId)
      .neq('sender_id', currentUserProfileId)
      .eq('is_read', false);
    if (error) {
      console.warn('[NotificationContext] refreshUnread failed:', error.message);
      return;
    }
    const map: Record<string, number> = {};
    (data || []).forEach((r: any) => {
      const cid = r.conversation_id;
      if (!cid || r.sender_id === currentUserProfileId) return;
      map[cid] = (map[cid] ?? 0) + 1;
    });
    const ids = new Set(Object.keys(map));
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    setUnreadConversationIds(ids);
    setTotalUnreadCount(total);
    setConversationsUnreadMap(map);
    localStorage.setItem('has_unread', total > 0 ? 'true' : 'false');
    window.dispatchEvent(new Event('update-unread'));
  }, [currentUserProfileId]);

  const markConversationAsRead = useCallback(
    async (conversationId: string) => {
      if (!currentUserProfileId) return;
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', currentUserProfileId);
      const count = conversationsUnreadMap[conversationId] ?? 0;
      setTotalUnreadCount((prev) => Math.max(0, prev - count));
      setConversationsUnreadMap((prev) => {
        const next = { ...prev };
        delete next[conversationId];
        return next;
      });
      setUnreadConversationIds((prev) => {
        const next = new Set(prev);
        next.delete(conversationId);
        localStorage.setItem('has_unread', next.size > 0 ? 'true' : 'false');
        window.dispatchEvent(new Event('update-unread'));
        return next;
      });
    },
    [currentUserProfileId, conversationsUnreadMap]
  );

  // 当前用户 profile id：优先用 current_user.profileId，否则用 student_id 查 profiles（登录后需收到 current_user_changed 才更新）
  const resolveCurrentUserProfileId = useCallback(async () => {
    const raw = localStorage.getItem('current_user');
    const user = raw ? JSON.parse(raw) : null;
    if (!user?.id) {
      setCurrentUserProfileId(null);
      return;
    }
    if (user.profileId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(user.profileId))) {
      setCurrentUserProfileId(user.profileId);
      return;
    }
    const { data } = await supabase.from('profiles').select('id').eq('student_id', user.id).maybeSingle();
    const profileId = data?.id ? (data as any).id : null;
    if (profileId) {
      try {
        const updated = { ...user, profileId };
        localStorage.setItem('current_user', JSON.stringify(updated));
      } catch (_) {}
      setCurrentUserProfileId(profileId);
    } else {
      setCurrentUserProfileId(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await resolveCurrentUserProfileId();
    })();
    const onUserChanged = () => {
      if (!cancelled) resolveCurrentUserProfileId();
    };
    window.addEventListener('current_user_changed', onUserChanged);
    return () => {
      cancelled = true;
      window.removeEventListener('current_user_changed', onUserChanged);
    };
  }, [resolveCurrentUserProfileId]);

  // 初始加载未读会话；切回标签页时再拉一次
  useEffect(() => {
    if (!currentUserProfileId) return;
    refreshUnread();
    const onVisible = () => refreshUnread();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [currentUserProfileId, refreshUnread]);

  // 全局 Realtime：只监听「发给我的」新消息（receiver_id=当前用户）。我发出的（sender_id=我）绝不增加未读。
  useEffect(() => {
    if (!currentUserProfileId) return;
    const channel = supabase
      .channel('global-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserProfileId}`,
        },
        async (payload: any) => {
          const row = payload.new as { id: string; conversation_id: string; sender_id: string; receiver_id?: string | null; content?: string; message_type?: string };
          if (row.sender_id === currentUserProfileId) return;
          if (row.receiver_id !== currentUserProfileId) return;
          if (row.message_type === 'system') return;
          const inThisChat = row.conversation_id === currentConversationId;
          if (inThisChat) return;
          setUnreadConversationIds((prev) => new Set(prev).add(row.conversation_id));
          setTotalUnreadCount((prev) => prev + 1);
          setConversationsUnreadMap((prev) => ({ ...prev, [row.conversation_id]: (prev[row.conversation_id] ?? 0) + 1 }));
          localStorage.setItem('has_unread', 'true');
          window.dispatchEvent(new Event('update-unread'));
          const { data: profile } = await supabase.from('profiles').select('name').eq('id', row.sender_id).maybeSingle();
          const senderName = (profile as any)?.name || '已实名同学';
          showToast(`收到来自 ${senderName} 的一条新消息`);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') console.warn('[NotificationContext] Realtime channel error; unread filter may need REPLICA IDENTITY FULL on messages.');
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserProfileId, currentConversationId, showToast]);

  return (
    <NotificationContext.Provider
      value={{
        currentUserProfileId,
        currentConversationId,
        setCurrentConversationId,
        unreadConversationIds,
        totalUnreadCount,
        hasUnread,
        showToast,
        markConversationAsRead,
        refreshUnread,
      }}
    >
      {children}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[90%] px-4 py-3 rounded-xl text-white text-sm shadow-lg animate-fade-in ${toast.type === 'error' ? 'bg-red-600' : 'bg-slate-800'}`}>
          {toast.message}
        </div>
      )}
    </NotificationContext.Provider>
  );
}
