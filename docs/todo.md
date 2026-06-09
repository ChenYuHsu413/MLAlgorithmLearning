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

## Phase 3 — UX / UI Improvements

### 3-1. Onboarding for First-Time Visitors
- [ ] Add a "How to use this platform" tooltip/walkthrough on first visit
- [ ] Briefly explain the 3-panel layout (Visualization | Code | Quiz)
- [ ] Save "onboarding seen" flag to localStorage so it only shows once

### 3-2. Algorithm Relationship Map
- [ ] Create a visual diagram showing how algorithms relate
  - e.g., Random Forest builds on Decision Tree; Logistic Regression is classification variant of Linear Regression
- [ ] Place it on the homepage below the algorithm cards
- [ ] Make nodes clickable to jump to that algorithm

### 3-3. Progress Tracking Dashboard
- [ ] Show "X / 10 algorithms studied" with a progress bar
- [ ] Show per-algorithm quiz score history
- [ ] Add a "Reset Progress" button (clears localStorage)
- [ ] Optionally show estimated learning time remaining

### 3-4. Enhance Individual Algorithm Pages (`/algorithms/[id]`)
- [ ] Currently these pages are thin fallbacks — turn them into full deep-dive pages
- [ ] Add full visualization, extended quiz (3–5 questions), and code examples
- [ ] Make pages shareable and bookmarkable (good for students sending links)
- [ ] Add proper SEO meta tags (title, description) per algorithm page

---

## Phase 4 — Technical Improvements

### 4-1. Real Code Execution
- [ ] Add a backend endpoint (e.g., `POST /api/run-code`) that runs scikit-learn on toy datasets
- [ ] Replace the fake hardcoded mock output in CodePanel with real execution results
- [ ] Show actual model accuracy, predictions, and timing in the output panel
- [ ] Add input parameters the user can tweak before running (e.g., n_neighbors for KNN)

### 4-2. CORS Security
- [ ] Restrict `allow_origins` in `backend/main.py` from `["*"]` to the actual frontend domain
- [ ] Use environment variable for the allowed origin (already have `ALLOWED_ORIGINS` in render.yaml)

### 4-3. Loading States
- [ ] Add skeleton loading cards while algorithm data is fetching from the backend
- [ ] Add a spinner or placeholder in the visualization panel on initial load
- [x] Handle API-down / cold start state gracefully — spinner while loading, cloud icon + auto-retry every 10s when backend is warming up (Render free tier)

---

## Notes

- **Priority order:** Phase 1 → Phase 2 → Phase 3 → Phase 4
- Phase 2 has the highest impact on the core goal: helping visitors "really learn ML"
- Phase 4's real code execution is the most technically complex but also the most impressive feature
