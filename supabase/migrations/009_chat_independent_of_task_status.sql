-- ============================================================
-- Architecture: Chat MUST be independent of Task Status
-- 聊天与任务状态解耦：只要用户是该会话的参与者，无论任务状态
-- （Open / Ongoing / Completed）都必须允许发送与接收消息。
-- ============================================================
-- RLS 已由 006 / 007 配置：messages 的 SELECT/INSERT 不依赖任务状态，
-- 仅依赖 conversation_id 与 sender_id。此处仅作原则说明，无需修改策略。
-- ============================================================

COMMENT ON TABLE public.messages IS '会话消息。权限：与任务状态无关，会话参与者全周期可收发消息。';
