-- ============================================================
-- 1. 删除 description 重复的任务（每个 description 保留一条，保留最早创建的）
-- 2. 再补充一倍新任务（按当前条数复制，随机 publisher，description 加后缀避免重复）
-- 3. 为所有接单记录补全随机 verification_code（原为 NULL 的）
-- 在 Supabase SQL Editor 中运行。
-- ============================================================

-- ---------- 1. 去重：同一 description 只保留一条（保留 created_at 最早、id 最小的） ----------
DELETE FROM public.tasks
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
      ROW_NUMBER() OVER (PARTITION BY description ORDER BY created_at ASC, id) AS rn
    FROM public.tasks
  ) sub
  WHERE sub.rn > 1
);

-- ---------- 2. 补充一倍新任务：从当前 tasks 复制，新 id、随机 publisher、description 加后缀 ----------
INSERT INTO public.tasks (
  id,
  publisher_id,
  type,
  title,
  price_display,
  price_label,
  location_tag,
  category_tag,
  distance,
  description,
  start_label,
  end_label,
  map_bg_image_url,
  quick_replies,
  status,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.profiles ORDER BY random() LIMIT 1),
  type,
  title,
  price_display,
  price_label,
  location_tag,
  category_tag,
  distance,
  description || ' (副本)',
  start_label,
  end_label,
  map_bg_image_url,
  quick_replies,
  status,
  now(),
  now()
FROM public.tasks;

-- ---------- 3. 为所有 verification_code 为空的接单记录随机生成 6 位核销码 ----------
UPDATE public.task_acceptances
SET verification_code = upper(substring(md5(random()::text) FROM 1 FOR 6))
WHERE verification_code IS NULL OR TRIM(verification_code) = '';
