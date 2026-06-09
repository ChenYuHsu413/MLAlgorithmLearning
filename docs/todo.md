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

## Phase 5 — Interactive Algorithm Labs（仿線性迴歸實驗室）

為剩餘 9 個演算法各建立互動模擬實驗室，仿照 `LinearRegressionLab.jsx` 的架構：
後端新增 API 端點生成玩具資料並執行演算法，前端以滑桿控制超參數，SVG 即時顯示結果。

**建議順序：先易後難**

### 5-1. 簡單（散佈圖 + 分類邊界 / 群組）

- [ ] **邏輯迴歸實驗室（LogisticRegressionLab）**
  - 後端：生成二元分類資料，回傳決策邊界座標
  - 前端：散佈圖 + 可調決策閾值滑桿 + 邊界線
  - 新增端點：`POST /api/simulate-logistic-regression`

- [ ] **KNN 實驗室（KNNLab）**
  - 後端：生成分類資料，回傳 K 個最近鄰的座標與預測結果
  - 前端：散佈圖 + K 滑桿 + 高亮最近鄰 + 分類區域色塊
  - 新增端點：`POST /api/simulate-knn`

- [ ] **K-Means 實驗室（KMeansLab）**
  - 後端：生成 blob 資料，回傳各點群組標籤 + 群中心座標（逐輪或最終）
  - 前端：散佈圖 + K 滑桿 + 群中心標記 + 顏色分群
  - 新增端點：`POST /api/simulate-kmeans`

- [ ] **樸素貝葉斯實驗室（NaiveBayesLab）**
  - 後端：生成二元分類資料，回傳每個類別的 Gaussian 分布參數（μ, σ）
  - 前端：兩條高斯曲線 SVG + 可調先驗機率滑桿 + 決策點標示
  - 新增端點：`POST /api/simulate-naive-bayes`

### 5-2. 中等（需要額外視覺設計）

- [ ] **SVM 實驗室（SVMLab）**
  - 後端：回傳決策邊界 + 支持向量座標 + margin 寬度
  - 前端：散佈圖 + C 滑桿 + 邊界線 + margin 帶狀區域 + 支持向量標示
  - 新增端點：`POST /api/simulate-svm`

- [ ] **隨機森林實驗室（RandomForestLab）**
  - 後端：回傳 accuracy vs n_estimators 曲線資料 + 特徵重要度
  - 前端：折線圖（準確率趨勢）+ 特徵重要度橫條圖 + n_estimators 滑桿
  - 新增端點：`POST /api/simulate-random-forest`

- [ ] **PCA 實驗室（PCALab）**
  - 後端：生成高維資料，回傳 2D 投影座標 + 各主成分解釋變異
  - 前端：原始資料 vs 投影後散佈圖 + n_components 滑桿 + 解釋變異長條圖
  - 新增端點：`POST /api/simulate-pca`

### 5-3. 複雜（需客製化視覺化）

- [ ] **決策樹實驗室（DecisionTreeLab）**
  - 後端：回傳 2D 特徵空間的分割區域（矩形邊界）+ 各區域預測類別
  - 前端：2D 特徵空間色塊（partition grid）+ max_depth 滑桿
  - 新增端點：`POST /api/simulate-decision-tree`

- [ ] **神經網路實驗室（NeuralNetworkLab）**
  - 後端：MLPClassifier 訓練，回傳每個 epoch 的 loss / accuracy + 最終 2D 決策邊界
  - 前端：loss 曲線折線圖 + 2D 決策邊界散佈圖 + hidden_size 滑桿
  - 新增端點：`POST /api/simulate-neural-network`

---

## Notes

- **Priority order:** Phase 1 → Phase 2 → Phase 3 → Phase 4
- Phase 2 has the highest impact on the core goal: helping visitors "really learn ML"
- Phase 4's real code execution is the most technically complex but also the most impressive feature
- Phase 5 builds on Phase 4's `/api/run-code` pattern; start with 5-1 (easy) before 5-2 and 5-3
