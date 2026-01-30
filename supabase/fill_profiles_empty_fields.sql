-- ============================================================
-- 仅填充 profiles 中为空 (NULL 或空字符串) 的字段，不覆盖已有数据
-- 在 Supabase SQL Editor 中运行。
-- ============================================================

-- 安全原则：仅当字段为 NULL 或空字符串时才写入；逻辑上 college↔major、year↔graduation_year 保持一致

UPDATE public.profiles
SET
  -- 学院：空时与 major 一致；若 major 也为空则用默认
  college = CASE
    WHEN college IS NULL OR TRIM(college) = '' THEN COALESCE(NULLIF(TRIM(major), ''), '复旦学院')
    ELSE college
  END,
  -- 届数：空时与 year 一致；若 year 也为空则用默认
  graduation_year = CASE
    WHEN graduation_year IS NULL OR TRIM(graduation_year) = '' THEN COALESCE(NULLIF(TRIM(year), ''), '24届')
    ELSE graduation_year
  END,
  -- major 空时与 college 一致（与上面互为补充，保证一致）
  major = CASE
    WHEN major IS NULL OR TRIM(major) = '' THEN COALESCE(NULLIF(TRIM(college), ''), '复旦学院')
    ELSE major
  END,
  -- year 空时与 graduation_year 一致
  year = CASE
    WHEN year IS NULL OR TRIM(year) = '' THEN COALESCE(NULLIF(TRIM(graduation_year), ''), '24届')
    ELSE year
  END,
  -- 头像：空时用 DiceBear notionists，以 profile id 为 seed（唯一且稳定）
  avatar_url = CASE
    WHEN avatar_url IS NULL OR TRIM(avatar_url) = '' THEN 'https://api.dicebear.com/7.x/notionists/svg?seed=' || id::text
    ELSE avatar_url
  END
WHERE
  (college IS NULL OR TRIM(college) = '')
  OR (graduation_year IS NULL OR TRIM(graduation_year) = '')
  OR (major IS NULL OR TRIM(major) = '')
  OR (year IS NULL OR TRIM(year) = '')
  OR (avatar_url IS NULL OR TRIM(avatar_url) = '');
