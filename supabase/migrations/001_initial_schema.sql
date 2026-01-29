-- ============================================================
-- 旦Link (DanLink) - Supabase 建表方案
-- 基于当前 React 组件数据模型生成
-- ============================================================

-- 启用 UUID 扩展（Supabase 默认已启用）
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. 用户/档案表 (profiles)
-- 对应: LoginScreen, ProfileScreen, DigitalCardScreen, PublishTaskScreen 中的 current_user / user_db
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  major TEXT DEFAULT '复旦学院',
  year TEXT DEFAULT '24届',
  balance INTEGER NOT NULL DEFAULT 0,
  avatar_url TEXT,
  rating NUMERIC(3,2) DEFAULT 5.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS '用户档案（学号、姓名、院系、余额等）';
COMMENT ON COLUMN public.profiles.student_id IS '学号，登录用唯一标识';
COMMENT ON COLUMN public.profiles.balance IS '钱包余额（单位：元）';

-- 若使用 Supabase Auth，可增加：id 改为 REFERENCES auth.users(id)，并保留 student_id 为业务唯一键
-- ALTER TABLE public.profiles DROP CONSTRAINT profiles_pkey;
-- ALTER TABLE public.profiles ADD PRIMARY KEY (id);
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================
-- 2. 任务表 (tasks)
-- 对应: HomeScreen TaskData, PublishTaskScreen 发布的 newTask
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'task_type' AND n.nspname = 'public') THEN
    CREATE TYPE public.task_type AS ENUM ('delivery', 'study', 'tutor');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'task_status' AND n.nspname = 'public') THEN
    CREATE TYPE public.task_status AS ENUM ('active', 'revoked', 'completed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.task_type NOT NULL,
  title TEXT NOT NULL,
  price_display TEXT NOT NULL,
  price_label TEXT NOT NULL DEFAULT '酬劳',
  location_tag TEXT NOT NULL,
  category_tag TEXT NOT NULL,
  distance TEXT DEFAULT '校内',
  description TEXT NOT NULL,
  start_label TEXT NOT NULL,
  end_label TEXT NOT NULL,
  map_bg_image_url TEXT,
  quick_replies JSONB DEFAULT '[]'::jsonb,
  status public.task_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.tasks IS '校园任务（外卖/二手/辅导等）';
COMMENT ON COLUMN public.tasks.price_display IS '展示用价格，如 ¥15';
COMMENT ON COLUMN public.tasks.quick_replies IS '快捷回复文案数组';

CREATE INDEX IF NOT EXISTS idx_tasks_publisher_id ON public.tasks(publisher_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON public.tasks(type);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);

-- ============================================================
-- 3. 任务接单/订单表 (task_acceptances)
-- 对应: 我接受的任务、订单状态（ChatScreen 中 active / waiting_confirmation / waiting_receipt / completed）
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'acceptance_status' AND n.nspname = 'public') THEN
    CREATE TYPE public.acceptance_status AS ENUM (
      'active',
      'waiting_confirmation',
      'waiting_receipt',
      'completed'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.task_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  acceptor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.acceptance_status NOT NULL DEFAULT 'active',
  verification_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, acceptor_id)
);

COMMENT ON TABLE public.task_acceptances IS '用户接单记录与订单状态';
COMMENT ON COLUMN public.task_acceptances.verification_code IS '核销码，见面核对';

CREATE INDEX IF NOT EXISTS idx_task_acceptances_task_id ON public.task_acceptances(task_id);
CREATE INDEX IF NOT EXISTS idx_task_acceptances_acceptor_id ON public.task_acceptances(acceptor_id);
CREATE INDEX IF NOT EXISTS idx_task_acceptances_status ON public.task_acceptances(status);

-- ============================================================
-- 4. 会话表 (conversations)
-- 对应: MessageListScreen 会话列表、ChatScreen 单聊
-- 一个任务下发布者与某接单者一个会话
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  publisher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  acceptor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.conversations IS '任务相关聊天会话（发布者-接单者）；同一任务下 (task_id, publisher_id, acceptor_id) 业务唯一，acceptor_id 为空表示未接单会话';

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_task_publisher_acceptor
  ON public.conversations(task_id, publisher_id, acceptor_id) WHERE acceptor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_task_id ON public.conversations(task_id);
CREATE INDEX IF NOT EXISTS idx_conversations_publisher_id ON public.conversations(publisher_id);
CREATE INDEX IF NOT EXISTS idx_conversations_acceptor_id ON public.conversations(acceptor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC NULLS LAST);

-- ============================================================
-- 5. 消息表 (messages)
-- 对应: ChatScreen 中的 messages 列表
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.messages IS '会话消息';

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- ============================================================
-- 6. 钱包流水表 (wallet_transactions) — 可选
-- 对应: ChatScreen 中 updateBalance、确认收款/转账
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  task_acceptance_id UUID REFERENCES public.task_acceptances(id) ON DELETE SET NULL,
  kind TEXT NOT NULL DEFAULT 'task',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.wallet_transactions IS '余额变动流水（正数入账，负数扣款）';
COMMENT ON COLUMN public.wallet_transactions.amount IS '金额（元），正为收入负为支出';

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);

-- ============================================================
-- 7. 未读/通知 (可选，对应 BottomNav has_unread)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversation_reads (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

COMMENT ON TABLE public.conversation_reads IS '会话已读位置，用于未读红点';

-- ============================================================
-- 触发器：updated_at 自动更新
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS task_acceptances_updated_at ON public.task_acceptances;
CREATE TRIGGER task_acceptances_updated_at BEFORE UPDATE ON public.task_acceptances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS conversations_updated_at ON public.conversations;
CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- RLS 策略（按需启用）
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_reads ENABLE ROW LEVEL SECURITY;

-- 示例：仅允许用户读/写自己的 profile（需将 current_user_id() 替换为你的 auth 或 session 实现）
-- CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (id = current_setting('app.current_user_id')::uuid);
-- CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = current_setting('app.current_user_id')::uuid);

-- 任务：所有人可读 active，发布者可更新/撤销自己的任务
-- CREATE POLICY "Tasks are readable" ON public.tasks FOR SELECT USING (true);
-- CREATE POLICY "Publishers can insert task" ON public.tasks FOR INSERT WITH CHECK (publisher_id = current_setting('app.current_user_id')::uuid);
-- CREATE POLICY "Publishers can update own task" ON public.tasks FOR UPDATE USING (publisher_id = current_setting('app.current_user_id')::uuid);

-- 消息：仅会话参与者可读/写
-- 具体策略请根据 auth.uid() 或 app.current_user_id 在 Supabase Dashboard 中配置
