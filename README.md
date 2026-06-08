# ML Algorithm Learning

> Demo Link: https://ml-algorithm-learning.onrender.com/

![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=222222)
![FastAPI](https://img.shields.io/badge/FastAPI-API-009688?logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?logo=python&logoColor=white)
![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=111111)

互動式機器學習演算法學習網站。專案使用 FastAPI 提供十大機器學習演算法資料 API，前端使用 Next.js 製作互動式學習平台，包含搜尋、分類篩選、視覺化卡片、小測驗、程式碼範例與比較表，以及基於 WebSocket 逐字串流的 AI 機器學習助教聊天機器人。

## 專案結構

```text
.
├── backend/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── .env.example
│   ├── components/
│   │   └── AIChatbot.tsx
│   └── pages/
│       ├── index.js
│       └── algorithms/
│           └── [id].js
├── sources/
│   └── interactive_ml_interactive.html
├── render.yaml
└── README.md
```

## 使用技術

- Frontend: Next.js 15, React 18
- Backend: FastAPI, Uvicorn, Pydantic, OpenAI API
- Real-time Communication: HTML5 WebSocket API
- Deployment: Render
- Version Control: Git, GitHub

## 本機執行

### 1. 啟動後端

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API 會在 `http://localhost:8000` 啟動。

可測試的 API：

- `GET /api/algorithms`
- `GET /api/algorithms/{id}`

### 2. 啟動前端

```bash
cd frontend
npm install
npm run dev
```

前端會在 `http://localhost:3000` 啟動。

如果後端不是跑在 `http://localhost:8000`，請建立 `frontend/.env.local`：

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.example.com
```

### 3. AI 助教實作機制與金鑰管理

本平台的 **AI 機器學習助教** 是一個基於 WebSocket 的即時問答系統，設計了高度穩健的「多核心自動故障轉移（Failover）」機制與「防禦性變數清洗」，以確保專案在展示與日常使用時永不斷線。

#### 💡 AI 助教的實作與切換機制
* **實時 WebSocket 通訊**：前後端透過 WebSocket 建立長連線，後端調用大模型 API 取得 `stream` 數據，並將 Token 即時以逐字串流（Typewriter Stream）回傳給前端，達到無延遲的回覆體驗。
* **多核心 API 故障轉移鏈 (Failover)**：
  當學生發送問題時，後端會以**鏈式順序**自動偵測並嘗試連接以下配置的金鑰：
  $$\text{Gemini 3.5 Flash} \longrightarrow \text{Groq Llama 3} \longrightarrow \text{OpenRouter Free} \longrightarrow \text{OpenAI GPT-4o-mini}$$
  如果鏈條上的某一個 API 連線失敗（如 429 額度耗盡、401 認證錯誤、404 模型停用），系統會自動向網頁端發送提示：`*[系統提示]* {API} 呼叫失敗，正在自動切換備用方案...`，並**立即調用下一個可用 API**，無縫繼續回答問題。
* **終極保險 - 模擬演示模式 (Mock Mode)**：若所有的 API 皆嘗試失敗，或您未設定任何 API Key，系統會自動無縫降級至模擬助教模式。在此模式下，對話框仍可正常發送消息，當提問「過擬合」、「資料洩漏」或「建模流程」等主題時，助教會以模擬串流的打字機效果逐步輸出詳細的思考引導，以便本機展示和排錯。

#### 🔑 金鑰環境變數配置 (`backend/.env` 或 Render 設定)
請在 `backend` 目錄下建立 `.env` 檔案，配置您的金鑰項目（系統會自動清洗金鑰字串，過濾多餘引號或前後空格）：
```env
# 推薦的免費金鑰（請至 Google AI Studio 申請，預設 gemini-3.5-flash）
GEMINI_API_KEY=您的_Gemini_API_Key

# 備用免費金鑰 A（推論極速，請至 Groq Console 申請，預設 llama3-8b-8192）
GROQ_API_KEY=您的_Groq_API_Key

# 備用免費金鑰 B（請至 OpenRouter 申請）
# 系統預設呼叫 `openrouter/free` 動態免費大模型路由
# ⚠️ 注意：由於使用免費額度，此通道在尖峰時段可能會有延遲或速率限制
OPENROUTER_API_KEY=您的_OpenRouter_API_Key

# 備用付費金鑰（請至 OpenAI 申請，GPT-4o-mini）
OPENAI_API_KEY=您的_OpenAI_API_Key
```

---

## 📈 開發紀錄與工作報告

在本次開發優化過程中，我們針對 API 故障、金鑰格式防錯、多核心備援等進行了深入的架構改造。詳細日誌與技術文件請參考：
* 📄 **[開發指令與 Git 紀錄](docs/log.md)**
* 📄 **[故障診斷與架構優化工作報告](docs/工作報告.md)**


## Render 部署設定

這個專案是 monorepo，`backend` 和 `frontend` 需要在 Render 建成兩個 Web Service。

### 後端 Web Service

- Service Type: `Web Service`
- Runtime: `Python`
- Root Directory: `backend`
- Build Command:

```bash
pip install -r requirements.txt
```

- Start Command:

```bash
gunicorn main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
```

- Environment Variables:

```bash
OPENAI_API_KEY=your-openai-api-key-here
```

Render 的 Web Service 必須綁定 `0.0.0.0`，並建議使用 Render 提供的 `$PORT`。後端使用 Gunicorn 啟動，並透過 Uvicorn worker 執行 FastAPI。

### 前端 Web Service

- Service Type: `Web Service`
- Runtime: `Node`
- Root Directory: `frontend`
- Build Command:

```bash
npm install && npm run build
```

- Start Command:

```bash
npm start
```

- Environment Variables:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-service.onrender.com
NEXT_PUBLIC_WS_URL=wss://your-backend-service.onrender.com/ws/ai-chat
```

`NEXT_PUBLIC_API_BASE_URL` 必須設定成 Render 後端服務的正式網址。`NEXT_PUBLIC_WS_URL` 為 WebSocket 的連線網址（請使用 `wss://` 安全協定）。Next.js 的 `NEXT_PUBLIC_` 變數會在 build 時寫入前端 bundle，所以部署前端前要先設定好這個值。

### 建議部署順序

1. 先部署後端 Web Service。
2. 後端部署完成後，複製後端的 Render URL，例如 `https://ml-algorithm-api.onrender.com`。
3. 建立前端 Web Service。
4. 在前端 Environment Variables 設定 `NEXT_PUBLIC_API_BASE_URL`。
5. 部署前端。
6. 前端部署完成後，把 README 開頭的 Demo Link 換成前端 Render URL。

### 使用 render.yaml

此專案已提供 `render.yaml`。你可以在 Render 使用 Blueprint 建立服務，再到前端服務補上 `NEXT_PUBLIC_API_BASE_URL`。

## GitHub 注意事項

- 不要上傳 `node_modules`、`.next`、Python 虛擬環境、`__pycache__` 或本機 log。
- 建議保留 `frontend/package-lock.json`，讓部署環境安裝到一致版本。
- `sources/interactive_ml_interactive.html` 是參考素材；正式前端已改成 React/Next.js 實作。
