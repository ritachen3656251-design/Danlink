import { supabase } from './supabase';

/**
 * 统一规则：UniqueKey = TaskID + Sorted(ParticipantIDs)。
 * 无论从任务详情「联系」还是从消息列表进入，同一 (task_id, 参与人对) 只对应一条 conversation_id。
 */

/** 参与人对规范化：p1 < p2，保证同一对人在任意入口得到相同 key */
function sortedParticipantPair(profileIdA: string, profileIdB: string | null): { p1: string; p2: string | null } {
  if (profileIdB == null) return { p1: profileIdA, p2: null };
  const a = profileIdA;
  const b = profileIdB;
  return a < b ? { p1: a, p2: b } : { p1: b, p2: a };
}

/** 按 UniqueKey 查会话：只查 (task_id, p1, p2) 或 (task_id, p2, p1)，保证唯一 */
async function findConversationByKey(
  taskId: string,
  p1: string,
  p2: string | null,
): Promise<{ id: string } | null> {
  const tid = String(taskId);
  if (p2 == null) {
    const { data } = await supabase
      .from('conversations')
      .select('id')
      .eq('task_id', tid)
      .eq('publisher_id', p1)
      .is('acceptor_id', null)
      .maybeSingle();
    return data ?? null;
  }
  const { data: d1 } = await supabase
    .from('conversations')
    .select('id')
    .eq('task_id', tid)
    .eq('publisher_id', p1)
    .eq('acceptor_id', p2)
    .maybeSingle();
  if (d1?.id) return d1;
  const { data: d2 } = await supabase
    .from('conversations')
    .select('id')
    .eq('task_id', tid)
    .eq('publisher_id', p2)
    .eq('acceptor_id', p1)
    .maybeSingle();
  return d2 ?? null;
}

/**
 * 获取或创建会话：严格「先查后建」，禁止直接创建。
 * UniqueKey = TaskID + Sorted(ParticipantIDs)；同一 (taskId, publisher, acceptor) 只对应一条 conversationId。
 */
export async function getOrCreateConversation(
  taskId: string,
  publisherProfileId: string,
  acceptorProfileId: string | null,
): Promise<string | null> {
  const tid = String(taskId);
  const { p1, p2 } = sortedParticipantPair(publisherProfileId, acceptorProfileId);

  // 1. 先查：已有则直接返回
  const existing = await findConversationByKey(tid, p1, p2);
  if (existing?.id) return existing.id;

  // 2. 接单后：若存在 (task_id, publisher, null)，复用并更新为 (p1, p2)，不新建
  if (acceptorProfileId != null) {
    const { data: rowNull } = await supabase
      .from('conversations')
      .select('id')
      .eq('task_id', tid)
      .eq('publisher_id', publisherProfileId)
      .is('acceptor_id', null)
      .maybeSingle();
    if (rowNull?.id) {
      const { data: updated } = await supabase
        .from('conversations')
        .update({ publisher_id: p1, acceptor_id: p2 })
        .eq('id', rowNull.id)
        .select('id')
        .single();
      if (updated?.id) return updated.id;
    }
    const { data: rowNullB } = await supabase
      .from('conversations')
      .select('id')
      .eq('task_id', tid)
      .eq('publisher_id', acceptorProfileId)
      .is('acceptor_id', null)
      .maybeSingle();
    if (rowNullB?.id) {
      const { data: updated } = await supabase
        .from('conversations')
        .update({ publisher_id: p1, acceptor_id: p2 })
        .eq('id', rowNullB.id)
        .select('id')
        .single();
      if (updated?.id) return updated.id;
    }
  }

  // 3. 再查一次（并发下可能已被其他请求创建），避免违反唯一约束
  const again = await findConversationByKey(tid, p1, p2);
  if (again?.id) return again.id;

  // 4. 仅当确实不存在时才插入
  const { data: inserted, error } = await supabase
    .from('conversations')
    .insert({
      task_id: tid,
      publisher_id: p1,
      acceptor_id: p2,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Supabase] conversations 写入失败', error);
    const retry = await findConversationByKey(tid, p1, p2);
    return retry?.id ?? null;
  }
  return inserted?.id ?? null;
}
