-- ============================================================
-- 清空聊天相关数据（在 Supabase SQL Editor 中执行）
-- 执行前请确认：仅清空 messages 与 conversations，不影响 tasks/profiles 等
-- ============================================================

-- 1. 先删子表（messages 依赖 conversations.id），再删父表（conversations）
DELETE FROM public.messages;
DELETE FROM public.conversations;

-- 2. 若希望用 TRUNCATE（更快、可重置序列）：先子表后父表
-- TRUNCATE public.messages;
-- TRUNCATE public.conversations;

-- 说明：当前 messages / conversations 主键为 UUID（gen_random_uuid()），无 serial/identity，
-- 因此无需 RESTART IDENTITY。若将来改用 serial 主键，可改为：
-- TRUNCATE public.messages, public.conversations RESTART IDENTITY CASCADE;
