# 開發指令執行紀錄 (Git & Shell Logs)

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
