type RoutePayload = {
  question?: string;
  route?: {
    title?: string;
    estimated?: number;
    pace?: string;
    days?: number;
    itinerary?: Array<{ day: number; title: string; activities: string[] }>;
  };
};

function demoAnswer(question: string, route: RoutePayload["route"]) {
  const routeName = route?.title ?? "当前路线";
  if (/省|便宜|预算/.test(question)) {
    return `${routeName}的主要支出通常在往返交通和住宿。我建议先保留核心景点，把住宿改到交通方便的相邻区域，并减少一次高价正餐。确认后我会同步压缩预算明细。`;
  }
  if (/赶|累|松|少/.test(question)) {
    return `按照当前${route?.pace ?? "均衡"}节奏，第二天的活动密度确实可以再降一点。我建议每天最多保留两个主要活动，中间至少留出两小时机动时间。`;
  }
  if (/天气|下雨|温度/.test(question)) {
    return `公开测试版尚未配置实时搜索，因此我不能可靠确认出发日期的天气。正式接入后会优先读取气象与景区官方信息，并在答案旁标注检索时间。`;
  }
  return `我已结合${routeName}的${route?.days ?? "多"}日安排检查了这个问题。建议替换同一区域内的一个活动，保持住宿和主要交通段不变，这样改动最小，也不容易打乱整条路线。`;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as RoutePayload;
  const question = payload.question?.trim() ?? "";
  if (!question) return Response.json({ answer: "请告诉我你想调整什么。" }, { status: 400 });

  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL;
  const model = process.env.LLM_MODEL;
  if (!apiKey || !baseUrl || !model) {
    return Response.json({ answer: demoAnswer(question, payload.route), sources: ["公开测试版内置路线规则"] });
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: "你是旅游路线助手。只依据给定路线回答；信息不确定时明确说明。提出修改时先说明差异，等待用户确认，不得虚构实时票价、天气或开放状态。用简洁中文回答。",
          },
          { role: "user", content: `当前路线：${JSON.stringify(payload.route)}\n\n用户问题：${question}` },
        ],
      }),
    });
    if (!response.ok) throw new Error(`model request failed: ${response.status}`);
    const result = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const answer = result.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error("empty model response");
    return Response.json({ answer, sources: ["已配置的大模型服务"] });
  } catch {
    return Response.json({ answer: demoAnswer(question, payload.route), sources: ["模型暂不可用，已回退到内置路线规则"] });
  }
}
