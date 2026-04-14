const sections = {
  "系统概览": [
    { title: "感知层", text: "采集系统事件、应用行为、屏幕信息与文件变化。" },
    { title: "行为理解", text: "进行操作序列建模、任务分段与意图识别。" },
    { title: "认知层", text: "执行推理、规划、目标管理与自我反思。" }
  ],
  "记忆系统": [
    { title: "短期记忆", text: "保存分钟级近期行为数据。" },
    { title: "工作记忆", text: "保持当前任务上下文与状态。" },
    { title: "长期/情节记忆", text: "沉淀习惯、知识与可回溯行为事件。" },
    { title: "梦境系统", text: "离线回放、压缩记忆、优化策略。" }
  ],
  "主动与执行": [
    { title: "Action Layer", text: "通过工具系统执行文件、浏览器、API 和系统动作。" },
    { title: "Proactive System", text: "基于行为模式进行预测、提醒和干预。" },
    { title: "Time Engine", text: "实时循环 + 日循环 + 梦境循环形成进化闭环。" }
  ]
};

const nav = document.getElementById("nav");
const sectionTitle = document.getElementById("section-title");
const sectionContent = document.getElementById("section-content");
const form = document.getElementById("chat-form");
const promptInput = document.getElementById("prompt");
const messages = document.getElementById("messages");

function renderSection(name) {
  sectionTitle.textContent = name;
  sectionContent.innerHTML = "";
  sections[name].forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `<h3>${item.title}</h3><p>${item.text}</p>`;
    sectionContent.appendChild(card);
  });
}

Object.keys(sections).forEach((name, index) => {
  const btn = document.createElement("button");
  btn.className = "nav-btn" + (index === 0 ? " active" : "");
  btn.textContent = name;
  btn.onclick = () => {
    document.querySelectorAll(".nav-btn").forEach((it) => it.classList.remove("active"));
    btn.classList.add("active");
    renderSection(name);
  };
  nav.appendChild(btn);
});
renderSection(Object.keys(sections)[0]);

function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const prompt = promptInput.value.trim();
  if (!prompt) return;

  addMessage("user", prompt);
  promptInput.value = "";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "请求失败");

    addMessage("assistant", data.reply);
  } catch (error) {
    addMessage("assistant", `调用失败：${error.message}`);
  }
});
