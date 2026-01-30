-- Realtime 按 receiver_id 过滤需要表能提供完整行数据，对非主键列过滤时建议设置 REPLICA IDENTITY FULL
ALTER TABLE public.messages REPLICA IDENTITY FULL;
