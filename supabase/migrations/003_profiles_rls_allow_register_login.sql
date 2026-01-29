-- ============================================================
-- profiles 表 RLS 策略：允许网页注册与按学号登录
-- 当前注册为直接 INSERT profiles（非 Auth），需允许 anon 插入与查询
-- 可重复执行：先删除再创建
-- ============================================================

DROP POLICY IF EXISTS "profiles_allow_insert_anon" ON public.profiles;
DROP POLICY IF EXISTS "profiles_allow_select_anon" ON public.profiles;
DROP POLICY IF EXISTS "profiles_allow_update_anon" ON public.profiles;

-- 允许匿名用户插入新 profile（注册）
CREATE POLICY "profiles_allow_insert_anon"
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true);

-- 允许匿名用户按学号查询 profile（登录时查 profile）
CREATE POLICY "profiles_allow_select_anon"
  ON public.profiles FOR SELECT
  TO anon
  USING (true);

-- 允许匿名用户更新任意 profile（用于余额等更新；可按需收紧为仅本人）
CREATE POLICY "profiles_allow_update_anon"
  ON public.profiles FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
