# 開發指令執行紀錄 (Git & Shell Logs)

## 📌 專案 Git 提交歷史紀錄 (Commit History)
以下是本專案截至目前的完整 Git 提交歷史，作為開發軌跡參考：
```text
4d8fcb2 docs: update log.md and 工作報告.md to include quiz answer locking details
e0d7827 fix: ignore quiz answer selections once correct answer is chosen
bf57fb0 docs: add log.md, 工作報告.md and update README.md with AI assistant mechanism and failover architecture
4043587 feat: use openrouter/free model slug and implement auto-fallback failover sequence to simulated mode
b972ba3 fix: sanitize API key input strings and print masked logs for troubleshooting
76852f8 feat: add support for Groq and OpenRouter LLMs as free fallbacks
4605f78 feat: support Google Gemini 3.5 API and update requirements
b46eb16 fix: add websockets dependency for Render ASGI websocket support
a03f533 docs: document AI chatbot integration and environmental setups in README
21efca1 feat: implement AI Machine Learning assistant chatbot with WebSocket streaming
7acb90e fix: resolve CSS scoping issue in MiniChart component using :global selectors
079d8db feat: add custom algorithm-specific visual simulation states for all 10 ML models
05c7ea7 feat: add 5 dynamic visual simulation states to interactive charts
4168c3c style: update homepage hero illustration and fix styling scope
0369e60 Improve homepage interactions and default dark theme
1eba989 Add Render demo link
0ed367d Use Gunicorn for Render backend
f33bb20 Enrich learning content from study report
729cd49 Add scene toggle and implementation examples
6d63528 Add source study report
b97be9c Initial ML algorithm learning app
```

---

本文件紀錄了在此專案的開發與優化過程中，所執行的所有 Git 與系統指令。

## 1. 系統診斷與除錯指令
用於檢查環境變數與埠口佔用狀況：
```powershell
# 檢查環境變數是否包含金鑰 (KEY) 相關設定
Get-ChildItem Env:*KEY*

# 檢查連接埠 8000 的佔用情況與其 Process ID
netstat -ano | findstr 8000

# 獲取 PID 6076 的行程名稱以確認占用埠口之程式
Get-Process -Id 6076

# 列出本機所有處於 LISTENING 狀態的埠口
netstat -ano | findstr LISTENING
```

---

## 2. 第一階段：新增 Google Gemini 3.5 API 與依賴升級
```bash
# 檢查目前 Git 修改狀態
git status

# 查看程式碼變更差異
git diff

# 暫存修改的後端程式碼與套件清單
git add backend/main.py backend/requirements.txt

# 提交變更
git commit -m "feat: support Google Gemini 3.5 API and update requirements"

# 推送至 GitHub 遠端主機
git push
```

---

## 3. 第二階段：新增 Groq 與 OpenRouter 免費模型備援機制
```bash
# 檢查 Git 狀態
git status

# 暫存主程式 main.py
git add backend/main.py

# 提交支援 Groq 與 OpenRouter 雙核心免費備援機制的代碼
git commit -m "feat: add support for Groq and OpenRouter LLMs as free fallbacks"

# 推送至遠端
git push
```

---

## 4. 第三階段：環境變數引號防呆與啟動遮罩日誌
解決在部署環境中（如 Render）因貼上帶引號或多餘空格的金鑰導致 401 認證失敗的防禦性機制：
```bash
# 暫存變更
git add backend/main.py

# 提交金鑰清洗與遮罩日誌輸出功能
git commit -m "fix: sanitize API key input strings and print masked logs for troubleshooting"

# 推送至遠端
git push
```

---

## 5. 第四階段：導入動態免費路由模型與多 API 自動故障轉移
解決 OpenRouter 單一模型下架（404 錯誤），並增加鏈式故障轉移（Failover）至模擬助教的終極保險：
```bash
# 檢查 Git 狀態
git status

# 暫存最終優化的主程式
git add backend/main.py

# 提交：使用 openrouter/free 路由，以及自動鏈式故障轉移與模擬模式降級邏輯
git commit -m "feat: use openrouter/free model slug and implement auto-fallback failover sequence to simulated mode"

# 推送至遠端
git push
```

---

