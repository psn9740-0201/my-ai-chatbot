# AI 챗봇 (Express + OpenAI gpt-4o-mini)

HTML/CSS/JavaScript 프론트엔드와 Node.js/Express 백엔드로 만든 간단한 AI 챗봇입니다.
데이터베이스 없이 대화 기록을 브라우저(localStorage)에 저장하고, 매 요청마다 이전 대화를 함께 보내서 맥락을 반영한 답변을 받습니다.

## 폴더 구조

```
├── app.js             # Express 앱 (POST /api/chat). Vercel이 자동으로 인식하는 진입점
├── public/            # 프론트엔드 (Vercel에서는 CDN이 정적 파일로 제공)
│   ├── index.html
│   ├── style.css
│   └── script.js
├── .env               # OPENAI_API_KEY 저장 (GitHub에 올라가지 않음)
└── package.json
```

> `app.js`는 `export default app`으로 앱을 내보냅니다. Vercel은 이 파일을 Express 앱으로 자동 인식해 하나의 함수로 배포합니다.
> Vercel에서는 `/` 요청이 Express로 오기 때문에 `app.js`에서 `GET /`을 직접 처리해 `index.html`을 보내 줍니다.
> 로컬에서만 `express.static`과 `app.listen`이 동작하고, Vercel(`VERCEL` 환경 변수가 있을 때)에서는 `public/` 폴더를 CDN이 직접 제공합니다.

## 로컬에서 실행하기

```bash
npm install
# 프로젝트 폴더에 .env 파일을 만들고 OPENAI_API_KEY=본인_키 입력
npm start                # http://localhost:3000
```

## Vercel에 배포하기

1. 이 폴더를 GitHub 저장소에 올립니다. (`.env`는 `.gitignore`에 포함되어 올라가지 않습니다)
2. [Vercel](https://vercel.com)에서 **Add New → Project**로 저장소를 가져옵니다.
3. **Environment Variables**에 `OPENAI_API_KEY`를 추가합니다.
4. Framework Preset이 **Express**로 자동 선택되었는지 확인하고 **Deploy**를 누르면 끝!

또는 CLI로: `npx vercel` → 대시보드에서 환경 변수 추가 → `npx vercel --prod`

## 동작 방식

- 사용자가 메시지를 보내면 지금까지의 대화 전체(`messages`)를 `/api/chat`으로 전송합니다.
- 서버는 최근 20개 메시지만 골라 시스템 프롬프트와 함께 gpt-4o-mini에 보내고, 답변을 돌려줍니다.
- 서버는 상태를 저장하지 않으므로(stateless) 서버리스 환경인 Vercel에 적합합니다.
- **새 대화** 버튼으로 기록을 초기화할 수 있습니다.
