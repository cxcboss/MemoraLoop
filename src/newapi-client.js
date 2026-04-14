export async function chatWithNewapi({ apiKey, baseUrl, model, prompt }) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "你是 Memora 的认知中枢，输出简洁、可执行、可追踪的建议，优先结构化表达。"
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "newapi 请求失败");
  }

  return data?.choices?.[0]?.message?.content || "模型未返回内容";
}
