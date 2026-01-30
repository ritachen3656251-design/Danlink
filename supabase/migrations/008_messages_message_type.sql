-- 消息类型：user 普通消息，system 系统通知（如接单/聘用成功）
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'user';

COMMENT ON COLUMN public.messages.message_type IS 'user=普通消息, system=系统通知';
