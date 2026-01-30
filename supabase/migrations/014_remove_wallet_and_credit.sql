-- 移除体验币/钱包与信用相关：交易改为线下，仅记录状态；移除 profiles.balance、profiles.rating 与钱包流水表

-- 1. 先更新 Auth 同步触发器（不再写入 balance、rating），否则删列后触发器会报错
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, student_id, name, major, year, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'student_id', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', '用户'),
    COALESCE(NEW.raw_user_meta_data->>'major', '复旦学院'),
    COALESCE(NEW.raw_user_meta_data->>'year', '24届'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    student_id   = EXCLUDED.student_id,
    name         = EXCLUDED.name,
    major        = EXCLUDED.major,
    year         = EXCLUDED.year,
    avatar_url   = EXCLUDED.avatar_url,
    updated_at   = now();
  RETURN NEW;
END;
$$;

-- 2. 移除 profiles 中的余额与信用字段
ALTER TABLE public.profiles DROP COLUMN IF EXISTS balance;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS rating;

-- 3. 移除钱包流水表（若存在）
DROP TABLE IF EXISTS public.wallet_transactions;
