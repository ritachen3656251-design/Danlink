-- ============================================================
-- conversations / messages 对 authenticated 角色也开放读写
-- 确保无论 anon 还是登录态都能看到同一会话下的全部消息
-- ============================================================

-- ---------- conversations (authenticated) ----------
DROP POLICY IF EXISTS "conversations_allow_select_authenticated" ON public.conversations;
DROP POLICY IF EXISTS "conversations_allow_insert_authenticated" ON public.conversations;
DROP POLICY IF EXISTS "conversations_allow_update_authenticated" ON public.conversations;

CREATE POLICY "conversations_allow_select_authenticated"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "conversations_allow_insert_authenticated"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "conversations_allow_update_authenticated"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ---------- messages (authenticated) ----------
DROP POLICY IF EXISTS "messages_allow_select_authenticated" ON public.messages;
DROP POLICY IF EXISTS "messages_allow_insert_authenticated" ON public.messages;

CREATE POLICY "messages_allow_select_authenticated"
  ON public.messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "messages_allow_insert_authenticated"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (true);
