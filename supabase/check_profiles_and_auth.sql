-- ============================================================
-- 检查：1) profile 中无法登录的用户  2) 已注册但未同步到 profile 的用户
-- 在 Supabase SQL Editor 中逐段执行，查看结果
-- ============================================================

-- ---------------------------------------------------------------------------
-- 1) profiles 中“无法登录”的数据（按学号登录时无法命中或数据异常）
-- ---------------------------------------------------------------------------

-- 1.1 学号为空或仅空白：无法通过学号查询登录
SELECT id, student_id, name, created_at,
       '学号为空或仅空白' AS 问题
FROM public.profiles
WHERE student_id IS NULL OR trim(student_id) = '';

-- 1.2 姓名为空或仅空白：展示异常（登录仍可成功）
SELECT id, student_id, name, created_at,
       '姓名为空或仅空白' AS 问题
FROM public.profiles
WHERE name IS NULL OR trim(name) = '';

-- 1.3 学号重复：违反 UNIQUE 一般不会出现，若有则需清理
SELECT student_id, count(*) AS 条数, array_agg(id) AS profile_ids
FROM public.profiles
GROUP BY student_id
HAVING count(*) > 1;


-- ---------------------------------------------------------------------------
-- 2) 已通过 Auth 注册但 profile 中无对应记录（触发器未跑或失败）
-- ---------------------------------------------------------------------------

-- 2.1 auth.users 中有，但 public.profiles 中无对应 id
SELECT u.id AS auth_uid,
       u.email,
       u.created_at AS auth_created_at,
       u.raw_user_meta_data->>'student_id' AS meta_student_id,
       u.raw_user_meta_data->>'name' AS meta_name,
       'Auth 已注册但 profiles 无记录' AS 问题
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;


-- ---------------------------------------------------------------------------
-- 3) 汇总统计（便于一眼判断）
-- ---------------------------------------------------------------------------

SELECT
  (SELECT count(*) FROM public.profiles) AS profiles_总数,
  (SELECT count(*) FROM public.profiles WHERE student_id IS NULL OR trim(student_id) = '') AS profiles_学号无效数,
  (SELECT count(*) FROM auth.users) AS auth_users_总数,
  (SELECT count(*) FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id WHERE p.id IS NULL) AS auth_已注册但无profile数;

-- ============================================================
-- 说明
-- ============================================================
-- • 当前网页登录：按 profiles.student_id 查询，不校验密码；学号为空/重复会导致无法登录或歧义。
-- • “网页注册但没进 profile”：若注册走的是「直接 INSERT profiles」（本项目的做法），
--   成功则一定在 profiles，失败则不在；数据库无法区分“点了注册但 INSERT 被 RLS 拒绝”的用户，
--   只能通过 2) 检查「Auth 已注册但无 profile」的情况（即用了 Auth 注册但触发器未同步）。
-- • 若 2) 有结果：说明这些用户用 Auth 注册成功，但 profiles 未插入，可手动补插或重新执行触发器逻辑。
