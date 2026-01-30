-- ============================================================
-- 清理重复会话：同一 (task_id, publisher_id) 只保留一条会话
-- 将重复会话中的消息迁移到保留的会话，然后删除重复行
-- 在 Supabase SQL Editor 中一次性执行
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  -- 1. 把「重复会话」中的消息迁移到该 (task_id, publisher_id) 下保留的会话
  FOR r IN (
    WITH dupes AS (
      SELECT
        task_id,
        publisher_id,
        id AS conv_id,
        ROW_NUMBER() OVER (
          PARTITION BY task_id, publisher_id
          ORDER BY (acceptor_id IS NOT NULL) DESC, last_message_at DESC NULLS LAST, created_at DESC
        ) AS rn
      FROM public.conversations
    ),
    keep AS (
      SELECT task_id, publisher_id, conv_id AS keep_id
      FROM dupes
      WHERE rn = 1
    ),
    drop_list AS (
      SELECT d.conv_id AS drop_id, k.keep_id
      FROM dupes d
      JOIN keep k ON d.task_id = k.task_id AND d.publisher_id = k.publisher_id
      WHERE d.rn > 1
    )
    SELECT drop_id, keep_id FROM drop_list
  )
  LOOP
    UPDATE public.messages SET conversation_id = r.keep_id WHERE conversation_id = r.drop_id;
  END LOOP;

  -- 2. 更新保留会话的 last_message_at
  UPDATE public.conversations c
  SET last_message_at = sub.max_at
  FROM (
    SELECT conversation_id, MAX(created_at) AS max_at
    FROM public.messages
    GROUP BY conversation_id
  ) sub
  WHERE c.id = sub.conversation_id;

  -- 3. 删除重复的会话（每个 task_id, publisher_id 只保留 rn=1）
  WITH to_delete AS (
    SELECT conv_id FROM (
      SELECT
        id AS conv_id,
        ROW_NUMBER() OVER (
          PARTITION BY task_id, publisher_id
          ORDER BY (acceptor_id IS NOT NULL) DESC, last_message_at DESC NULLS LAST, created_at DESC
        ) AS rn
      FROM public.conversations
    ) t
    WHERE t.rn > 1
  )
  DELETE FROM public.conversations WHERE id IN (SELECT conv_id FROM to_delete);

  -- 4. 可选：将 acceptor_id 仍为 null 的会话，若有接单则更新为接单者
  UPDATE public.conversations c
  SET acceptor_id = ta.acceptor_id
  FROM public.task_acceptances ta
  WHERE c.task_id = ta.task_id
    AND c.acceptor_id IS NULL;

END $$;
