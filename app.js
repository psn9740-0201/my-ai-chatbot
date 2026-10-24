import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json({ limit: "1mb" }));

const MODEL = "gpt-4o-mini";
const MAX_HISTORY = 20; // 모델에 보낼 최근 대화 메시지 수
const MAX_CONTENT_LENGTH = 4000; // 메시지 하나의 최대 글자 수
const SYSTEM_PROMPT =
  "당신은 친절하고 정확한 AI 어시스턴트입니다. 이전 대화 맥락을 기억하고 반영해서, 한국어로 간결하고 명확하게 답변하세요.";

let client;
function getClient() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

// 클라이언트가 보낸 대화 기록에서 유효한 user/assistant 메시지만 남긴다.
function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim() !== ""
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CONTENT_LENGTH) }))
    .slice(-MAX_HISTORY);
}

app.post("/api/chat", async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "서버에 OPENAI_API_KEY가 설정되지 않았습니다." });
  }

  const messages = sanitizeMessages(req.body?.messages);
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return res.status(400).json({ error: "마지막 메시지는 사용자 메시지여야 합니다." });
  }

  try {
    const completion = await getClient().chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.7,
    });
    const reply = completion.choices[0]?.message?.content ?? "";
    res.json({ reply });
  } catch (err) {
    console.error("OpenAI API 오류:", err);
    const status = err.status && err.status < 500 ? err.status : 502;
    res.status(status).json({ error: "AI 응답을 가져오는 중 오류가 발생했습니다." });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

export default app;
