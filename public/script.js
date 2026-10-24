const STORAGE_KEY = "chat-history";

const chatEl = document.getElementById("chat");
const emptyEl = document.getElementById("empty");
const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const resetBtn = document.getElementById("reset-btn");

// 대화 기록: DB 대신 브라우저(localStorage)에 저장하고, 매 요청마다 서버로 함께 보낸다.
let history = loadHistory();

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // 저장 실패(시크릿 모드 등)는 무시: 현재 페이지에서는 계속 동작한다.
  }
}

function addMessage(role, text) {
  emptyEl.hidden = true;
  const el = document.createElement("div");
  el.className = `message ${role}`;
  el.textContent = text;
  chatEl.appendChild(el);
  chatEl.scrollTop = chatEl.scrollHeight;
  return el;
}

function setLoading(isLoading) {
  sendBtn.disabled = isLoading;
  input.disabled = isLoading;
  if (!isLoading) input.focus();
}

async function sendMessage(text) {
  history.push({ role: "user", content: text });
  saveHistory();
  addMessage("user", text);

  const loadingEl = addMessage("assistant loading", "생각 중");
  setLoading(true);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `요청 실패 (${res.status})`);

    loadingEl.remove();
    history.push({ role: "assistant", content: data.reply });
    saveHistory();
    addMessage("assistant", data.reply);
  } catch (err) {
    loadingEl.remove();
    // 실패한 사용자 메시지는 기록에서 빼서 다음 요청의 맥락이 꼬이지 않게 한다.
    history.pop();
    saveHistory();
    addMessage("error", `⚠️ ${err.message}`);
  } finally {
    setLoading(false);
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  autoResize();
  sendMessage(text);
});

// Enter: 전송, Shift+Enter: 줄바꿈 (한글 조합 중에는 전송하지 않음)
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    form.requestSubmit();
  }
});

function autoResize() {
  input.style.height = "auto";
  input.style.height = `${input.scrollHeight}px`;
}
input.addEventListener("input", autoResize);

resetBtn.addEventListener("click", () => {
  if (history.length && !confirm("대화 내용을 모두 지울까요?")) return;
  history = [];
  saveHistory();
  chatEl.querySelectorAll(".message").forEach((el) => el.remove());
  emptyEl.hidden = false;
  input.focus();
});

// 페이지를 새로고침해도 이전 대화를 다시 보여준다.
history.forEach((m) => addMessage(m.role, m.content));
input.focus();
