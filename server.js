import "dotenv/config";
import express from "express";
import {
  buildDailySummary,
  buildDreamInsights,
  normalizeEvent,
  scheduleReminder,
  segmentTasks
} from "./src/memora-engine.js";
import { chatWithNewapi } from "./src/newapi-client.js";
import { readDb, withDb } from "./src/storage.js";

const app = express();
const port = Number(process.env.PORT || 3000);

const apiKey = process.env.NEWAPI_API_KEY;
const baseUrl = process.env.NEWAPI_BASE_URL;
const model = process.env.NEWAPI_MODEL || "gpt-4o-mini";

app.use(express.json({ limit: "2mb" }));
app.use(express.static("web"));

app.get("/api/health", async (_req, res) => {
  const stats = await readDb((db) => ({
    events: db.behaviorEvents.length,
    episodicMemories: db.episodicMemories.length,
    dailySummaries: db.dailySummaries.length,
    reminders: db.reminders.length
  }));

  return res.json({ ok: true, now: new Date().toISOString(), stats });
});

app.post("/api/chat", async (req, res) => {
  const prompt = req.body?.prompt?.trim();
  if (!prompt) {
    return res.status(400).json({ error: "prompt 不能为空" });
  }

  if (!apiKey || !baseUrl) {
    return res.status(500).json({ error: "缺少 NEWAPI_API_KEY 或 NEWAPI_BASE_URL 配置" });
  }

  try {
    const reply = await chatWithNewapi({ apiKey, baseUrl, model, prompt });
    return res.json({ reply });
  } catch (error) {
    return res.status(500).json({ error: `服务错误: ${error.message}` });
  }
});

app.post("/api/behavior/events", async (req, res) => {
  const event = normalizeEvent(req.body);

  await withDb((db) => {
    db.behaviorEvents.push(event);

    if (db.behaviorEvents.length > 5000) {
      db.behaviorEvents = db.behaviorEvents.slice(-5000);
    }

    return db.behaviorEvents.length;
  });

  return res.status(201).json({ event });
});

app.get("/api/behavior/events", async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 100), 1000);
  const appName = req.query.app;

  const events = await readDb((db) => {
    let list = [...db.behaviorEvents].sort((a, b) => b.timestamp - a.timestamp);
    if (appName) {
      list = list.filter((item) => item.app === appName);
    }
    return list.slice(0, limit);
  });

  return res.json({ events, count: events.length });
});

app.get("/api/behavior/segments", async (_req, res) => {
  const segments = await readDb((db) => segmentTasks(db.behaviorEvents));
  return res.json({ segments, count: segments.length });
});

app.post("/api/memory/episodic", async (req, res) => {
  const payload = req.body || {};
  const memory = {
    id: crypto.randomUUID(),
    title: payload.title || "未命名事件",
    context: payload.context || "",
    result: payload.result || "",
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    createdAt: new Date().toISOString()
  };

  await withDb((db) => {
    db.episodicMemories.push(memory);
    if (db.episodicMemories.length > 2000) {
      db.episodicMemories = db.episodicMemories.slice(-2000);
    }
  });

  return res.status(201).json({ memory });
});

app.get("/api/memory/episodic", async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 100), 500);
  const memories = await readDb((db) => [...db.episodicMemories].slice(-limit).reverse());
  return res.json({ memories, count: memories.length });
});

app.post("/api/loops/daily", async (_req, res) => {
  const summary = await withDb((db) => {
    const output = buildDailySummary(db.behaviorEvents);
    db.dailySummaries.push(output);
    db.longTermPatterns = db.dailySummaries.slice(-30);
    return output;
  });

  return res.json({ summary });
});

app.post("/api/loops/dream", async (_req, res) => {
  const insight = await readDb((db) => buildDreamInsights(db.dailySummaries));
  return res.json({ insight });
});

app.post("/api/proactive/reminders", async (req, res) => {
  const reminder = scheduleReminder(req.body || {});
  await withDb((db) => {
    db.reminders.push(reminder);
  });
  return res.status(201).json({ reminder });
});

app.get("/api/proactive/reminders", async (_req, res) => {
  const reminders = await readDb((db) => [...db.reminders].reverse());
  return res.json({ reminders, count: reminders.length });
});

app.post("/api/skills/:name/run", async (req, res) => {
  const skillName = req.params.name;
  const args = req.body?.args || {};

  // 当前阶段提供统一回执，后续可替换为真实工具执行器。
  const execution = {
    id: crypto.randomUUID(),
    skillName,
    args,
    status: "queued",
    queuedAt: new Date().toISOString()
  };

  return res.json({ execution });
});

app.listen(port, () => {
  console.log(`MemoraLoop running at http://localhost:${port}`);
});
