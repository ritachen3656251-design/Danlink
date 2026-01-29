-- ============================================================
-- task_acceptances 表 RLS 策略：接单写入与双方可见
-- 可重复执行：先删除再创建
-- ============================================================

DROP POLICY IF EXISTS "task_acceptances_allow_select_anon" ON public.task_acceptances;
DROP POLICY IF EXISTS "task_acceptances_allow_insert_anon" ON public.task_acceptances;
DROP POLICY IF EXISTS "task_acceptances_allow_update_anon" ON public.task_acceptances;

-- 允许匿名用户查询接单记录（发布者/接单者都能看到是否已接单）
CREATE POLICY "task_acceptances_allow_select_anon"
  ON public.task_acceptances FOR SELECT
  TO anon
  USING (true);

-- 允许匿名用户插入接单记录（点击接单）
CREATE POLICY "task_acceptances_allow_insert_anon"
  ON public.task_acceptances FOR INSERT
  TO anon
  WITH CHECK (true);

-- 允许匿名用户更新接单状态（送达/确认/完成等）
CREATE POLICY "task_acceptances_allow_update_anon"
  ON public.task_acceptances FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
