function toIsoTime(ts = Date.now()) {
  return new Date(ts).toISOString();
}

export function normalizeEvent(payload = {}) {
  const source = payload.source || "unknown";
  const app = payload.app || "unknown";
  const action = payload.action || "unspecified";
  const detail = payload.detail || "";
  const timestamp = payload.timestamp ? new Date(payload.timestamp).getTime() : Date.now();

  return {
    id: crypto.randomUUID(),
    source,
    app,
    action,
    detail,
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
    createdAt: toIsoTime()
  };
}

export function segmentTasks(events) {
  if (!events.length) return [];

  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const segments = [];
  let current = { id: crypto.randomUUID(), events: [sorted[0]] };

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const item = sorted[i];
    const gap = item.timestamp - prev.timestamp;
    const shouldSplit = gap > 10 * 60 * 1000 || item.app !== prev.app;

    if (shouldSplit) {
      segments.push(current);
      current = { id: crypto.randomUUID(), events: [item] };
    } else {
      current.events.push(item);
    }
  }

  segments.push(current);

  return segments.map((segment) => {
    const first = segment.events[0];
    const last = segment.events.at(-1);
    return {
      id: segment.id,
      app: first.app,
      startAt: toIsoTime(first.timestamp),
      endAt: toIsoTime(last.timestamp),
      eventCount: segment.events.length,
      inferredIntent: inferIntent(segment.events)
    };
  });
}

export function inferIntent(events) {
  const text = events.map((item) => `${item.action} ${item.detail}`.toLowerCase()).join(" ");

  if (/(search|read|doc|学习|文档|教程)/.test(text)) return "学习研究";
  if (/(code|commit|test|debug|编码|开发)/.test(text)) return "开发实现";
  if (/(chat|mail|message|会议|沟通)/.test(text)) return "沟通协作";
  return "常规操作";
}

export function buildDailySummary(events, date = new Date()) {
  const day = new Date(date);
  const start = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate())).getTime();
  const end = start + 24 * 60 * 60 * 1000;

  const todayEvents = events.filter((item) => item.timestamp >= start && item.timestamp < end);
  const byApp = Object.groupBy(todayEvents, (event) => event.app);

  const appUsage = Object.entries(byApp).map(([app, list]) => ({ app, count: list.length }));
  appUsage.sort((a, b) => b.count - a.count);

  return {
    id: crypto.randomUUID(),
    date: new Date(start).toISOString().slice(0, 10),
    totalEvents: todayEvents.length,
    topApps: appUsage.slice(0, 5),
    segments: segmentTasks(todayEvents),
    createdAt: toIsoTime()
  };
}

export function buildDreamInsights(dailySummaries) {
  const latest = dailySummaries.slice(-7);
  if (!latest.length) {
    return {
      periodDays: 0,
      pattern: "暂无数据",
      suggestions: ["先接入行为记录器，积累至少 1 天数据。"]
    };
  }

  const totalEvents = latest.reduce((sum, item) => sum + item.totalEvents, 0);
  const avgEvents = Math.round(totalEvents / latest.length);
  const topApp = latest
    .flatMap((item) => item.topApps)
    .reduce((acc, curr) => {
      acc[curr.app] = (acc[curr.app] || 0) + curr.count;
      return acc;
    }, {});

  const ranked = Object.entries(topApp)
    .map(([app, count]) => ({ app, count }))
    .sort((a, b) => b.count - a.count);

  return {
    periodDays: latest.length,
    pattern: `近 ${latest.length} 天平均事件数 ${avgEvents}`,
    dominantApp: ranked[0]?.app || "unknown",
    suggestions: [
      "将高频应用场景抽象为 Skill，减少重复操作。",
      "在 Daily Loop 中对低价值操作设置自动提醒。"
    ]
  };
}

export function scheduleReminder(input = {}) {
  return {
    id: crypto.randomUUID(),
    title: input.title || "未命名提醒",
    rule: input.rule || "daily@09:00",
    note: input.note || "",
    enabled: input.enabled ?? true,
    createdAt: toIsoTime()
  };
}
