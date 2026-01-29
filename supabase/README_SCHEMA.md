# 旦Link Supabase 建表说明

基于当前 React 组件数据模型生成的 Supabase 表结构说明。

## 项目结构回顾

```
旦link-(danlink)/
├── App.tsx
├── components/
│   └── BottomNav.tsx
├── screens/
│   ├── ChatScreen.tsx       # 单聊 + 订单状态
│   ├── DigitalCardScreen.tsx # 电子卡（用户信息）
│   ├── HomeScreen.tsx       # 任务列表、接单
│   ├── LoginScreen.tsx      # 登录/注册（用户）
│   ├── MarketplaceScreen.tsx
│   ├── MessageListScreen.tsx # 会话列表
│   ├── OrderTrackingScreen.tsx # 订单追踪
│   ├── ProfileScreen.tsx    # 我的、我接的/我发的任务、余额
│   ├── PublishTaskScreen.tsx # 发布任务
│   └── ServiceCategoryScreen.tsx
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```

## 表与前端对应关系

| 表名 | 对应组件/数据 | 说明 |
|------|----------------|------|
| **profiles** | `LoginScreen` user_db / current_user<br>`ProfileScreen` user<br>`DigitalCardScreen` user<br>`PublishTaskScreen` user | 用户档案：学号、姓名、院系、届、余额、头像 |
| **tasks** | `HomeScreen` TaskData<br>`PublishTaskScreen` newTask<br>`ProfileScreen` 我发布的任务 | 任务：类型(delivery/study/tutor)、标题、价格、起终点、描述、quickReplies、状态 |
| **task_acceptances** | `HomeScreen` my_accepted_tasks<br>`ChatScreen` 接单/订单状态<br>`ProfileScreen` 我接受的任务<br>`OrderTrackingScreen` 订单追踪 | 接单记录与订单状态：active → waiting_confirmation → waiting_receipt → completed |
| **conversations** | `MessageListScreen` 会话列表<br>`ChatScreen` 单聊 | 每个任务下「发布者-接单者」一个会话 |
| **messages** | `ChatScreen` messages | 会话内消息 |
| **wallet_transactions** | `ChatScreen` updateBalance、确认收款/转账 | 余额流水（可选） |
| **conversation_reads** | `BottomNav` has_unread | 会话已读位置，用于未读红点（可选） |

## 核心字段映射（前端 → 表）

### 用户 (profiles)

- `user.id` / 学号 → `profiles.student_id`（唯一）
- `user.name` → `profiles.name`
- `user.major` / `user.year` → `profiles.major`, `profiles.year`
- `user.balance` → `profiles.balance`
- `user.avatar` → `profiles.avatar_url`
- 表主键为 `profiles.id` (UUID)，前端若用学号登录，查询时用 `student_id` 对应。

### 任务 (tasks)

- `task.id` → `tasks.id`
- `task.type` → `tasks.type` (delivery | study | tutor)
- `task.title` / `task.description` → `tasks.title`, `tasks.description`
- `task.price` → `tasks.price_display`
- `task.priceLabel` → `tasks.price_label`
- `task.locationTag` / `task.categoryTag` → `tasks.location_tag`, `tasks.category_tag`
- `task.publisher` → 关联 `profiles`，存 `tasks.publisher_id`
- `task.mapConfig.startLabel/endLabel` → `tasks.start_label`, `tasks.end_label`
- `task.quickReplies` → `tasks.quick_replies` (JSONB)
- 撤销/完成 → `tasks.status` (active | revoked | completed)

### 接单/订单 (task_acceptances)

- 接单者 → `task_acceptances.acceptor_id`
- 订单状态 → `task_acceptances.status` (active | waiting_confirmation | waiting_receipt | completed)
- 核销码 → `task_acceptances.verification_code`

### 消息 (messages)

- `msg.sender` ('me' | 'other') → 用 `messages.sender_id` 与当前用户比较
- `msg.text` → `messages.content`
- `msg.time` → 可由 `messages.created_at` 格式化

## 使用方式

1. 在 Supabase 项目中使用 SQL Editor 执行 `migrations/001_initial_schema.sql`，或使用 Supabase CLI：  
   `supabase db push` / `supabase migration up`。
2. 若使用 Supabase Auth：可将 `profiles.id` 改为 `REFERENCES auth.users(id)`，并在注册时写入 `student_id` 等字段。
3. RLS 策略中已将表启用 RLS，具体策略需根据 `auth.uid()` 或你的当前用户 id 在 Dashboard 或后续迁移中补充。

## 枚举与类型

- **task_type**: `delivery` | `study` | `tutor`
- **task_status**: `active` | `revoked` | `completed`
- **acceptance_status**: `active` | `waiting_confirmation` | `waiting_receipt` | `completed`
