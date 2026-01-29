-- 填充关联数据：3 条接单 + 对应会话与消息（动态获取 UUID，无需手填）
-- 说明：选 status='active' 的任务接单，不修改 task.status（PostgreSQL 中新增枚举值须提交后才能使用）。
-- 若需「已接单」显示：可先单独执行 ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'taken'; 提交后再跑 UPDATE。

DO $$
DECLARE
  v_task_id       uuid;
  v_publisher_id  uuid;
  v_acceptor_id   uuid;
  v_conv_id       uuid;
  v_row           record;
  v_i             int;
  v_code          text;
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS _seed_pairs (
    task_id uuid,
    publisher_id uuid,
    acceptor_id uuid
  );
  TRUNCATE _seed_pairs;

  -- ========== 1. 模拟接单 3 次 ==========
  FOR v_i IN 1..3 LOOP
    SELECT t.id, t.publisher_id INTO v_task_id, v_publisher_id
    FROM public.tasks t
    LEFT JOIN public.task_acceptances ta ON ta.task_id = t.id
    WHERE t.status = 'active' AND ta.id IS NULL
    ORDER BY random()
    LIMIT 1;

    IF v_task_id IS NULL THEN
      RAISE NOTICE '第 % 次：没有可接的 active 任务，跳过', v_i;
      CONTINUE;
    END IF;

    SELECT id INTO v_acceptor_id
    FROM public.profiles
    WHERE id != v_publisher_id
    ORDER BY random()
    LIMIT 1;

    IF v_acceptor_id IS NULL THEN
      RAISE NOTICE '第 % 次：没有其他用户可作接单人，跳过', v_i;
      CONTINUE;
    END IF;

    v_code := (floor(random() * 9000 + 1000))::int::text;
    INSERT INTO public.task_acceptances (task_id, acceptor_id, status, verification_code)
    VALUES (v_task_id, v_acceptor_id, 'active', v_code);

    INSERT INTO _seed_pairs (task_id, publisher_id, acceptor_id)
    VALUES (v_task_id, v_publisher_id, v_acceptor_id);
  END LOOP;

  -- ========== 2. 为刚接单的 3 条创建会话并插入 3 条消息 ==========
  FOR v_row IN SELECT task_id, publisher_id, acceptor_id FROM _seed_pairs
  LOOP
    INSERT INTO public.conversations (task_id, publisher_id, acceptor_id, last_message_at)
    VALUES (v_row.task_id, v_row.publisher_id, v_row.acceptor_id, now())
    ON CONFLICT (task_id, publisher_id, acceptor_id) WHERE acceptor_id IS NOT NULL
    DO NOTHING;

    SELECT c.id INTO v_conv_id
    FROM public.conversations c
    WHERE c.task_id = v_row.task_id
      AND c.publisher_id = v_row.publisher_id
      AND c.acceptor_id = v_row.acceptor_id
    LIMIT 1;

    IF v_conv_id IS NOT NULL THEN
      INSERT INTO public.messages (conversation_id, sender_id, content)
      VALUES
        (v_conv_id, v_row.publisher_id, '同学你好，大概多久能送到？'),
        (v_conv_id, v_row.acceptor_id, '马上到，10分钟'),
        (v_conv_id, v_row.publisher_id, '好的，谢谢！');
    END IF;
  END LOOP;

  DROP TABLE IF EXISTS _seed_pairs;
END $$;
