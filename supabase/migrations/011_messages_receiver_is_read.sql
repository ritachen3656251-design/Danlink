-- 全局消息通知：接收人与已读状态
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.messages.receiver_id IS '接收人 profile UUID，用于未读/通知；发送时由前端写入';
COMMENT ON COLUMN public.messages.is_read IS '是否已读，默认 false；进入聊天时置为 true';

CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read) WHERE is_read = false;

-- 允许更新 is_read（标记已读）
DROP POLICY IF EXISTS "messages_allow_update_anon" ON public.messages;
CREATE POLICY "messages_allow_update_anon"
  ON public.messages FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "messages_allow_update_authenticated" ON public.messages;
CREATE POLICY "messages_allow_update_authenticated"
  ON public.messages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
