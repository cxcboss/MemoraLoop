# MemoraLoop

MemoraLoop 是一个面向个人智能管理的原型系统，目标是实现“持续观察 → 理解意图 → 记忆沉淀 → 推理规划 → 主动执行 → 反思优化”的闭环。

本仓库提供：

- **OpenClaw 风格参考的简约 UI**（采用 Google Material Design 3 配色与组件语义）
- **面向 Memora 架构的可视化工作台**（实时循环、日循环、梦境循环）
- **`newapi` 大模型接入示例**（OpenAI 兼容 API，最小配置）
- **后端核心能力骨架**（行为记录器、记忆接口、时间循环、主动提醒、技能执行入口）

## 快速启动

```bash
npm install
npm run dev
```

默认访问：`http://localhost:3000`

## 环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

仅需配置三项：

- `NEWAPI_API_KEY`：你的 newapi 密钥
- `NEWAPI_BASE_URL`：newapi OpenAI 兼容地址
- `NEWAPI_MODEL`：模型名称

## 后端 API（v0 原型）

### 系统
- `GET /api/health`：系统状态与数据统计

### 大模型
- `POST /api/chat`
  - body: `{ "prompt": "..." }`

### 行为记录器（Perception）
- `POST /api/behavior/events`
  - body: `{ source, app, action, detail, tags, timestamp }`
- `GET /api/behavior/events?limit=100&app=Chrome`
- `GET /api/behavior/segments`

### 记忆系统（Memory）
- `POST /api/memory/episodic`
  - body: `{ title, context, result, tags }`
- `GET /api/memory/episodic?limit=100`

### 时间循环（Time Engine）
- `POST /api/loops/daily`：生成每日总结
- `POST /api/loops/dream`：生成梦境洞察

### 主动系统（Proactive）
- `POST /api/proactive/reminders`
  - body: `{ title, rule, note, enabled }`
- `GET /api/proactive/reminders`

### 技能系统（Skill）
- `POST /api/skills/:name/run`
  - body: `{ args: {...} }`

## 数据落盘

运行后将自动生成：

- `data/memora-db.json`

用于保存行为事件、情节记忆、每日总结与提醒。

## 目录结构

```text
.
├── data/
├── docs/
│   └── architecture.md
├── src/
│   ├── memora-engine.js
│   ├── newapi-client.js
│   └── storage.js
├── web/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── server.js
├── package.json
└── .env.example
```

## 参考项目

- Hermes Agent: https://github.com/NousResearch/hermes-agent.git
- OpenClaw: https://github.com/openclaw/openclaw.git
- Work_Review: https://github.com/wm94i/Work_Review.git
