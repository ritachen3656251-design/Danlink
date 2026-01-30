# 如何执行数据库迁移

项目里的迁移文件在 `supabase/migrations/` 下，按文件名顺序执行即可。

---

## 方式一：Supabase 网页（推荐，无需装 CLI）

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)，进入你的项目。
2. 左侧 **SQL Editor** → **New query**。
3. 按顺序执行迁移：
   - 若数据库是全新的，先执行 `001_initial_schema.sql`，再依次执行 `002`、`003`、`004`、`005`、`006`。
   - 若前面已执行过，可只执行 **`006_conversations_messages_rls_realtime.sql`**；若希望登录态也能读写会话/消息，再执行 **`007_conversations_messages_authenticated_rls.sql`**；若需要系统通知消息（接单/聘用），再执行 **`008_messages_message_type.sql`**。打开对应文件，复制全部内容到 SQL 编辑器，点击 **Run**。

---

## 方式二：用 Supabase CLI 做 `db push`

### 1. 安装 Supabase CLI

```bash
npm install -g supabase
```

或使用 npx（不全局安装）：

```bash
npx supabase --version
```

### 2. 在项目里初始化并关联远程项目

在项目根目录（即 `旦link-(danlink)`）执行：

```bash
cd "c:\Users\lenovo\Downloads\旦link-(danlink)"
npx supabase init
```

会生成 `supabase/config.toml`。然后关联你在 Dashboard 里创建的项目：

```bash
npx supabase link --project-ref 你的ReferenceID
```

**注意**：这里必须填 **Reference ID**（一串约 20 位的字母数字），不是项目名称。

- 在 Dashboard 里：**Project Settings** → **General** → **Reference ID**
- 示例：`xyzabcdeflmnopqrstu`（只写这一串，不要加空格或「Project」等字）
- 填错会报错或 `npm error canceled`

执行 `link` 时终端会提示输入数据库密码（即创建项目时设的 DB password）。

### 3. 推送迁移

```bash
npx supabase db push
```

会把 `supabase/migrations/` 下**尚未在远程执行过的**迁移按顺序执行到远程数据库。

---

## 若只执行 006 迁移（RLS + Realtime）

在 **SQL Editor** 里新建查询，粘贴并运行 `006_conversations_messages_rls_realtime.sql` 的完整内容即可。  
这样无需安装 CLI，也不依赖 `npx supabase db push`。

---

## 清理重复会话（历史脏数据）

若之前因 Bug 导致同一任务下出现多条会话（例如一条 `acceptor_id=null`、一条 `acceptor_id=接单者`），可在 **SQL Editor** 中执行 **`cleanup_duplicate_conversations.sql`**：

1. 打开 `supabase/cleanup_duplicate_conversations.sql`，复制全部内容。
2. 在 Supabase Dashboard → **SQL Editor** → **New query** 中粘贴并 **Run**。

脚本会：  
- 将重复会话中的消息迁移到保留的那条会话；  
- 按 `(task_id, publisher_id)` 只保留一条会话（优先保留有接单者的）；  
- 删除重复会话行；  
- 可选：把仍为 `acceptor_id=null` 的会话根据接单记录更新为接单者。
