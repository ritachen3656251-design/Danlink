-- ============================================================
-- 清空业务聊天数据（消息 + 会话）
-- 在 Supabase SQL Editor 中运行。保留 auth.users 与 public.profiles 等账号/档案数据。
-- ============================================================

-- 必须在同一语句中同时 truncate 所有引用链上的表，PostgreSQL 会按依赖顺序处理
-- messages、conversation_reads 均引用 conversations，故三表一起 truncate
-- RESTART IDENTITY：若有 SERIAL/IDENTITY 列则从 1 重新计数
-- 不使用 CASCADE，仅清空这三张表，不波及 profiles / tasks 等

TRUNCATE TABLE public.messages, public.conversation_reads, public.conversations RESTART IDENTITY;
