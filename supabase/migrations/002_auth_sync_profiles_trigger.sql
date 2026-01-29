-- ============================================================
-- 旦Link：Auth 新用户注册时自动同步到 public.profiles
-- 使用 SECURITY DEFINER 确保触发器有权限写入 profiles
-- ============================================================
-- 数据同步：
--   id         = 新用户的 uid (auth.users.id)，必须一致
--   student_id = 新用户学号，从注册时 metadata 读取 (raw_user_meta_data->>'student_id')
--   密码：Auth 不向数据库暴露明文密码，触发器无法写入；登录网页使用 Auth 会话 (email+密码)
-- 权限：SECURITY DEFINER，以函数所有者身份执行，确保可写 profiles（含 RLS 下）
-- 前端注册示例：signUp({ email, password, options: { data: { student_id: '学号', name: '姓名' } } })
-- ============================================================

-- 若 profiles 表当前 id 为 DEFAULT gen_random_uuid()，需支持外键关联 auth.users 时再取消下面注释
-- ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
-- ALTER TABLE public.profiles ADD PRIMARY KEY (id);
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 触发器函数：新用户注册后写入 public.profiles（SECURITY DEFINER）
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    student_id,
    name,
    major,
    year,
    balance,
    avatar_url,
    rating
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'student_id', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', '用户'),
    COALESCE(NEW.raw_user_meta_data->>'major', '复旦学院'),
    COALESCE(NEW.raw_user_meta_data->>'year', '24届'),
    COALESCE((NEW.raw_user_meta_data->>'balance')::int, 0),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE((NEW.raw_user_meta_data->>'rating')::numeric, 5.0)
  )
  ON CONFLICT (id) DO UPDATE SET
    student_id   = EXCLUDED.student_id,
    name         = EXCLUDED.name,
    major        = EXCLUDED.major,
    year         = EXCLUDED.year,
    balance      = EXCLUDED.balance,
    avatar_url   = EXCLUDED.avatar_url,
    rating       = EXCLUDED.rating,
    updated_at   = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_auth_user() IS 'Auth 新用户注册时同步到 profiles，SECURITY DEFINER 保证有权限写表';

-- 在 auth.users 上创建触发器：插入后执行
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================
-- 确保 profile 数据可用来“登录网页”的说明
-- ============================================================
-- 登录由 Supabase Auth 完成（email+密码 或 魔术链接），不依赖 profiles 表里的密码字段。
-- 登录成功后 auth.uid() 即为 profiles.id，前端用 auth.uid() 查 profiles 即可展示学号、姓名等。
-- 若需按学号+密码登录且不用 Auth，需在 profiles 增加 password 字段并由应用层校验，本触发器不写入密码。
-- RLS 建议：允许用户读/写自己的 profile（WHERE id = auth.uid()）。
-- ============================================================
