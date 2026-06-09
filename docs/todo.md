# ML Learning Platform — To-Do List

Generated: 2026-06-09

---

## Phase 1 — Cleanup (Quick Wins) ✅ DONE

- [x] Delete `backend-server.err.log` (root level, local dev artifact)
- [x] Delete `backend-server.log` (root level, local dev artifact)
- [x] Delete `frontend-server.err.log` (root level, local dev artifact)
- [x] Delete `frontend-server.log` (root level, local dev artifact)
- [x] Delete `sources/interactive_ml_interactive.html` (old 2MB prototype, fully replaced)
- [x] Add `*.log` pattern to `.gitignore` — already present (no change needed)

---

## Phase 2 — Educational Improvements ✅ DONE

### 2-1. Expand Quiz System
- [x] Add 3 questions per algorithm (was 1)
- [x] Progressive difficulty (easy → medium → hard)
- [x] Show explanation for wrong answers — "Here's why that's wrong"
- [x] Show explanation for correct answers — reinforce the concept
- [x] Add a "重新測驗" (Retry Quiz) button after completing all questions
- [x] Progress dots at bottom of quiz panel (green = correct, red = wrong)
- [x] Navigate between questions freely via dots

### 2-2. Annotate Visualizations
- [x] Step labels already present — expanded animation descriptions are educational
- [x] Chart legend added below each animation (explains colors/shapes/lines)
- [x] Math formula box added below legend (key formula + plain-language description)

### 2-3. Add a Learning Path
- [x] Recommended study order section added above algorithm cards (入門 → 中階 → 進階)
- [x] Difficulty badge (入門/中階/進階) shown on each algorithm card
- [x] "Next Algorithm →" button after the lab grid guides progression

### 2-4. Add Math Foundations
- [x] `mathFormulas` data added for all 10 algorithms in `algorithmData.js`
- [x] Displayed in VisualPanel with formula name, symbolic formula, and plain description

---

## Phase 3 — UX / UI Improvements ✅ DONE

### 3-1. Onboarding for First-Time Visitors
- [x] Add a "How to use this platform" tooltip/walkthrough on first visit
- [x] Briefly explain the 3-panel layout (Visualization | Code | Quiz)
- [x] Save "onboarding seen" flag to localStorage so it only shows once

### 3-2. Algorithm Relationship Map
- [x] Create a visual diagram showing how algorithms relate
  - e.g., Random Forest builds on Decision Tree; Logistic Regression is classification variant of Linear Regression
- [x] Place it on the homepage below the algorithm cards
- [x] Make nodes clickable to jump to that algorithm

### 3-3. Progress Tracking Dashboard
- [x] Show "X / 10 algorithms studied" with a progress bar
- [x] Show per-algorithm quiz score history
- [x] Add a "Reset Progress" button (clears localStorage)
- [ ] Optionally show estimated learning time remaining (skipped — optional)

### 3-4. Enhance Individual Algorithm Pages (`/algorithms/[id]`)
- [x] Currently these pages are thin fallbacks — turn them into full deep-dive pages
- [x] Add full visualization, extended quiz (3–5 questions), and code examples
- [x] Make pages shareable and bookmarkable (good for students sending links)
- [x] Add proper SEO meta tags (title, description) per algorithm page

---

## Phase 4 — Technical Improvements

### 4-1. Real Code Execution ✅ DONE
- [x] Add a backend endpoint (e.g., `POST /api/run-code`) that runs scikit-learn on toy datasets
- [x] Replace the fake hardcoded mock output in CodePanel with real execution results
- [x] Show actual model accuracy, predictions, and timing in the output panel
- [x] Add input parameters the user can tweak before running (e.g., n_neighbors for KNN)

### 4-2. CORS Security ✅ DONE
- [x] Restrict `allow_origins` in `backend/main.py` from `["*"]` to the actual frontend domain
- [x] Use environment variable for the allowed origin (already have `ALLOWED_ORIGINS` in render.yaml)

