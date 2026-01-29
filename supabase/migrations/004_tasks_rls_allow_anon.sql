-- ============================================================
-- tasks 表 RLS 策略：允许匿名用户读取任务（广场）与发布任务
-- 可重复执行：先删除再创建
-- ============================================================

DROP POLICY IF EXISTS "tasks_allow_select_anon" ON public.tasks;
DROP POLICY IF EXISTS "tasks_allow_insert_anon" ON public.tasks;
DROP POLICY IF EXISTS "tasks_allow_update_anon" ON public.tasks;

-- 允许匿名用户查询任务（广场列表）
CREATE POLICY "tasks_allow_select_anon"
  ON public.tasks FOR SELECT
  TO anon
  USING (true);

-- 允许匿名用户插入新任务（发布）
CREATE POLICY "tasks_allow_insert_anon"
  ON public.tasks FOR INSERT
  TO anon
  WITH CHECK (true);

-- 允许匿名用户更新任务（撤销/完成等；可按需收紧为仅发布者）
CREATE POLICY "tasks_allow_update_anon"
  ON public.tasks FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
