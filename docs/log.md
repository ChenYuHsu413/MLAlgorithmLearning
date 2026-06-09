# 開發指令執行紀錄 (Git & Shell Logs)

## 📌 專案 Git 提交歷史紀錄 (Commit History)
以下是本專案截至目前的完整 Git 提交歷史，作為開發軌跡參考：
```text
a68b939 fix: square chart, cap lab width, yellow outliers for visibility
0732472 fix: shrink chart height and make outliers more visible
14f2e68 feat: redesign linear regression lab as a simulation experiment
1c56021 refactor: replace table inputs with sliders in LinearRegressionLab
faa6043 feat: add real Python linear regression lab with interactive input
4d76ead feat: add Render cold start UX — spinner + warming-up screen with auto-retry
e6dc1d9 feat: Phase 1 & 2 — cleanup and educational improvements
98b2f7e docs: update log.md and 工作報告.md for session 7
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

---

## Session 8 — 2026-06-09｜教育功能大幅擴充 + 線性迴歸互動實驗室

### Phase 1：無用檔案清理
```bash
git rm sources/interactive_ml_interactive.html
git rm backend-server.err.log backend-server.log frontend-server.err.log frontend-server.log
git add .gitignore
git commit -m "feat: Phase 1 & 2 — cleanup and educational improvements"
git push
```

### Phase 2：教育功能改善
- 小測驗由 1 題擴充為每演算法 3 題（難度由易到難）
- 每題加入正確/錯誤說明（explanation）
- 新增進度圓點（答對=綠、答錯=紅）、題目自由導航
- VisualPanel 加入圖表圖例（chartLegend）與數學公式框（mathFormulas）
- 新增推薦學習路徑（入門→中階→進階）、難度徽章、下一演算法按鈕
- 前端儲存格式從 `ml-quiz` 升版為 `ml-quiz-v2`（多題格式）

### Render 冷啟動 UX
```bash
# 修改 frontend/pages/index.js
# - 新增 loading state，初始為 true
# - 新增 retryTimerRef 自動重試每 10 秒
# - loading + 無資料 → 顯示旋轉動畫「平台啟動中」
# - fetch 失敗 → 顯示「後端服務喚醒中，約需 30~60 秒」+ 立即重試按鈕
git add frontend/pages/index.js docs/todo.md
git commit -m "feat: add Render cold start UX — spinner + warming-up screen with auto-retry"
git push
```

### 線性迴歸互動實驗室（第一版 — 滑桿輸入資料點）
```bash
# backend/requirements.txt 新增 scikit-learn, numpy
# backend/main.py 新增 POST /api/run-linear-regression
# frontend/components/LinearRegressionLab.jsx 新建
# frontend/pages/index.js import LinearRegressionLab，於 active.id===0 顯示
git add backend/main.py backend/requirements.txt frontend/components/LinearRegressionLab.jsx frontend/pages/index.js
git commit -m "feat: add real Python linear regression lab with interactive input"
git push
```

### 重構：改為模擬實驗室（第二版）
```bash
# 使用者回饋：希望不是手動輸入資料點，而是透過參數生成模擬資料
# backend/main.py 新增 POST /api/simulate-linear-regression
#   - 接收 n, a, b, var 四個參數
#   - 生成 x ~ Uniform(-100, 100)，y = ax + b + N(0, sqrt(var))
#   - 計算迴歸、殘差、RMSE，回傳 top-10 離群點 indices
# frontend/components/LinearRegressionLab.jsx 全面重寫
#   - 4 個參數滑桿（n, a, b, σ²）+ 即時公式預覽
#   - SVG 散佈圖：灰點資料、藍虛線真實線、紅實線迴歸線、橘色離群點
#   - 統計面板：擬合值 vs 真實值、R²、RMSE
#   - Top-10 離群點排名表
git add backend/main.py frontend/components/LinearRegressionLab.jsx
git commit -m "feat: redesign linear regression lab as a simulation experiment"
git push
```

### UI 修正：縮小圖表 & 離群點可見度
```bash
# 使用者回饋 1：圖表太大遮住輸入欄
# → SVG maxHeight: 300px
# → 離群點 r: 7→10，加外光暈（r=15，18% opacity）
# → 殘差垂線改為實線、加粗，繪製順序移到圓點之前
# → 數字 1-10 印在圓點中央
git commit -m "fix: shrink chart height and make outliers more visible"

