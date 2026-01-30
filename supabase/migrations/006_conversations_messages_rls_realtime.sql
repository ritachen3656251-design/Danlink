-- ============================================================
-- conversations / messages 表 RLS + Realtime
-- 允许匿名用户读写会话与消息；开启 messages 实时推送
-- ============================================================

-- ---------- conversations ----------
DROP POLICY IF EXISTS "conversations_allow_select_anon" ON public.conversations;
DROP POLICY IF EXISTS "conversations_allow_insert_anon" ON public.conversations;
DROP POLICY IF EXISTS "conversations_allow_update_anon" ON public.conversations;

CREATE POLICY "conversations_allow_select_anon"
  ON public.conversations FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "conversations_allow_insert_anon"
  ON public.conversations FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "conversations_allow_update_anon"
  ON public.conversations FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ---------- messages（Chat 与任务状态解耦：参与者全周期可收发，不依赖 task status）----------
DROP POLICY IF EXISTS "messages_allow_select_anon" ON public.messages;
DROP POLICY IF EXISTS "messages_allow_insert_anon" ON public.messages;

CREATE POLICY "messages_allow_select_anon"
  ON public.messages FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "messages_allow_insert_anon"
  ON public.messages FOR INSERT
  TO anon
  WITH CHECK (true);

-- ---------- Realtime: 仅对 messages 表启用（INSERT 后对方可实时收到） ----------
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION
  WHEN OTHERS THEN NULL;  -- 表已在 publication 时忽略
END $$;