## 6. 第五階段：修正測驗作答狀態鎖定問題
修正當使用者答對之後，再次點擊其他錯誤選項會改變作答狀態的 UI 缺陷：
```bash
# 暫存變更
git add frontend/pages/index.js

# 提交測驗狀態鎖定修復
git commit -m "fix: ignore quiz answer selections once correct answer is chosen"

# 推送至遠端
git push
```

---

## 7. 第六階段（2026-06-08）：全端審查、立即修復與元件拆分重構

### 7.1 使用者指令
```
你好
可以幫我看一下這份專案嗎，先全部看過一次架構
依照你的觀點，你有什麼好的建議或改進嗎？
  以一個全端工程師還有身兼UX/UI設計師的視角去分析
可以幫我把立即跟近期的修改都處理嗎
可以幫我把中長期的第一個也一起處理嗎（index.js 元件拆分）
先幫我把我的指令還有你的回覆都存到log.md裡面，生成工作報告，然後推送到github上面
```

### 7.2 AI 分析重點（全端工程師 + UX/UI 視角）

**立即問題：**
- CORS `allow_origins=["*"]` 開放過廣，有安全風險
- WebSocket 在頁面載入時即建立連線，即使聊天視窗未開啟（資源浪費）
- Quiz 作答進度未持久化，重新整理後全部消失

**近期問題：**
- SVG 動畫無說明文字，使用者看不懂動畫在演示什麼
- AI Provider 切換訊息對一般使用者不友善

**中長期問題：**
- `index.js` 體積 2099 行，難以維護
- 演算法資料分散三處（meta / ALGORITHMS / algorithmReport.js），無單一來源

### 7.3 立即修復：CORS 限縮
```python
# backend/main.py：從 wildcard 改為讀取環境變數
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(CORSMiddleware, allow_origins=allowed_origins, ...)
```
```yaml
# render.yaml：新增 ALLOWED_ORIGINS 欄位（部署時填入前端實際網域）
envVars:
  - key: ALLOWED_ORIGINS
    sync: false
```

### 7.4 近期修復：WebSocket Lazy Connect
```typescript
// AIChatbot.tsx：移除頁面載入即連線，改為用戶第一次開啟 chatbot 才連線
useEffect(() => {
  if (!isOpen) return;  // ← 新增這個 guard
  const ws = socketRef.current;
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
  connectWS();
}, [isOpen]);
```

### 7.5 近期修復：Quiz 進度 localStorage 持久化
```javascript
// frontend/pages/index.js
const [answers, setAnswers] = useState(() => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = window.localStorage.getItem('ml-quiz-answers');
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
});

useEffect(() => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('ml-quiz-answers', JSON.stringify(answers));
}, [answers]);
```

### 7.6 近期修復：SVG 動畫說明文字
```javascript
// 新增 animationDescriptions 物件，每個演算法 5 個幀各有說明
// 在視覺化面板顯示「步驟 N/5 + 說明文字」
{animationDescriptions[active.id] && (
  <p className="animDesc">
    <span className="animStep">步驟 {(simulationRun % 5) + 1}/5</span>
    {animationDescriptions[active.id][simulationRun % 5]}
  </p>
)}
```

### 7.7 中長期重構：index.js 元件拆分（2099 行 → 950 行）

**新建檔案：**
```bash
# 資料層
frontend/lib/algorithmData.js        # meta、animationDescriptions、implementationExamples 等

# 元件層
frontend/components/MiniChart.jsx        # SVG 互動動畫元件
frontend/components/HeroIllustration.jsx # Hero 區塊插圖
frontend/components/VisualPanel.jsx      # 互動式視覺化面板
frontend/components/CodePanel.jsx        # 實作範例面板
frontend/components/QuizPanel.jsx        # 小測驗面板
frontend/components/DetailModal.jsx      # 演算法完整說明 Modal
```

**Git 提交指令：**
```bash
git add backend/main.py render.yaml
git add frontend/components/AIChatbot.tsx
git add frontend/pages/index.js
git add frontend/lib/algorithmData.js
git add frontend/components/MiniChart.jsx
git add frontend/components/HeroIllustration.jsx
git add frontend/components/VisualPanel.jsx
git add frontend/components/CodePanel.jsx
git add frontend/components/QuizPanel.jsx
git add frontend/components/DetailModal.jsx
git add docs/log.md docs/工作報告.md

git commit -m "refactor: split index.js into components, fix CORS/WS/quiz persistence, add animation descriptions"

git push
```
