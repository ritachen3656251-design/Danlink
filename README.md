# 旦Link · DanLink

<div align="center">

**校园任务与互助平台 · 连接复旦，共享生活**

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e?logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)

</div>

---

## 项目截图

<!-- 将项目运行后截图保存为 docs/screenshot.png 即可在此展示 -->
<div align="center">

| 广场 | 聊天 | 我的 |
|:---:|:---:|:---:|
| *广场任务列表* | *任务聊天与状态* | *个人中心* |

*（可将 `docs/screenshot.png` 放在仓库中，替换上方占位或使用多张截图）*

</div>

---

## 功能概览

- **广场**：浏览任务（外卖 / 跑腿 / 辅导 / 二手），点击「查看更多」分页加载
- **接单与聊天**：滑动接单 → 会话内沟通 → 送达 → 线下支付确认 → 确认收款
- **消息**：实时消息、未读红点、会话列表
- **注册 / 登录**：学号 + 密码，支持学院、届数、头像选择
- **发布任务**：选择类型、填写起终点与描述，直接发布

技术栈：React 18、Vite、TypeScript、Supabase（Auth / Database / Realtime）、Tailwind CSS。

---

## 快速开始

**环境要求：** Node.js 18+

```bash
# 安装依赖
npm install

# 本地开发
npm run dev
```

浏览器访问 **http://localhost:5173**（Vite 默认端口）。

### 环境变量（可选）

- Supabase：在项目中使用 `lib/supabase.ts` 前，需在 Supabase 控制台创建项目，并将 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY` 配置到 `.env.local`（该文件已加入 `.gitignore`，不会提交）。

### Windows 下 npm 无法运行？

若 PowerShell 报「禁止运行脚本」或「无法识别 npm」，可：

- **方式一**：以管理员身份打开 PowerShell，执行  
  `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`  
  输入 `Y` 后重开终端再执行 `npm run dev`。
- **方式二**：使用 **CMD**（Win + R → 输入 `cmd`），在项目目录执行 `npm install` 与 `npm run dev`。

更多说明见 [如何运行项目.md](./如何运行项目.md)。

---

## 项目结构（简要）

```
├── App.tsx                 # 路由与布局
├── index.tsx / index.html  # 入口
├── components/             # 公共组件（如 BottomNav）
├── context/                # 全局状态（如 NotificationContext）
├── lib/                    # Supabase、会话、类型等
├── screens/                # 页面（广场、聊天、登录、个人等）
├── supabase/
│   ├── migrations/        # 数据库迁移（001–015）
│   ├── *.sql              # 清理、填充、去重等脚本
│   └── README_SCHEMA.md   # 表结构说明
└── 如何运行项目.md         # 本地运行与排错
```

---

## 仓库说明

- **主分支：** `main`
- 数据库变更请按顺序执行 `supabase/migrations/` 下 SQL；业务数据清理与测试数据脚本见 `supabase/*.sql`。

---

<div align="center">

**旦Link** · 复旦校园互助 · 基于 React + Supabase

</div>
