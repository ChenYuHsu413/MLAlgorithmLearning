# ML Algorithm Learning

> Demo Link: _部署完成後將 Render 網址填在這裡_

![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=222222)
![FastAPI](https://img.shields.io/badge/FastAPI-API-009688?logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?logo=python&logoColor=white)
![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=111111)

互動式機器學習演算法學習網站。專案使用 FastAPI 提供十大機器學習演算法資料 API，前端使用 Next.js 製作互動式學習平台，包含搜尋、分類篩選、視覺化卡片、小測驗、程式碼範例與比較表。

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
- Backend: FastAPI, Uvicorn, Pydantic
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
```

`NEXT_PUBLIC_API_BASE_URL` 必須設定成 Render 後端服務的正式網址。Next.js 的 `NEXT_PUBLIC_` 變數會在 build 時寫入前端 bundle，所以部署前端前要先設定好這個值。

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