# 使用者回饋 2：仍然遮住輸入；圖表改為正方形；離群點顏色更換
# → lrLab max-width: 780px，grid: 300px 420px（固定）
# → SVG viewBox 540×360 → 420×420（正方形）
# → 離群點顏色 orange → bright yellow (#facc15)，深色邊框
git commit -m "fix: square chart, cap lab width, yellow outliers for visibility"
git push
```

## Session 9 — 2026-06-09｜Phase 3 UX 全面升級

### 3-1. 新手導覽（OnboardingModal）
```bash
# frontend/components/OnboardingModal.jsx 已存在但未掛載
# frontend/pages/index.js：新增 import + <OnboardingModal /> 渲染
# localStorage key: ml-onboarding-v1，只在首次訪問顯示
git add frontend/components/OnboardingModal.jsx frontend/pages/index.js
```

### 3-2. 演算法關係圖（AlgorithmRelationshipMap）
```bash
# 新建 frontend/components/AlgorithmRelationshipMap.jsx
# - SVG viewBox 800×395，10 個可點擊節點
# - 3 條帶標籤箭頭：分類變體（LR→LogReg）、單層類比（LogReg→NN）、集成擴展（DTree→RF）
# - 3 個分類列：監督式迴歸、監督式分類、非監督式（含虛線分隔）
# - 節點 hover 效果，onClick → onSelect(id) → startLearning
# frontend/pages/index.js：import + 插入 cardRail 之後
git add frontend/components/AlgorithmRelationshipMap.jsx frontend/pages/index.js
```

### 3-3. 進度重置按鈕
```bash
# frontend/pages/index.js
# - progressHeader 右側新增「重置進度」button，使用 window.confirm 防呆
# - 點擊確認後 setAnswers({})，useEffect 自動同步清除 localStorage ml-quiz-v2
```

### 3-4. 深度演算法頁面（/algorithms/[id]）
```bash
# frontend/pages/algorithms/[id].js 全面重寫（原 83 行 → 270 行）
# - import VisualPanel, CodePanel, QuizPanel, Head (next/head)
# - 引入 implementationExamples, executionResults from algorithmData
# - 完整狀態管理：simulationRun, simulationStatus, codeOutput, answers
# - SEO：<Head> 含 title, description, og:title, og:description, robots
# - 深色/淺色切換，繼承 localStorage ml-learning-scene
# - 測驗答案與首頁共用 localStorage ml-quiz-v2
# - 完整報告 section：優缺點、指標、陷阱、建模流程、實作練習
```

### 統一提交
```bash
git add frontend/components/AlgorithmRelationshipMap.jsx \
        frontend/components/OnboardingModal.jsx \
        frontend/pages/algorithms/[id].js \
        frontend/pages/index.js \
        docs/todo.md

git commit -m "feat: complete Phase 3 UX improvements — onboarding, relationship map, progress reset, deep-dive pages"
git push
# commit: f7d5d26
```

---

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

---

## 8. 第七階段（2026-06-08）：演算法資料統一來源、CORS 部署診斷、進度追蹤實作

### 8.1 使用者指令
```
我們繼續剛才的作業，先來做演算法統一來源
（部署後截圖）我目前把這前後端都部署在 render 上面，但是現在我打開網頁沒辦法正常顯示資料，我有什麼設定要調整嗎
感覺這個實作索引是不是多餘了，另外學習路徑跟進度追蹤都沒有反應，你可以幫我看一眼 sources 裡面那個 pdf 檔案嗎
B（選擇刪實作索引 + 實作真實進度追蹤功能）
你幫我把剛才這些指令寫入 Log 然後更新工作報告
```

### 8.2 演算法資料統一來源

**目標：** 將三份各自維護的資料合併為後端 API 單一來源

| 原始來源 | 欄位 |
| :--- | :--- |
| `backend/main.py` ALGORITHMS | id, name, description, example, advantages, disadvantages |
| `frontend/lib/algorithmData.js` meta | shortName, category, task, level, color, code, concept, bestFor, quiz |
| `frontend/lib/algorithmReport.js` reportInsights | output, core, workflow, metrics, pitfalls, practice |

**新增 Pydantic 模型：**
```python
class QuizItem(BaseModel):
    question: str
    options: List[str]
    correctIndex: int

class Algorithm(BaseModel):
    # 原有欄位
    id: int
    name: str
    description: str
    example: str
    advantages: List[str]
    disadvantages: List[str]
    # 合入 meta
    shortName: str
    category: str
    task: str
    level: str
    color: str
    code: str
    concept: str
    bestFor: str
    quiz: QuizItem
    # 合入 reportInsights
    output: str
    core: str
    workflow: List[str]
    metrics: List[str]
    pitfalls: List[str]
    practice: str
