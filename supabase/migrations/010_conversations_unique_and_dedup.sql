-- ============================================================
-- 1. 合并重复会话（同一 Task + 同一对 User 只保留一条）
-- 2. 在数据库层面强制唯一性：先查后建，禁止同一参与人对多条记录
-- ============================================================

-- ---------- Step 1: 合并重复会话（acceptor_id IS NOT NULL，按参与人对）----------
-- 将“重复会话”中的消息归到每组保留的那条会话上
UPDATE public.messages m
SET conversation_id = sub.keep_id
FROM (
  SELECT
    c.id AS old_id,
    (SELECT min(c2.id)
     FROM public.conversations c2
     WHERE c2.task_id = c.task_id
       AND c2.acceptor_id IS NOT NULL
       AND LEAST(c2.publisher_id, c2.acceptor_id) = LEAST(c.publisher_id, c.acceptor_id)
       AND GREATEST(c2.publisher_id, c2.acceptor_id) = GREATEST(c.publisher_id, c.acceptor_id)
    ) AS keep_id
  FROM public.conversations c
  WHERE c.acceptor_id IS NOT NULL
) sub
WHERE m.conversation_id = sub.old_id
  AND sub.keep_id IS NOT NULL
  AND sub.old_id <> sub.keep_id;

-- 删除重复行（同一 task_id + 同一 LEAST/GREATEST 对只保留 id 最小的）
DELETE FROM public.conversations c
USING (
  SELECT id,
    row_number() OVER (
      PARTITION BY task_id, LEAST(publisher_id, acceptor_id), GREATEST(publisher_id, acceptor_id)
      ORDER BY id
    ) AS rn
  FROM public.conversations
  WHERE acceptor_id IS NOT NULL
) dup
WHERE c.id = dup.id AND dup.rn > 1;

-- ---------- Step 2: 合并重复会话（acceptor_id IS NULL，按 task_id + publisher_id）----------
UPDATE public.messages m
SET conversation_id = sub.keep_id
FROM (
  SELECT
    c.id AS old_id,
    (SELECT min(c2.id) FROM public.conversations c2
     WHERE c2.task_id = c.task_id AND c2.publisher_id = c.publisher_id AND c2.acceptor_id IS NULL) AS keep_id
  FROM public.conversations c
  WHERE c.acceptor_id IS NULL
) sub
WHERE m.conversation_id = sub.old_id
  AND sub.keep_id IS NOT NULL
  AND sub.old_id <> sub.keep_id;

DELETE FROM public.conversations c
USING (
  SELECT id,
    row_number() OVER (PARTITION BY task_id, publisher_id ORDER BY id) AS rn
  FROM public.conversations
  WHERE acceptor_id IS NULL
) dup
WHERE c.id = dup.id AND dup.rn > 1;

-- ---------- Step 3: 去掉旧唯一索引（若存在）----------
DROP INDEX IF EXISTS public.idx_conversations_task_publisher_acceptor;

-- ---------- Step 4: 强制唯一性（按参与人对，与顺序无关）----------
-- 同一 task + 同一对 (publisher, acceptor) 只允许一条（acceptor 非空时按 LEAST/GREATEST 判定同一对）
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_task_participants_unique
  ON public.conversations (task_id, LEAST(publisher_id, acceptor_id), GREATEST(publisher_id, acceptor_id))
  WHERE acceptor_id IS NOT NULL;

-- 同一 task + 同一 publisher 在“未接单”时只允许一条
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_task_publisher_null_acceptor
  ON public.conversations (task_id, publisher_id)
  WHERE acceptor_id IS NULL;

COMMENT ON INDEX public.idx_conversations_task_participants_unique IS '同一任务同一参与人对唯一；后端必须先查后建';
COMMENT ON INDEX public.idx_conversations_task_publisher_null_acceptor IS '同一任务同一发布者未接单会话唯一';
