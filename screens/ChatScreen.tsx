import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getOrCreateConversation } from '../lib/conversation';
import { useNotification } from '../context/NotificationContext';

const PROFILE_CACHE_KEY = 'profile_avatar_cache';

function getProfileCache(): Record<string, { avatar?: string; name?: string }> {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw);
    return typeof o === 'object' && o !== null ? o : {};
  } catch {
    return {};
  }
}

function setProfileCacheEntry(profileId: string, data: { avatar?: string; name?: string }) {
  const cache = getProfileCache();
  cache[profileId] = { ...cache[profileId], ...data };
  localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cache));
}

/** profiles.id 为 UUID，receiver_id 必须与之一致，未读红点才能正确 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidProfileUuid(s: string | null | undefined): s is string {
  return typeof s === 'string' && UUID_REGEX.test(s);
}

/** 消息归属：仅用 sender_id（profile UUID）与当前用户比较，避免学号/角色混用 */
function isMeBySenderId(senderId: string | null | undefined, currentUserProfileId: string | null): boolean {
  if (currentUserProfileId == null) return false;
  if (senderId == null || senderId === '') return false;
  return senderId === currentUserProfileId;
}

/** 系统消息按视角显示：接单者/发布者 → 当前用户看为「我」，对方看为「对方」 */
function getSystemMessageDisplayText(
  content: string,
  senderId: string | null | undefined,
  currentUserProfileId: string | null,
): string {
  if (!content) return content;
  const isMe = senderId != null && currentUserProfileId != null && senderId === currentUserProfileId;
  return isMe ? content.replace(/接单者|发布者/g, '我') : content.replace(/接单者|发布者/g, '对方');
}

const ChatScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Fallback task data
  const defaultTask = {
     id: 'temp_id',
     type: 'delivery',
     title: '代取外卖',
     price: '¥15',
     description: '东门送到北苑4号楼 · 25分钟内',
     publisher: {
        id: 'other',
        name: '已实名学生',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmUMJQsXcWH-VdjV36g17sma1WnRp3I6AFCMb5t9E_b7GLrfMpuxn-BUQyKmtxYj5DXRbkpEu8-UWLi9qgXjOCxGzZrEyg8KUk8Svqk3fdv65pddZ6TDYBV1TIKqC4bKVSp9JSmNpR7f9Ze5mRlu0NBfImD-97eaW_vbIRxugWH-uzJNx3kSWGj0AR3LwCcGUceD1MjU_7xlwbo4wvzmcAM6zVMmSdbQZPQhz84mpqGR-q0cEdAXUJmQdm4FpCO6VAr0tP0XnVnNjB',
        major: '物理学系',
        rating: '4.9'
     },
     quickReplies: ['📦 东西重吗？', '🕒 我10分钟能到', '📍 具体位置在哪？']
  };

  const state = location.state || {};
  const taskId = state.taskId ?? state.task?.id;
  const task = state.task ?? defaultTask;
  const otherPartyProfileIdFromState = (state as any).otherPartyProfileId as string | undefined;

  const [isAccepted, setIsAccepted] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  // active: In progress
  // waiting_confirmation: Worker delivered, waiting for Publisher
  // waiting_receipt: Publisher paid, waiting for Worker receipt
  // completed: Done
  const [taskStatus, setTaskStatus] = useState<'active' | 'waiting_confirmation' | 'waiting_receipt' | 'completed'>('active');
  const [inputValue, setInputValue] = useState("");
  const [showPublisherPayModal, setShowPublisherPayModal] = useState(false); // For Publisher (A)
  const [showWaitingModal, setShowWaitingModal] = useState(false); // Generic waiting modal

  const [currentUserProfileId, setCurrentUserProfileId] = useState<string | null>(null);
  const [taskPublisherId, setTaskPublisherId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [otherPartyProfile, setOtherPartyProfile] = useState<{ name: string; avatar?: string } | null>(null);
  const [senderProfileCache, setSenderProfileCache] = useState<Record<string, { avatar?: string; name?: string }>>(() => getProfileCache());
  const taskIdIsUuid = taskId != null && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(taskId));
  const { setCurrentConversationId, markConversationAsRead, showToast } = useNotification();

  // Loading 锁：防止连点与未同步前的后续操作
  const [loadingAccept, setLoadingAccept] = useState(false);
  const [loadingDelivery, setLoadingDelivery] = useState(false);
  const [loadingConfirmReceipt, setLoadingConfirmReceipt] = useState(false);
  const [loadingTransferConfirmed, setLoadingTransferConfirmed] = useState(false);

  // 从 state 或 DB 获取任务的 publisher_id（profile UUID），用于角色判断
  useEffect(() => {
    const tid = taskId ?? task?.id;
    if (!tid) {
      setTaskPublisherId(null);
      return;
    }
    const fromTask = (task as any).publisher_id ?? (task as any).publisherProfileId ?? ((task.publisher?.id && /^[0-9a-f-]{36}$/i.test(String(task.publisher.id))) ? task.publisher.id : null);
    if (fromTask) {
      setTaskPublisherId(fromTask);
      return;
    }
    if (!taskIdIsUuid) {
      setTaskPublisherId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('tasks').select('publisher_id').eq('id', String(tid)).maybeSingle();
      if (!cancelled && data?.publisher_id) setTaskPublisherId((data as any).publisher_id);
      else if (!cancelled) setTaskPublisherId(null);
    })();
    return () => { cancelled = true; };
  }, [taskId, task?.id, taskIdIsUuid, (task as any).publisher_id, (task as any).publisherProfileId, task?.publisher?.id]);

  // 明确区分角色：发布者 = 当前用户 profile UUID === 任务 publisher_id；接单者 = 非发布者（本对话中的申请人）
  // 有 publisher_id 时用 UUID 比较；无时用 student_id/name 回退（如非 UUID 任务）
  const isPublisher =
    (currentUserProfileId != null && taskPublisherId != null && currentUserProfileId === taskPublisherId) ||
    (taskPublisherId == null && !!currentUser && !!task.publisher && (task.publisher.id === currentUser.id || task.publisher.name === currentUser.name));
  const isReceiver = !isPublisher && (currentUserProfileId != null || !!currentUser);

  useEffect(() => {
    setSenderProfileCache((prev) => ({ ...getProfileCache(), ...prev }));
  }, []);

  useEffect(() => {
    const u = localStorage.getItem('current_user');
    if (u) setCurrentUser(JSON.parse(u));
  }, []);

  useEffect(() => {
    if (!currentUser?.id) {
      setCurrentUserProfileId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('profiles').select('id').eq('student_id', currentUser.id).maybeSingle();
      if (!cancelled && data?.id) setCurrentUserProfileId(data.id);
      else if (!cancelled) setCurrentUserProfileId(null);
    })();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  // 对方资料：始终从 Supabase 拉取对方 profile（含 avatar_url），保证头像为最新（如 User A 在设置页改了头像，User B 能看到）
  useEffect(() => {
    if (!currentUser) {
      setOtherPartyProfile(null);
      return;
    }
    let cancelled = false;
    (async () => {
      if (isPublisher) {
        if (!taskIdIsUuid || !task?.id) {
          if (!cancelled) setOtherPartyProfile(null);
          return;
        }
        const { data: acc } = await supabase.from('task_acceptances').select('acceptor_id').eq('task_id', String(task.id)).maybeSingle();
        if (cancelled || !acc?.acceptor_id) {
          if (!cancelled) setOtherPartyProfile(null);
          return;
        }
        const { data: profile } = await supabase.from('profiles').select('name, avatar_url').eq('id', acc.acceptor_id).maybeSingle();
        if (!cancelled && profile) {
          setOtherPartyProfile({ name: profile.name, avatar: profile.avatar_url || undefined });
          setProfileCacheEntry(acc.acceptor_id, { name: profile.name, avatar: profile.avatar_url || undefined });
          setSenderProfileCache((prev) => ({ ...prev, [acc.acceptor_id]: { name: profile.name, avatar: profile.avatar_url || undefined } }));
        } else if (!cancelled) setOtherPartyProfile(null);
        return;
      }
      // 接单者看发布者：用 profile UUID 从 Supabase 拉取最新 profile（含头像）
      let publisherProfileId: string | null = (task as any).publisherProfileId ?? null;
      if (!publisherProfileId && task.publisher?.id && /^[0-9a-f-]{36}$/i.test(String(task.publisher.id)))
        publisherProfileId = task.publisher.id;
      if (!publisherProfileId && taskIdIsUuid && task?.id) {
        const { data: t } = await supabase.from('tasks').select('publisher_id').eq('id', String(taskId)).maybeSingle();
        if (t?.publisher_id) publisherProfileId = (t as any).publisher_id;
      }
      if (!publisherProfileId) {
        if (!cancelled) setOtherPartyProfile({ name: task.publisher?.name || '已实名同学', avatar: task.publisher?.avatar || (task.publisher as any)?.avatar_url });
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('name, avatar_url').eq('id', publisherProfileId).maybeSingle();
      if (!cancelled) {
        if (profile) {
          setOtherPartyProfile({ name: profile.name, avatar: profile.avatar_url || undefined });
          setProfileCacheEntry(publisherProfileId, { name: profile.name, avatar: profile.avatar_url || undefined });
          setSenderProfileCache((prev) => ({ ...prev, [publisherProfileId]: { name: profile.name, avatar: profile.avatar_url || undefined } }));
        } else setOtherPartyProfile({ name: '已实名同学', avatar: undefined });
      }
    })();
    return () => { cancelled = true; };
  }, [currentUser, isPublisher, taskIdIsUuid, task?.id, taskId, task.publisher?.name, task.publisher?.id, (task as any)?.publisherProfileId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 非 UUID 任务：从 localStorage 读取是否已完成
  useEffect(() => {
    if (taskIdIsUuid) return;
    const completedTasks = JSON.parse(localStorage.getItem('completed_tasks') || '[]');
    if (completedTasks.includes(task.id)) setTaskStatus('completed');
  }, [task.id, taskIdIsUuid]);

  // 进入页面时从 Supabase 拉取接单状态与订单状态（status），保证送达/待确认与 DB 一致
  useEffect(() => {
    const taskIdStr = String(task.id);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskIdStr)) {
      setIsAccepted(false);
      return;
    }
    const acceptorId = isPublisher ? otherPartyProfileIdFromState : currentUserProfileId;
    if (isPublisher && !acceptorId) {
      setIsAccepted(false);
      return;
    }
    if (!acceptorId) {
      if (!isPublisher) setIsAccepted(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('task_acceptances')
        .select('id, status')
        .eq('task_id', taskIdStr)
        .eq('acceptor_id', acceptorId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error('[Supabase] task_acceptances 读取失败', error);
        setIsAccepted(false);
        return;
      }
      setIsAccepted(!!data?.id);
      if (data?.status) {
        const status = data.status as 'active' | 'waiting_confirmation' | 'waiting_receipt' | 'completed';
        if (!cancelled) setTaskStatus(status);
      }
    })();
    return () => { cancelled = true; };
  }, [task.id, isPublisher, otherPartyProfileIdFromState, currentUserProfileId]);

  /** 拉取当前任务的接单状态（用于发布者「收到消息 → 刷新状态」反射弧 + 轮询） */
  const fetchTaskStatus = useCallback(async () => {
    if (!taskIdIsUuid || !task?.id) return;
    const acceptorId = isPublisher ? otherPartyProfileIdFromState : currentUserProfileId;
    if (!acceptorId) return;
    const { data } = await supabase
      .from('task_acceptances')
      .select('status')
      .eq('task_id', String(task.id))
      .eq('acceptor_id', acceptorId)
      .maybeSingle();
    if (data?.status) {
      const status = data.status as 'active' | 'waiting_confirmation' | 'waiting_receipt' | 'completed';
      setTaskStatus(status);
    }
  }, [taskIdIsUuid, task?.id, isPublisher, otherPartyProfileIdFromState, currentUserProfileId]);

  // 轮询订单状态：确保发布者能及时看到接单者的「送达」、接单者能及时看到发布者的「确认验收」等
  useEffect(() => {
    fetchTaskStatus();
    const interval = setInterval(fetchTaskStatus, 2500);
    return () => clearInterval(interval);
  }, [fetchTaskStatus]);

  // 创建/获取会话：UniqueKey = TaskID + Sorted(ParticipantIDs)，与任务详情/消息列表入口共用同一算法
  useEffect(() => {
    if (!taskIdIsUuid || !task?.id) {
      setConversationId(null);
      setCurrentConversationId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const tid = String(taskId);
      let publisherProfileId: string | null = (task as any).publisherProfileId || null;
      if (!publisherProfileId && task.publisher?.id && /^[0-9a-f-]{36}$/i.test(String(task.publisher.id)))
        publisherProfileId = task.publisher.id;
      if (!publisherProfileId && task.publisher?.id) {
        const { data: p } = await supabase.from('profiles').select('id').eq('student_id', task.publisher.id).maybeSingle();
        publisherProfileId = p?.id ?? null;
      }
      if (!publisherProfileId) {
        const { data: t } = await supabase.from('tasks').select('publisher_id').eq('id', tid).maybeSingle();
        if (t?.publisher_id) publisherProfileId = (t as any).publisher_id;
      }
      if (!publisherProfileId || cancelled) return;
      // 接单者（acceptor）固定为：发布者视角 = 对方；接单者视角 = 自己。保证与消息列表/任务详情同一会话
      let acceptorProfileId: string | null = null;
      if (isPublisher) {
        acceptorProfileId = otherPartyProfileIdFromState ?? null;
        if (acceptorProfileId == null) {
          const { data: acc } = await supabase
            .from('task_acceptances')
            .select('acceptor_id')
            .eq('task_id', tid)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
          acceptorProfileId = acc?.acceptor_id ?? null;
        }
      } else {
        acceptorProfileId = currentUserProfileId;
      }
      const id = await getOrCreateConversation(tid, publisherProfileId, acceptorProfileId);
      if (!cancelled && id) {
        setConversationId(id);
        setCurrentConversationId(id);
      }
    })();
    return () => { cancelled = true; };
  }, [taskId, taskIdIsUuid, task?.id, task?.publisher?.id, (task as any)?.publisherProfileId, otherPartyProfileIdFromState, isPublisher, currentUserProfileId, setCurrentConversationId]);

  // 进入聊天：标记该会话已读；离开时清除当前会话（避免误弹 Toast）
  useEffect(() => {
    if (conversationId && currentUserProfileId) markConversationAsRead(conversationId);
    return () => setCurrentConversationId(null);
  }, [conversationId, currentUserProfileId, markConversationAsRead, setCurrentConversationId]);

  // 聊天窗口拉取：仅按 conversation_id，不按 receiver_id / is_read（与未读红点逻辑分离，必须拉取完整对话：我发的+别人发的）
  useEffect(() => {
    if (taskId == null) {
      setMessages([]);
      setMessagesLoaded(true);
      return;
    }
    if (taskIdIsUuid && (!conversationId || currentUserProfileId == null)) {
      setMessages([]);
      setMessagesLoaded(true);
      return;
    }
    if (!taskIdIsUuid) {
      const key = `chat_messages_${String(taskId)}`;
      try {
        const raw = localStorage.getItem(key);
        const list = raw ? JSON.parse(raw) : [];
        setMessages(Array.isArray(list) ? list : []);
      } catch (_) {
        setMessages([]);
      }
      setMessagesLoaded(true);
      return;
    }
    let cancelled = false;
    setMessagesLoaded(false);
    (async () => {
      try {
        const { data: rows, error } = await supabase
          .from('messages')
          .select('id, content, created_at, sender_id, message_type')
          .eq('conversation_id', conversationId!)
          .order('created_at', { ascending: true });
        if (cancelled) return;
        if (error) throw error;
        const myId = currentUserProfileId;
        const list = (rows || []).map((r: any) => ({
          id: r.id,
          text: r.content,
          sender: r.sender_id === myId ? 'me' : 'other',
          sender_id: r.sender_id,
          time: '刚刚',
          message_type: r.message_type ?? 'user',
          created_at: r.created_at,
        }));
        if (!cancelled) setMessages(list);
      } catch (_) {
        // 请求失败时不清空已有消息，避免通知/重渲染导致聊天内容消失
      } finally {
        if (!cancelled) setMessagesLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [taskId, taskIdIsUuid, conversationId, currentUserProfileId]);

  // 根据消息中的 sender_id 从缓存或 Supabase 补全头像：气泡按 ID 查用户缓存显示
  useEffect(() => {
    if (!messages.length || currentUserProfileId == null) return;
    const otherIds = [...new Set(messages.map((m: any) => m.sender_id).filter(Boolean))].filter((id) => id !== currentUserProfileId) as string[];
    if (otherIds.length === 0) return;
    let cancelled = false;
    const cache = getProfileCache();
    const toFetch = otherIds.filter((id) => !cache[id]?.avatar);
    if (toFetch.length === 0) return;
    (async () => {
      const { data: rows } = await supabase.from('profiles').select('id, name, avatar_url').in('id', toFetch);
      if (cancelled || !rows?.length) return;
      const next: Record<string, { avatar?: string; name?: string }> = {};
      rows.forEach((r: any) => {
        const entry = { name: r.name, avatar: r.avatar_url || undefined };
        setProfileCacheEntry(r.id, entry);
        next[r.id] = entry;
      });
      if (!cancelled) setSenderProfileCache((prev) => ({ ...prev, ...next }));
    })();
    return () => { cancelled = true; };
  }, [messages, currentUserProfileId]);

  // 聊天窗口 Realtime：仅按 conversation_id 订阅；收到任何新消息时刷新任务状态（发布者「确认验收」等按钮依赖 status）
  useEffect(() => {
    if (!conversationId || !currentUserProfileId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload: any) => {
          const row = payload.new as { id: string; content: string; sender_id: string; created_at: string; message_type?: string };
          const normalized = {
            id: row.id,
            text: row.content,
            sender: row.sender_id === currentUserProfileId ? 'me' : 'other',
            sender_id: row.sender_id,
            time: '刚刚',
            message_type: row.message_type ?? 'user',
            created_at: row.created_at,
          };
          setMessages((prev) => {
            const idx = prev.findIndex((m) => m.id === row.id);
            if (idx >= 0) return prev.map((m, i) => (i === idx ? normalized : m));
            return [...prev, normalized];
          });
          // 收到任何新消息（含系统消息）→ 立即拉取任务状态，发布者端可及时显示「确认验收」等
          fetchTaskStatus();
          if ((row.sender_id !== currentUserProfileId || row.message_type === 'system') && taskId != null) {
            const listDisplayText = row.message_type === 'system'
              ? getSystemMessageDisplayText(row.content, row.sender_id, currentUserProfileId)
              : row.content;
            const other = isPublisher ? (otherPartyProfile || { name: '对方', avatar: '' }) : { name: task?.publisher?.name || '已实名学生', avatar: task?.publisher?.avatar };
            updateMessageListOnSend(String(taskId), task, listDisplayText, new Date(row.created_at).getTime(), other);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserProfileId, taskId, task, isPublisher, otherPartyProfile, fetchTaskStatus]);

  // 轮询拉取：同样仅按 conversation_id，不按 receiver_id/is_read（与未读逻辑分离）
  useEffect(() => {
    if (!taskIdIsUuid || !conversationId || currentUserProfileId == null) return;
    const fetchMessages = async () => {
      const { data: rows } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id, message_type')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      const myId = currentUserProfileId;
      const serverList = (rows || []).map((r: any) => ({
        id: r.id,
        text: r.content,
        sender: r.sender_id === myId ? 'me' : 'other',
        sender_id: r.sender_id,
        time: '刚刚',
        message_type: r.message_type ?? 'user',
        created_at: r.created_at,
      }));
      setMessages((prev) => {
        const serverIds = new Set(serverList.map((m: any) => m.id));
        const kept = prev.filter((m: any) => !serverIds.has(m.id));
        const merged = [...serverList, ...kept];
        merged.sort((a: any, b: any) => (a.created_at || '').localeCompare(b.created_at || ''));
        return merged;
      });
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 1500);
    return () => clearInterval(interval);
  }, [taskIdIsUuid, conversationId, currentUserProfileId]);

  // Persist messages to localStorage only when non-UUID task (Supabase-backed chats don't overwrite localStorage)
  useEffect(() => {
    if (!messagesLoaded || taskId == null || taskIdIsUuid) return;
    const key = `chat_messages_${String(taskId)}`;
    try {
      localStorage.setItem(key, JSON.stringify(messages));
    } catch (_) {}
  }, [taskId, taskIdIsUuid, messages, messagesLoaded]);

  // 对方展示：昵称统一为「已实名同学」；头像始终用 otherPartyProfile（已从 Supabase 拉取最新 profile，含 avatar_url）
  const displayName = '已实名同学';
  const displayAvatar = otherPartyProfile?.avatar ?? '';

  const insertSystemMessage = async (
    convId: string,
    senderId: string,
    content: string,
  ): Promise<{ id: string; content: string; created_at: string; sender_id: string; message_type: string } | null> => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: convId,
        sender_id: senderId,
        content,
        message_type: 'system',
      })
      .select('id, content, created_at, sender_id, message_type')
      .single();
    if (error) {
      console.error('[Supabase] 系统消息写入失败', error);
      return null;
    }
    await supabase
      .from('conversations')
      .update({ last_message_at: data.created_at })
      .eq('id', convId);
    return data as { id: string; content: string; created_at: string; sender_id: string; message_type: string };
  };

  const handleAccept = async () => {
    if (loadingAccept) return;
    const storedUser = localStorage.getItem('current_user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    const isTaskUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(task?.id));
    if (!user?.id || !isTaskUuid) {
      showToast('无法接单：请先登录或任务无效', 'error');
      return;
    }
    setLoadingAccept(true);
    try {
      const { data: profile, error: profileErr } = await supabase.from('profiles').select('id').eq('student_id', user.id).maybeSingle();
      if (profileErr) {
        showToast('操作失败: ' + (profileErr.message || '获取用户信息失败'), 'error');
        return;
      }
      if (!profile?.id) {
        showToast('接单失败：未找到当前用户档案，请检查登录状态', 'error');
        return;
      }
      const { error } = await supabase.from('task_acceptances').insert({
        task_id: task.id,
        acceptor_id: profile.id,
        status: 'active',
      });
      if (error) {
        showToast('操作失败: ' + error.message, 'error');
        return;
      }
      setIsAccepted(true);
      const currentTasks = JSON.parse(localStorage.getItem('my_accepted_tasks') || '[]');
      if (!currentTasks.some((t: any) => t.id === task.id)) {
        localStorage.setItem('my_accepted_tasks', JSON.stringify([...currentTasks, task]));
      }
      if (conversationId && (currentUserProfileId ?? profile.id)) {
        const sysContent = '接单者已接受任务，当前进入执行阶段。';
        const inserted = await insertSystemMessage(conversationId, currentUserProfileId ?? profile.id, sysContent);
        if (inserted) {
          const now = new Date(inserted.created_at).getTime();
          setMessages((prev) => [
            ...prev,
            { id: inserted.id, text: inserted.content, sender: 'other', sender_id: inserted.sender_id, time: '刚刚', message_type: 'system' },
          ]);
          const listDisplayText = getSystemMessageDisplayText(inserted.content, inserted.sender_id, currentUserProfileId ?? profile.id);
          const other = isPublisher ? (otherPartyProfile || { name: '对方', avatar: '' }) : { name: task?.publisher?.name || '已实名学生', avatar: task?.publisher?.avatar };
          if (taskId != null) updateMessageListOnSend(String(taskId), task, listDisplayText, now, other);
        }
      }
    } catch (e: any) {
      showToast('操作失败: ' + (e?.message || String(e)), 'error');
    } finally {
      setLoadingAccept(false);
    }
  };

  // --- Logic for Worker (B)：接单者点击「我已送达」— 原子操作：改状态 + 发系统消息（大喇叭），两者都成功后才更新 UI
  const handleDelivery = async () => {
    if (loadingDelivery) return;
    if (!window.confirm('确认已送达？将通知发布者验收。')) return;
    if (!taskIdIsUuid || !task?.id || !currentUserProfileId) {
      showToast('无法更新状态：缺少任务或用户信息', 'error');
      return;
    }
    if (!conversationId) {
      showToast('无法发送通知：会话未就绪，请稍后重试', 'error');
      return;
    }
    setLoadingDelivery(true);
    try {
      const updatePromise = supabase
        .from('task_acceptances')
        .update({ status: 'waiting_confirmation', updated_at: new Date().toISOString() })
        .eq('task_id', String(task.id))
        .eq('acceptor_id', currentUserProfileId);
      const sendSystemMsgPromise = insertSystemMessage(
        conversationId,
        currentUserProfileId,
        '任务已送达，请确认验收。',
      );
      const [updateResult, sysMsg] = await Promise.all([updatePromise, sendSystemMsgPromise]);
      if (updateResult.error) {
        showToast('操作失败: ' + updateResult.error.message, 'error');
        return;
      }
      if (!sysMsg) {
        showToast('操作失败: 系统通知发送失败，请重试', 'error');
        return;
      }
      setTaskStatus('waiting_confirmation');
      setShowWaitingModal(true);
      const now = new Date(sysMsg.created_at).getTime();
      setMessages((prev) => [
        ...prev,
        { id: sysMsg.id, text: sysMsg.content, sender: 'me', sender_id: sysMsg.sender_id, time: '刚刚', message_type: 'system' },
      ]);
      if (taskId != null) {
        const other = isPublisher ? (otherPartyProfile || { name: '对方', avatar: '' }) : { name: task?.publisher?.name || '已实名学生', avatar: task?.publisher?.avatar };
        updateMessageListOnSend(String(taskId), task, '任务已送达，请确认验收。', now, other);
      }
    } catch (e: any) {
      showToast('操作失败: ' + (e?.message || String(e)), 'error');
    } finally {
      setLoadingDelivery(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (loadingConfirmReceipt) return;
    if (!taskIdIsUuid || !task?.id || !currentUserProfileId) {
      showToast('无法更新状态：缺少任务或用户信息', 'error');
      return;
    }
    setLoadingConfirmReceipt(true);
    try {
      const { error } = await supabase
        .from('task_acceptances')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('task_id', String(task.id))
        .eq('acceptor_id', currentUserProfileId);
      if (error) {
        showToast('操作失败: ' + error.message, 'error');
        return;
      }
      setTaskStatus('completed');
      completeTaskPersistence();
      setMessages((prev) => [...prev, { id: Date.now(), text: '已确认收款，交易完成！', sender: 'me', time: '刚刚' }]);
    } catch (e: any) {
      showToast('操作失败: ' + (e?.message || String(e)), 'error');
    } finally {
      setLoadingConfirmReceipt(false);
    }
  };

  // --- Logic for Publisher (A) ---
  const handleConfirmCompletion = () => {
     // Publisher clicks "Confirm Completion"
     setShowPublisherPayModal(true);
  };

  const handleTransferConfirmed = async () => {
    if (loadingTransferConfirmed) return;
    if (!taskIdIsUuid || !task?.id || !otherPartyProfileIdFromState) {
      showToast('无法更新状态：缺少任务或接单者信息', 'error');
      return;
    }
    setLoadingTransferConfirmed(true);
    try {
      const { error } = await supabase
        .from('task_acceptances')
        .update({ status: 'waiting_receipt', updated_at: new Date().toISOString() })
        .eq('task_id', String(task.id))
        .eq('acceptor_id', otherPartyProfileIdFromState);
      if (error) {
        showToast('操作失败: ' + error.message, 'error');
        return;
      }
      setShowPublisherPayModal(false);
      setTaskStatus('waiting_receipt');
      setMessages((prev) => [...prev, { id: Date.now(), text: '我已线下支付确认，等待对方确认收款。', sender: 'me', time: '刚刚' }]);
    } catch (e: any) {
      showToast('操作失败: ' + (e?.message || String(e)), 'error');
    } finally {
      setLoadingTransferConfirmed(false);
    }
  };

  // --- Helper Functions ---
  const completeTaskPersistence = () => {
     if (!task?.id) return;
     const completedTasks = JSON.parse(localStorage.getItem('completed_tasks') || '[]');
     if (!completedTasks.includes(task.id)) {
         localStorage.setItem('completed_tasks', JSON.stringify([...completedTasks, task.id]));
     }
  };

  const getMessageListKey = () => `message_list_conversations_${currentUser?.id ?? 'guest'}`;

  const updateMessageListOnSend = (
    tid: string,
    taskPayload: any,
    lastMessage: string,
    lastMessageAt: number,
    otherParty: { name: string; avatar?: string },
  ) => {
    try {
      const key = getMessageListKey();
      const raw = localStorage.getItem(key);
      let list: Array<{ taskId: string; task: any; otherParty: { name: string; avatar?: string }; lastMessage: string; lastMessageAt: number }> = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
      const idx = list.findIndex((c) => c.taskId === tid);
      const taskSummary = {
        id: taskPayload.id,
        type: taskPayload.type,
        title: taskPayload.title,
        price: taskPayload.price,
        description: taskPayload.description,
        publisher: taskPayload.publisher,
      };
      const entry = { taskId: tid, task: taskSummary, otherParty, lastMessage, lastMessageAt };
      if (idx >= 0) {
        list[idx] = entry;
        list = [list[idx], ...list.slice(0, idx), ...list.slice(idx + 1)];
      } else {
        list = [entry, ...list];
      }
      localStorage.setItem(key, JSON.stringify(list));
      window.dispatchEvent(new Event('message-list-update'));
    } catch (_) {}
  };

  // Architecture: Chat MUST be independent of task status. Do NOT gate sending on taskStatus/isAccepted.
  const handleSendMessage = async (text = inputValue) => {
    if (!text.trim()) return;
    const trimmed = text.trim();
    if (taskIdIsUuid && conversationId && currentUserProfileId) {
      try {
        // receiver_id 必须为对方在 profiles 表中的 id（UUID），与未读红点查询一致
        let receiverId: string | null = isPublisher ? otherPartyProfileIdFromState ?? null : taskPublisherId ?? null;
        if (receiverId === currentUserProfileId || !receiverId) {
          if (isPublisher && task?.id) {
            const { data: acc } = await supabase.from('task_acceptances').select('acceptor_id').eq('task_id', String(task.id)).order('created_at', { ascending: true }).limit(1).maybeSingle();
            receiverId = acc?.acceptor_id ?? null;
          } else {
            receiverId = taskPublisherId ?? null;
          }
        }
        if (receiverId === currentUserProfileId) receiverId = null;
        if (!isValidProfileUuid(receiverId) && task?.id) {
          if (isPublisher) {
            const { data: acc } = await supabase.from('task_acceptances').select('acceptor_id').eq('task_id', String(task.id)).order('created_at', { ascending: true }).limit(1).maybeSingle();
            receiverId = acc?.acceptor_id ?? null;
          } else {
            const { data: taskRow } = await supabase.from('tasks').select('publisher_id').eq('id', String(task.id)).maybeSingle();
            receiverId = (taskRow as any)?.publisher_id ?? null;
          }
        }
        const payload: { conversation_id: string; sender_id: string; receiver_id?: string | null; content: string } = {
          conversation_id: conversationId,
          sender_id: currentUserProfileId,
          content: trimmed,
        };
        if (isValidProfileUuid(receiverId)) payload.receiver_id = receiverId;
        const { data: inserted, error } = await supabase
          .from('messages')
          .insert(payload)
          .select('id, content, created_at, sender_id')
          .single();
        if (error) {
          showToast('操作失败: ' + error.message, 'error');
          return;
        }
        if (!inserted) {
          showToast('操作失败: 发送失败，未返回数据', 'error');
          return;
        }
      setInputValue('');
      const now = new Date(inserted.created_at).getTime();
      const newMsg = {
        id: inserted.id,
        text: inserted.content,
        sender: 'me' as const,
        sender_id: currentUserProfileId,
        time: '刚刚',
        message_type: 'user' as const,
        created_at: inserted.created_at,
      };
      setMessages((prev) => [...prev, newMsg]);
      const { error: updateErr } = await supabase
        .from('conversations')
        .update({ last_message_at: inserted.created_at })
        .eq('id', conversationId);
      if (updateErr) {
        console.error('[Supabase] 会话 last_message_at 更新失败', updateErr);
      }
      const otherParty = isPublisher
        ? (otherPartyProfile || { name: '对方', avatar: '' })
        : { name: task?.publisher?.name || '已实名学生', avatar: task?.publisher?.avatar };
      if (taskId != null) updateMessageListOnSend(String(taskId), task, trimmed, now, otherParty);
      return;
      } catch (e: any) {
        showToast('操作失败: ' + (e?.message || String(e)), 'error');
      }
    }
    setInputValue('');
    const now = Date.now();
    setMessages((prev) => [...prev, { id: now, text: trimmed, sender: 'me', sender_id: currentUserProfileId ?? undefined, time: '刚刚' }]);
    const otherParty = isPublisher ? (otherPartyProfile || { name: '对方', avatar: '' }) : { name: task.publisher?.name || '已实名学生', avatar: task.publisher?.avatar };
    if (taskId != null) updateMessageListOnSend(String(taskId), task, trimmed, now, otherParty);
  };

  const getTaskIcon = (type: string) => {
      switch(type) {
          case 'study': return 'menu_book';
          case 'tutor': return 'terminal';
          default: return 'lunch_dining';
      }
  };

  if (!task) {
    return (
      <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 font-display items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-slate-300 animate-spin">progress_activity</span>
        <p className="text-sm text-slate-500 mt-3">加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 font-display relative">
      {/* Header */}
      <header className="bg-white dark:bg-surface-dark border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden">
                <img src={displayAvatar || undefined} className={`w-full h-full object-cover ${!isAccepted ? 'grayscale opacity-80' : ''}`} alt="已实名同学" />
              </div>
              {isAccepted && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1">
                {displayName}
                {!isAccepted && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded">未接单</span>}
                {isAccepted && <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded">{isPublisher ? '对方已接单' : '我已接单'}</span>}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                 {isPublisher ? '接单者' : '发布者'} · 已实名同学
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Task Context / Console：仅当 DB 中状态为 accepted/ongoing 时显示「已接单」；否则接单者显示「接单」，发布者显示「等待接单」 */}
      <div className="bg-white dark:bg-surface-dark border-b border-slate-100 dark:border-slate-800 p-4 z-10">
        {!isAccepted && !isPublisher ? (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 flex items-center gap-3 border border-slate-100 dark:border-slate-700">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${task?.type === 'study' ? 'bg-amber-100 text-amber-600' : task?.type === 'tutor' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
               <span className="material-symbols-outlined">{getTaskIcon(task?.type ?? 'delivery')}</span>
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">{task?.title ?? '任务'}</h3>
                  <span className="text-primary font-bold">{task?.price ?? ''}</span>
               </div>
               <p className="text-xs text-slate-500 truncate">{task?.description ?? ''}</p>
            </div>
            <button onClick={handleAccept} disabled={loadingAccept} className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-full shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-1">
              {loadingAccept ? (<><span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>处理中...</>) : '接单'}
            </button>
          </div>
        ) : !isAccepted && isPublisher ? (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 flex items-center gap-3 border border-slate-100 dark:border-slate-700">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${task?.type === 'study' ? 'bg-amber-100 text-amber-600' : task?.type === 'tutor' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
               <span className="material-symbols-outlined">{getTaskIcon(task?.type ?? 'delivery')}</span>
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">{task?.title ?? '任务'}</h3>
                  <span className="text-primary font-bold">{task?.price ?? ''}</span>
               </div>
               <p className="text-xs text-slate-500">等待接单者接单，仅由接单者发起接单</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
             {/* 按角色区分的状态提示：ongoing 时发布者看「对方正在执行中」，接单者看「我正在执行中」 */}
             {taskStatus === 'active' && (
               <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                 {isPublisher ? '对方(接单者)正在执行中...' : '我正在执行任务中...'}
               </p>
             )}
             {/* Progress Steps */}
             <div className="flex items-center justify-between px-2">
                <div className="flex flex-col items-center gap-1">
                   <div className="w-2 h-2 rounded-full bg-primary"></div>
                   <span className="text-[10px] font-bold text-primary">{isPublisher ? '对方已接单' : '我已接单'}</span>
                </div>
                <div className="flex-1 h-0.5 bg-slate-100 mx-2 relative">
                   <div className="absolute left-0 top-0 h-full w-full bg-primary"></div>
                </div>
                <div className="flex flex-col items-center gap-1">
                   <div className={`w-2 h-2 rounded-full bg-primary`}></div>
                   <span className="text-[10px] font-bold text-primary">进行中</span>
                </div>
                <div className="flex-1 h-0.5 bg-slate-100 mx-2 relative">
                    <div className={`absolute left-0 top-0 h-full ${taskStatus !== 'active' ? 'w-full' : 'w-0'} bg-primary transition-all duration-500`}></div>
                </div>
                <div className="flex flex-col items-center gap-1">
                   <div className={`w-2 h-2 rounded-full ${taskStatus === 'completed' ? 'bg-primary' : 'bg-slate-300'}`}></div>
                   <span className={`text-[10px] ${taskStatus === 'completed' ? 'text-primary font-bold' : 'text-slate-400'}`}>
                       {taskStatus === 'completed' ? '已完成' : '待完成'}
                   </span>
                </div>
             </div>

             {/* OTP & Actions */}
             <div className="bg-primary/5 rounded-xl p-3 flex justify-between items-center border border-primary/10">
                <div>
                   <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">核销码</p>
                   <p className="text-2xl font-mono font-black text-primary tracking-widest">8 8 2 4</p>
                   <p className="text-[10px] text-slate-400">见面请核对</p>
                </div>
                
                {/* 严格按角色+状态渲染：发布者绝不看到「我已送达/确认收款」，接单者绝不看到「确认验收」 */}
                {taskStatus === 'completed' && (
                     <button disabled className="h-10 px-4 bg-green-500 text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 opacity-90 cursor-default">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        订单结束
                     </button>
                )}
                {/* 发布者：仅当 status === delivered(waiting_confirmation) 时显示「确认验收」；绝不显示「我已送达」 */}
                {isPublisher && taskStatus === 'active' && (
                    <button disabled className="h-10 px-4 bg-slate-300 text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 cursor-default">
                        <span className="material-symbols-outlined text-[18px]">schedule</span>
                        等待送达...
                    </button>
                )}
                {isPublisher && taskStatus === 'waiting_confirmation' && (
                    <button
                        onClick={handleConfirmCompletion}
                        className="h-10 px-4 bg-primary text-white rounded-lg text-sm font-bold shadow-lg flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                        确认验收
                    </button>
                )}
                {isPublisher && taskStatus === 'waiting_receipt' && (
                    <button disabled className="h-10 px-4 bg-amber-500 text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 opacity-90">
                        <span className="material-symbols-outlined text-[18px] animate-spin">hourglass_top</span>
                        等待收款...
                    </button>
                )}
                {/* 接单者：仅当 status === ongoing(active) 时显示「我已送达」；送达后仅显示「等待发布者确认...」；绝不显示「确认验收」 */}
                {!isPublisher && taskStatus === 'active' && (
                    <button
                        onClick={handleDelivery}
                        disabled={loadingDelivery}
                        className="h-10 px-4 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loadingDelivery ? (<><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>处理中...</>) : (<><span className="material-symbols-outlined text-[18px]">{task?.type === 'delivery' ? 'location_on' : 'check_circle'}</span>我已送达</>)}
                    </button>
                )}
                {!isPublisher && taskStatus === 'waiting_confirmation' && (
                    <button disabled className="h-10 px-4 bg-amber-500 text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 opacity-90 cursor-default">
                        <span className="material-symbols-outlined text-[18px] animate-spin">hourglass_top</span>
                        等待验收
                    </button>
                )}
                {!isPublisher && taskStatus === 'waiting_receipt' && (
                    <button
                        onClick={handleConfirmReceipt}
                        disabled={loadingConfirmReceipt}
                        className="h-10 px-4 bg-green-600 text-white rounded-lg text-sm font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-transform animate-pulse disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loadingConfirmReceipt ? (<><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>处理中...</>) : (<><span className="material-symbols-outlined text-[18px]">payments</span>确认收款</>)}
                    </button>
                )}
             </div>
          </div>
        )}
      </div>

      {/* Messages Area: per-taskId, empty state when no messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
        {!messagesLoaded ? (
          <div className="flex justify-center py-8">
            <span className="text-slate-400 text-sm">加载中...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2">chat_bubble_outline</span>
            <p className="text-sm">暂无消息</p>
            <p className="text-xs mt-1">发一句打个招呼吧</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSystem = (msg as any).message_type === 'system';
            if (isSystem) {
              const displayText = getSystemMessageDisplayText(msg.text, msg.sender_id, currentUserProfileId);
              return (
                <div key={msg.id} className="flex justify-center">
                  <div className="max-w-[85%] rounded-xl px-3 py-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-200/80 dark:bg-slate-700/80">
                    {displayText}
                  </div>
                </div>
              );
            }
            const isMe = isMeBySenderId(msg.sender_id, currentUserProfileId) || (msg.sender_id == null && msg.sender === 'me');
            const avatarUrl = msg.sender_id ? (senderProfileCache[msg.sender_id]?.avatar ?? displayAvatar) : displayAvatar;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div className="mr-2 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-slate-200 bg-cover bg-center" style={{ backgroundImage: avatarUrl ? `url('${avatarUrl}')` : undefined }} title="已实名同学" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                  isMe
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-white dark:bg-surface-dark text-slate-800 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-800'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-surface-dark border-t border-slate-100 dark:border-slate-800 p-3 pb-6 sticky bottom-0 z-20">
         <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-primary transition-colors">
               <span className="material-symbols-outlined">add_circle</span>
            </button>
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="发送消息..." 
              className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-full h-10 px-4 text-sm focus:ring-2 focus:ring-primary/50"
            />
            <button 
                onClick={() => handleSendMessage()}
                className="p-2 text-primary hover:text-primary-dark transition-colors"
            >
               <span className="material-symbols-outlined filled">send</span>
            </button>
         </div>
      </div>

      {/* Generic Waiting Modal (Worker) */}
      {showWaitingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 flex flex-col items-center shadow-2xl max-w-xs w-full mx-6 animate-float-up">
             <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
               <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
             </div>
             <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">等待验收</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
               已通知对方，验收后会通知您。
             </p>
          </div>
        </div>
      )}

      {/* Publisher Payment Instruction Modal */}
      {showPublisherPayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 flex flex-col items-center shadow-2xl max-w-sm w-full mx-6 animate-float-up">
               <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                 <span className="material-symbols-outlined text-3xl text-primary">currency_yen</span>
               </div>
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">线下支付确认 {task?.price ?? ''}</h3>
               <p className="text-xs text-slate-500 mb-4">任务完成，请线下支付给对方后点击确认</p>
               
               <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-5 border border-slate-100 dark:border-slate-700">
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-3 text-center">
                      请通过以下方式私下转账
                  </p>
                  <div className="flex justify-center gap-4">
                      <div className="flex flex-col items-center gap-1">
                          <div className="w-10 h-10 rounded-lg bg-[#00C800] flex items-center justify-center text-white">
                              <span className="text-xs font-bold">微信</span>
                          </div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                          <div className="w-10 h-10 rounded-lg bg-[#1677FF] flex items-center justify-center text-white">
                              <span className="text-xs font-bold">支付宝</span>
                          </div>
                      </div>
                  </div>
               </div>

               <button 
                  onClick={handleTransferConfirmed}
                  disabled={loadingTransferConfirmed}
                  className="w-full h-12 bg-primary text-white rounded-xl font-bold shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
               >
                  {loadingTransferConfirmed ? (<><span className="material-symbols-outlined animate-spin">progress_activity</span>处理中...</>) : '我已线下支付确认'}
               </button>
               <button 
                  onClick={() => setShowPublisherPayModal(false)}
                  className="mt-3 text-sm text-slate-400 hover:text-slate-600"
               >
                  稍后再付
               </button>
            </div>
          </div>
      )}
    </div>
  );
};

export default ChatScreen;