```

**前端清理：**
```javascript
// algorithmData.js：移除 meta 物件，移除 enrich()
// algorithmReport.js：移除 reportInsights，只保留 reportGuide
// index.js：移除 meta / reportInsights import，activeInsight = active
// QuizPanel.jsx：quiz[0/1/2] → quiz.question / quiz.options / quiz.correctIndex
// algorithms/[id].js：直接讀 API 欄位，移除 reportInsights 引用
```

**Git 提交：**
```bash
git add backend/main.py frontend/components/QuizPanel.jsx \
        frontend/lib/algorithmData.js frontend/lib/algorithmReport.js \
        "frontend/pages/algorithms/[id].js" frontend/pages/index.js

git commit -m "refactor: unify algorithm data source — merge meta and reportInsights into backend API"
git push
# commit: 1a4d507
```

### 8.3 Render 部署 CORS 診斷

**問題：** 前端 `https://ml-algorithm-learning.onrender.com` 無法讀取後端 `https://mlalgorithmlearning.onrender.com/api/algorithms`，主控台出現：
```
Access to fetch blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**根因：** 上一階段已將 CORS 從 `*` 改為讀取環境變數 `ALLOWED_ORIGINS`，但 Render 後端服務未設定該變數（預設值只允許 `localhost:3000`）。

**修復方式（Render Dashboard 操作，無需改程式碼）：**
```
後端服務 → Environment → 新增：
  ALLOWED_ORIGINS = https://ml-algorithm-learning.onrender.com

前端服務 → Environment → 確認：
  NEXT_PUBLIC_API_BASE_URL = https://mlalgorithmlearning.onrender.com
  NEXT_PUBLIC_WS_URL       = wss://mlalgorithmlearning.onrender.com/ws/ai-chat
```

### 8.4 PDF 研讀報告檔案審查

**檔案：** `sources/machine_learning_top10_study_report.pdf`（29 頁）

**結論：**
- PDF 的 10 大演算法核心內容（概念、流程、指標、錯誤、練習）**已全部被前幾階段萃取完畢**，目前後端 ALGORITHMS 資料已完整涵蓋。
- 尚未使用的內容：CRISP-DM 建模方法論（p.29）、50 Startups 案例（p.29）、Ridge/Lasso 補充細節（Linear Regression）、Gaussian/Bernoulli Naive Bayes 變體說明。
- 注意：PDF 使用非標準中文字型嵌入方式，`pdfplumber` 無法解碼繁中文字，僅能讀取英文關鍵字。

### 8.5 移除實作索引、實作進度追蹤

**移除：**
- `所有演算法實作索引` section（與上方演算法卡片完全重複，冗餘）
- `學習路徑` 按鈕（空殼 dead button，無任何功能）
- Sidebar `#examples` 錨點連結

**新增：進度追蹤面板**
```jsx
// 進度追蹤按鈕切換 showProgress state
<button className={`progressToggle${showProgress ? ' active' : ''}`}
  onClick={() => setShowProgress(v => !v)}>進度追蹤</button>

// 展開面板：顯示 10 個演算法的測驗狀態
{showProgress && (
  <section className="progressPanel">
    <div className="progressHeader">
      <h3>測驗進度</h3>
      <span>{done} / {algorithms.length} 完成</span>
    </div>
    <div className="progressGrid">
      {algorithms.map((algo) => {
        const status = answers[algo.id];
        return (
          <button className={`progressItem${status === true ? ' done' : status !== undefined ? ' tried' : ''}`}
            onClick={() => { startLearning(algo.id); setShowProgress(false); }}>
            <span className="dot" style={{ background: algo.color }} />
            <span className="pName">{algo.shortName}</span>
            <span className="pBadge">{status === true ? '✓' : status !== undefined ? '✗' : '─'}</span>
          </button>
        );
      })}
    </div>
  </section>
)}
```

**面板說明：**
- 彩色圓點：各演算法識別色
- `✓` 綠色 = 答對；`✗` 紅色 = 答錯過；`─` = 未作答
- 點任何格子 → 跳至該演算法學習區並收合面板
- 按鈕按下時顯示 accent 顏色（active 狀態視覺回饋）

**Git 提交：**
```bash
git add frontend/pages/index.js

git commit -m "feat: replace dead buttons with real progress tracker, remove redundant examples index"
git push
# commit: c8215cf
```
