// 로컬 개발용 서버: 정적 파일(public) 제공 + API 실행
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import app from "./app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`챗봇 서버 실행 중: http://localhost:${PORT}`);
});