### 4-3. Loading States ✅ DONE
- [x] Add skeleton loading cards while algorithm data is fetching from the backend
- [x] Add a spinner or placeholder in the visualization panel on initial load
- [x] Handle API-down / cold start state gracefully — spinner while loading, cloud icon + auto-retry every 10s when backend is warming up (Render free tier)

---

## Phase 5 — Interactive Algorithm Labs ✅ DONE

### 5-1. 簡單（散佈圖 + 分類邊界 / 群組）

- [x] **邏輯迴歸實驗室（LogisticRegressionLab，id=1）** — 門檻值滑桿 + 即時混淆矩陣
- [x] **KNN 實驗室（KNNLab，id=5）** — 26×26 客戶端決策網格 + K 滑桿 + 最近鄰連線
- [x] **K-Means 實驗室（KMeansLab，id=7）** — K 滑桿 + ✕ 群心 + Silhouette Score
- [x] **樸素貝葉斯實驗室（NaiveBayesLab，id=6）** — 高斯曲線 + Prior 滑桿移動邊界

### 5-2. 中等（需要額外視覺設計）

- [x] **SVM 實驗室（SVMLab，id=4）** — C 預設按鈕 + margin band + 支援向量高亮
- [x] **隨機森林實驗室（RandomForestLab，id=3）** — 準確率曲線 + Top-5 特徵重要性
- [x] **PCA 實驗室（PCALab，id=8）** — PC1/PC2 散點 + EVR 長條圖 + n_components 滑桿

### 5-3. 複雜（需客製化視覺化）

- [x] **決策樹實驗室（DecisionTreeLab，id=2）** — SVG 互動樹狀圖 + hover tooltip
- [x] **神經網路實驗室（NeuralNetworkLab，id=9）** — 30×30 熱圖邊界 + 架構 SVG 圖

---

## Phase 6 — Bug Fixes（Code Review 發現）

從 Phase 5 的 7 角度程式碼審查確認以下問題，尚待修復：

- [ ] **🔴 `recurse()` 葉節點偵測錯誤**（`backend/main.py`）
  - 改 `node == _tree.TREE_LEAF` → `tree.children_left[node] == _tree.TREE_LEAF`
  - 影響：決策樹 SVG 圖所有葉節點顯示錯誤的類別/樣本數/Gini

- [ ] **🔴 `flattenTree` 節點重疊**（`frontend/components/DecisionTreeLab.jsx`）
  - 深度 ≥ 2 即重疊（30px 間距 < 36px 直徑），深度 8 僅 0.47px
  - 需改用後序賦值算法，保證最小間距 ≥ 2×NODE_R

- [ ] **🟡 5 個新實驗室缺少 error state**（SVMLab、DecisionTreeLab、NeuralNetworkLab、RandomForestLab、PCALab）
  - 參照 KMeansLab 模式：加 `catch` block、`error` state、錯誤訊息顯示

- [ ] **🟡 決策樹 tooltip z-order 問題**（`frontend/components/DecisionTreeLab.jsx`）
  - tooltip 渲染在節點 `<g>` 內部，被後繪子節點遮蓋
  - 修法：將 active tooltip 移至 SVG 頂層 `<g>`（最後渲染）

- [ ] **🟡 NeuralNetworkLab 競態條件**（`frontend/components/NeuralNetworkLab.jsx`）
  - 預設按鈕缺少 `disabled={loading}` 守衛，快速點擊產生亂序回應
  - 加 `disabled={loading}` 或 AbortController

- [ ] **🟢 `simulate_random_forest` 冗餘模型**（`backend/main.py`）
  - 移除第 12 個 n=200 模型，直接從迴圈最後一個 `m` 提取 `importances`

---

## Notes

- **Priority order:** Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
- Phase 6 bug fixes ranked: 🔴 = 影響展示正確性（優先）、🟡 = 影響使用體驗、🟢 = 效能/維護性
