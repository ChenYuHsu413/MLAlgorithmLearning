import os
import json
import asyncio
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from openai import AsyncOpenAI
import google.generativeai as genai

load_dotenv()

# System Prompt shared by Gemini and OpenAI
SYSTEM_PROMPT = (
    "你是一位專業的「機器學習助教」。你的回答必須緊扣本平台的教學內容：4 種學習類型與 10 大核心演算法。"
    "你需要引導學生思考完整的建模流程（1. 問題定義 -> 2. 資料蒐集 -> 3. 資料清理 -> 4. 特徵工程 -> 5. 訓練/驗證/測試切分 -> 6. 模型訓練 -> 7. 模型評估 -> 8. 解釋與部署維護）。"
    "當學生遇到模型表現不好時，優先引導他們檢查資料品質、特徵定義、切分方式與評估指標（如回歸的 RMSE、分類 of F1-score 等）；"
    "若表現異常好，則提醒注意資料洩漏（Data Leakage）問題。請用繁體中文回答，並以循序漸進、引導思考的方式進行，切勿直接提供大量完整的標準程式碼或結論。"
)

def clean_api_key(key: str) -> str:
    if not key:
        return ""
    return key.strip().strip("'").strip('"')

def mask_key(key: str) -> str:
    if not key:
        return "Not Set"
    if len(key) <= 12:
        return f"Set (Invalid length: {len(key)} chars)"
    return f"{key[:8]}...{key[-4:]} (length: {len(key)})"

# Setup Gemini Client (Primary Free-Tier option)
gemini_api_key = clean_api_key(os.getenv("GEMINI_API_KEY"))
gemini_model = None
if gemini_api_key:
    try:
        genai.configure(api_key=gemini_api_key)
        gemini_model = genai.GenerativeModel(
            model_name='gemini-3.5-flash',
            system_instruction=SYSTEM_PROMPT
        )
        print(f"INFO: Gemini API configured successfully. Key: {mask_key(gemini_api_key)}")
    except Exception as e:
        print(f"Error configuring Gemini: {e}")

# Setup Groq Client (Alternative Free-Tier option)
groq_api_key = clean_api_key(os.getenv("GROQ_API_KEY"))
groq_client = None
if groq_api_key:
    try:
        groq_client = AsyncOpenAI(
            api_key=groq_api_key,
            base_url="https://api.groq.com/openai/v1"
        )
        print(f"INFO: Groq API configured successfully (Llama 3). Key: {mask_key(groq_api_key)}")
    except Exception as e:
        print(f"Error configuring Groq: {e}")

# Setup OpenRouter Client (Alternative Free-Tier option)
openrouter_api_key = clean_api_key(os.getenv("OPENROUTER_API_KEY"))
openrouter_client = None
if openrouter_api_key:
    try:
        openrouter_client = AsyncOpenAI(
            api_key=openrouter_api_key,
            base_url="https://openrouter.ai/api/v1"
        )
        print(f"INFO: OpenRouter API configured successfully. Key: {mask_key(openrouter_api_key)}")
    except Exception as e:
        print(f"Error configuring OpenRouter: {e}")

# Setup OpenAI Client (Alternative option)
openai_api_key = clean_api_key(os.getenv("OPENAI_API_KEY"))
openai_client = None
if openai_api_key:
    try:
        openai_client = AsyncOpenAI(api_key=openai_api_key)
        print(f"INFO: OpenAI API configured successfully. Key: {mask_key(openai_api_key)}")
    except Exception as e:
        print(f"Error configuring OpenAI: {e}")

if not gemini_model and not groq_client and not openrouter_client and not openai_client:
    print("WARNING: No AI API keys (Gemini, Groq, OpenRouter, OpenAI) configured. Chatbot will run in mock streaming fallback mode.")




class QuizItem(BaseModel):
    question: str
    options: List[str]
    correctIndex: int


class Algorithm(BaseModel):
    id: int
    name: str
    description: str
    example: str
    advantages: List[str]
    disadvantages: List[str]
    # Display metadata (previously in frontend/lib/algorithmData.js `meta`)
    shortName: str
    category: str
    task: str
    level: str
    color: str
    code: str
    concept: str
    bestFor: str
    quiz: QuizItem
    # Study report insights (previously in frontend/lib/algorithmReport.js `reportInsights`)
    output: str
    core: str
    workflow: List[str]
    metrics: List[str]
    pitfalls: List[str]
    practice: str


ALGORITHMS: List[Algorithm] = [
    Algorithm(
        id=0,
        name="線性回歸 (Linear Regression)",
        description=(
            "線性回歸是一種監督式學習算法，用於預測連續型目標變數。"
            "它假設輸入特徵與輸出之間有近似線性的關係，並透過最小化預測值與真實值之間的平均平方誤差（MSE）來尋找最佳擬合直線。"
        ),
        example=(
            "假設你要預測房屋價格，使用房屋面積作為特徵。"
            "線性回歸將學習一條線：價格 = w × 面積 + b，其中 w 是斜率，b 是截距。"
        ),
        advantages=["簡單易於實作，計算效率高。", "模型解釋性佳，可以觀察各特徵對目標變數的影響。"],
        disadvantages=["只能描述線性關係，無法擬合複雜的非線性模式。", "對離群值敏感，可能受到極端點的影響。"],
        shortName="線性迴歸", category="監督式", task="迴歸", level="入門", color="#ef4444", code="LR",
        concept="用最佳直線描述特徵與連續數值之間的關係。",
        bestFor="房價預測、銷售額、趨勢估計",
        quiz=QuizItem(question="線性迴歸最適合預測什麼？", options=["連續數值", "資料群中心", "圖像邊緣"], correctIndex=0),
        output="連續數值",
        core="線性迴歸用一條直線、平面或高維超平面近似特徵與目標值的關係。訓練時會尋找一組係數，讓預測值與真實值的整體誤差最小。",
        workflow=["確認目標是連續數值", "檢查離群值與資料洩漏", "觀察特徵是否適合線性組合", "用 MAE、RMSE、R-squared 與殘差圖評估"],
        metrics=["MAE", "RMSE", "R-squared", "殘差圖"],
        pitfalls=["明顯非線性關係會低估或高估重要區間", "離群值會強烈影響係數", "多重共線性會讓係數解讀失真", "只看 R-squared 容易忽略系統性殘差"],
        practice="收集廣告費、網站流量、業務拜訪數與歷史營收，建立下季營收預測模型，再檢查旺季殘差是否偏大。",
    ),
    Algorithm(
        id=1,
        name="邏輯斯迴歸 (Logistic Regression)",
        description=(
            "邏輯斯迴歸也是監督式學習算法，主要用於二元分類問題。"
            "它使用邏輯斯函數（sigmoid）將線性組合的輸入映射到 [0,1] 之間的概率值，再根據預設閾值進行分類。"
        ),
        example=(
            "例如根據電子郵件的詞頻特徵，預測該郵件是否為垃圾信。"
            "邏輯斯迴歸計算一個概率，如果高於 0.5 就預測為垃圾信，否則為正常信件。"
        ),
        advantages=["訓練快速、適合大規模數據。", "模型輸出概率，便於解釋分類的信心度。"],
        disadvantages=["假設類別之間是線性可分的，對於高度非線性的資料效果不佳。", "與線性回歸一樣，對離群值敏感。"],
        shortName="邏輯迴歸", category="監督式", task="分類", level="入門", color="#f97316", code="LG",
        concept="把線性分數轉成機率，常用於二元分類。",
        bestFor="垃圾郵件、是否違約、是否罹病",
        quiz=QuizItem(question="邏輯迴歸輸出的核心意義是什麼？", options=["類別機率", "樹的深度", "主成分方向"], correctIndex=0),
        output="類別機率",
        core="邏輯斯迴歸先計算線性分數，再用 sigmoid 函數轉成 0 到 1 的機率，常用於二元分類與風險分數。",
        workflow=["確認目標是分類標籤", "處理類別不平衡", "標準化或編碼特徵", "依業務成本調整分類閾值"],
        metrics=["Precision", "Recall", "F1-score", "ROC-AUC", "PR-AUC"],
        pitfalls=["accuracy 在類別不平衡時可能誤導", "分類邊界偏線性", "閾值 0.5 不一定符合業務成本", "機率校準不足會影響風險判斷"],
        practice="用登入次數、影片觀看比例、作業提交率與討論區發言，預測學生是否會完成線上課程。",
    ),
    Algorithm(
        id=2,
        name="決策樹 (Decision Tree)",
        description=(
            "決策樹是一種樹狀結構模型，每個內部節點代表一個特徵條件，"
            "葉節點代表預測結果。通過遞迴地將數據按照特徵分裂成互斥的區域，"
            "最終形成一棵樹，用於分類或迴歸。"
        ),
        example=(
            "在貸款風險評估中，可以使用申請人的收入、年齡、信用分數等特徵，"
            "根據決策樹的分裂規則預測貸款是否違約。"
        ),
        advantages=["直觀易理解，能直接以圖形方式展示決策流程。", "能處理非線性和混合型（數值與類別）特徵。"],
        disadvantages=["容易過擬合，需要限制樹的深度或剪枝以提升泛化能力。", "對於少量數據的微小變動，結構可能產生大幅度變化。"],
        shortName="決策樹", category="監督式", task="分類", level="入門", color="#eab308", code="DT",
        concept="用條件分支一步步切分資料，形成容易解釋的規則。",
        bestFor="規則清楚、需要解釋的決策問題",
        quiz=QuizItem(question="決策樹最直觀的優勢是什麼？", options=["決策流程易解釋", "永遠不會過擬合", "不需要資料"], correctIndex=0),
        output="類別或數值",
        core="決策樹透過一連串 if-else 條件切分資料，每個節點都嘗試讓子節點更純，最後形成可解釋的規則。",
        workflow=["選擇可被切分的特徵", "用 Gini、entropy 或 MSE 衡量切分品質", "限制樹深與葉節點樣本數", "檢查規則是否符合領域知識"],
        metrics=["Accuracy", "F1-score", "Gini impurity", "Entropy", "MSE"],
        pitfalls=["樹太深容易記住雜訊", "資料小變動可能造成樹結構大變動", "單棵樹準確度常不如集成模型", "過度解讀偶然切分規則"],
        practice="用收入、信用分數、負債比與逾期紀錄，建立貸款違約判斷規則，並限制最大深度方便解釋。",
    ),
    Algorithm(
        id=3,
        name="隨機森林 (Random Forest)",
        description=(
            "隨機森林是由多棵決策樹組成的集成模型。"
            "每棵樹都是在自助取樣（Bootstrap）的子樣本和隨機選擇的特徵上訓練。"
            "最終的預測結果是所有樹的投票（分類）或平均（迴歸）。"
        ),
        example=(
            "在疾病診斷中，使用不同的臨床指標（如血壓、膽固醇、家族史等）"
            "訓練多棵樹，綜合各樹的判斷得出病人患病與否的結果。"
        ),
        advantages=["能有效處理高維資料並具有高精度。", "內建防止過擬合的機制，對異常值和噪聲較為穩健。"],
        disadvantages=["模型複雜度高，不容易解釋單一預測的決策過程。", "訓練和預測速度較單棵決策樹慢，消耗更多資源。"],
        shortName="隨機森林", category="集成", task="分類/迴歸", level="中階", color="#22c55e", code="RF",
        concept="組合多棵決策樹，用投票或平均提升穩定性。",
        bestFor="高維資料、穩健預測、特徵多的任務",
        quiz=QuizItem(question="隨機森林如何整合分類結果？", options=["投票", "只選第一棵樹", "刪除分支"], correctIndex=0),
        output="類別或數值",
        core="隨機森林把多棵決策樹組合起來，透過 bootstrap 抽樣與隨機特徵選擇降低單棵樹過擬合的風險。",
        workflow=["準備多個有效特徵", "設定樹的數量與深度限制", "使用袋外資料或驗證集評估", "檢視特徵重要度但避免過度解讀"],
        metrics=["Accuracy", "F1-score", "ROC-AUC", "RMSE", "Feature importance"],
        pitfalls=["比單棵樹更難解釋", "訓練與預測成本較高", "特徵重要度可能偏向高基數特徵", "資料洩漏仍會讓表現虛高"],
        practice="用血壓、膽固醇、年齡、BMI 與家族史預測疾病風險，再比較前幾名重要特徵。",
    ),
    Algorithm(
        id=4,
        name="支持向量機 (Support Vector Machine, SVM)",
        description=(
            "支持向量機是一種強大的分類算法，尋找能最大化不同類別之間間隔（margin）的分隔超平面。"
            "透過核函數，SVM 可以處理非線性可分的資料。"
        ),
        example=(
            "例如在手寫數字辨識中，透過多項式或高斯核將數據映射到高維空間，"
            "尋找最優決策邊界以區分不同數字。"
        ),
        advantages=["對於高維特徵空間及非線性問題有良好表現。", "只依賴部分訓練樣本（支持向量），在模型構建後記憶體需求較小。"],
        disadvantages=["對於大型數據集訓練時間較長；參數（如核參數、懲罰係數）調整複雜。", "不易直接提供機率輸出。"],
        shortName="支援向量機", category="監督式", task="分類", level="中階", color="#3b82f6", code="SV",
        concept="尋找最大間隔的分隔邊界，也能處理非線性資料。",
        bestFor="中小型高維分類問題",
        quiz=QuizItem(question="SVM 主要追求最大化什麼？", options=["類別間隔", "資料筆數", "群中心數量"], correctIndex=0),
        output="類別或連續數值",
        core="支援向量機尋找能最大化類別間隔的邊界；搭配 kernel 後，可以在高維空間處理非線性分界。",
        workflow=["標準化特徵尺度", "選擇 linear、poly 或 RBF kernel", "調整 C 與 gamma", "用交叉驗證檢查泛化能力"],
        metrics=["Accuracy", "F1-score", "Margin", "ROC-AUC"],
        pitfalls=["對尺度敏感", "大型資料訓練成本高", "C 與 gamma 不易直覺設定", "機率輸出需額外校準"],
        practice="把手寫數字影像轉成特徵後，使用 RBF kernel 分類不同數字，並比較標準化前後的表現。",
    ),
    Algorithm(
        id=5,
        name="K 最近鄰 (K-Nearest Neighbors, KNN)",
        description=(
            "K 最近鄰是一種懶惰學習算法，對於每個測試樣本，計算其與訓練資料中所有樣本的距離，"
            "選擇最近的 K 個鄰居進行投票（分類）或平均（迴歸）。"
        ),
        example=(
            "在推薦系統中，可以使用用戶過去喜歡的商品特徵來尋找最相似的其他用戶，"
            "並基於這些相近用戶的偏好推薦新的商品。"
        ),
        advantages=["實現簡單，無需顯式訓練階段。", "對於多類別問題效果良好，可靈活調整 K 的大小以控制模型複雜度。"],
        disadvantages=["計算成本高，尤其對於大型資料集，每次預測都需計算全體距離。", "對尺度敏感，需要正規化特徵以避免高變量主導結果。"],
        shortName="K近鄰", category="監督式", task="分類/迴歸", level="入門", color="#6366f1", code="KN",
        concept="找出最相近的 K 個樣本，再投票或平均。",
        bestFor="相似性推薦、資料量較小的分類",
        quiz=QuizItem(question="KNN 預測時主要依賴什麼？", options=["鄰近樣本", "反向傳播", "隨機森林"], correctIndex=0),
        output="類別或數值",
        core="K 最近鄰不建立明確參數模型，而是在預測時找出距離最近的 K 個樣本，再投票或平均。",
        workflow=["定義合理距離", "先標準化特徵", "用驗證集選擇 K 值", "檢查高維資料是否造成距離失效"],
        metrics=["Accuracy", "F1-score", "RMSE", "鄰近距離分布"],
        pitfalls=["預測時需要計算距離，資料大時較慢", "高維度會讓距離變得不可靠", "特徵尺度不一致會扭曲鄰近關係", "K 太小容易受雜訊影響"],
        practice="用使用者消費頻率、平均客單價與商品偏好，找出相似顧客並做推薦分群。",
    ),
    Algorithm(
        id=6,
        name="朴素貝葉斯 (Naive Bayes)",
        description=(
            "朴素貝葉斯分類器基於貝葉斯定理，假設特徵之間相互條件獨立。"
            "它通過計算後驗概率選擇最可能的類別，常用於文本分類等領域。"
        ),
        example=(
            "在垃圾郵件過濾中，假設每個詞的出現與其他詞獨立，以此估計電子郵件屬於垃圾與否的概率。"
        ),
        advantages=["計算速度快，尤其適合高維稀疏特徵（如文字）。", "模型簡單，不需要大量訓練數據即可達到不錯效果。"],
        disadvantages=["假設特徵條件獨立在現實中不常成立，可能影響模型精度。", "對於特徵相關性高的情況下表現較差。"],
        shortName="朴素貝葉斯", category="監督式", task="分類", level="入門", color="#a855f7", code="NB",
        concept="用貝葉斯定理估計類別機率，假設特徵條件獨立。",
        bestFor="文字分類、垃圾郵件過濾",
        quiz=QuizItem(question="朴素貝葉斯常見假設是什麼？", options=["條件獨立", "完全線性", "無需類別"], correctIndex=0),
        output="類別機率",
        core="樸素貝氏使用貝氏定理估計類別機率，並假設特徵在給定類別後彼此條件獨立，因此特別適合文字特徵。",
        workflow=["把文字轉成詞頻或 TF-IDF 特徵", "選擇 Multinomial、Bernoulli 或 Gaussian 版本", "加入平滑避免零機率", "用混淆矩陣檢查錯誤類別"],
        metrics=["Accuracy", "Precision", "Recall", "F1-score", "Confusion matrix"],
        pitfalls=["特徵獨立假設不一定成立", "高度相關特徵可能被重複計算影響", "訓練資料詞彙不足時泛化差", "罕見詞需要平滑處理"],
        practice="用新聞內文的詞頻特徵訓練主題分類器，再觀察哪些詞最容易造成誤判。",
    ),
    Algorithm(
        id=7,
        name="K 均值聚類 (K-Means Clustering)",
        description=(
            "K 均值是常用的非監督式聚類算法，通過迭代地將資料分配到 K 個簇中並更新簇心，"
            "最小化簇內點到簇心的距離和。"
        ),
        example=(
            "在市場區隔分析中，將顧客根據購買行為及人口統計學資訊分為多個群體，"
            "以便行銷策略的定制。"
        ),
        advantages=["算法簡單易於實現，計算效率高。", "對大規模資料集友好，能快速收斂。"],
        disadvantages=["需要事先指定 K 值且對初始簇心敏感，可能陷入局部最小值。", "只能找到凸形簇，對於非球形分佈效果不佳。"],
        shortName="K-Means 聚類", category="非監督式", task="聚類", level="入門", color="#06b6d4", code="KM",
        concept="反覆分配資料到 K 個群，並更新每個群的中心。",
        bestFor="客戶分群、市場區隔、探索資料",
        quiz=QuizItem(question="K-Means 執行前通常要指定什麼？", options=["K 值", "標籤答案", "樹深度"], correctIndex=0),
        output="群組標籤",
        core="K-Means 反覆把資料分到最近的群中心，再更新群中心位置，目標是降低群內點到中心的距離總和。",
        workflow=["先標準化數值特徵", "用 elbow 或 silhouette 協助選 K", "多次初始化降低局部最小值風險", "用業務語意解讀每個群"],
        metrics=["Inertia", "Silhouette score", "群內距離", "群間差異"],
        pitfalls=["需要事先指定 K", "對初始中心敏感", "不適合非球狀群", "離群值會拉動群中心"],
        practice="用平均消費、造訪次數與優惠券使用率做顧客分群，命名各群並設計不同行銷策略。",
    ),
    Algorithm(
        id=8,
        name="主成分分析 (Principal Component Analysis, PCA)",
        description=(
            "主成分分析是一種降維技術，將高維數據投影到一組新的正交向量（主成分）上，"
            "使得投影後的數據能保留最多的變異。"
        ),
        example=(
            "在影像處理中，PCA 可用來將高維像素數據降維至少數主成分，"
            "從而在保留主要信息的同時降低維度並去除噪聲。"
        ),
        advantages=["能有效降低維度，減少計算成本並提升模型速度。", "可用於數據可視化，理解資料內在結構。"],
        disadvantages=["主成分是線性組合，難以解釋每個主成分的物理意義。", "只關注變異最大方向，可能忽略對目標預測重要的小變異部分。"],
        shortName="主成分分析", category="非監督式", task="降維", level="中階", color="#8b5cf6", code="PC",
        concept="找出保留最多變異的方向，把高維資料壓縮到低維。",
        bestFor="資料視覺化、降維、去雜訊",
        quiz=QuizItem(question="PCA 的主要目的通常是什麼？", options=["降維", "增加標籤", "產生決策樹"], correctIndex=0),
        output="降維座標",
        core="PCA 找出資料變異最大的正交方向，將高維資料投影到少數主成分上，以保留主要資訊並降低維度。",
        workflow=["先標準化特徵", "檢查解釋變異比例", "選擇主成分數量", "用低維座標視覺化或作為後續模型輸入"],
        metrics=["Explained variance ratio", "累積解釋變異", "重建誤差"],
        pitfalls=["主成分不一定容易解釋", "只保留最大變異可能忽略對預測重要的小變異", "非線性結構不一定能用 PCA 保留", "未標準化會讓大尺度特徵主導結果"],
        practice="將多維顧客特徵投影到 2D，觀察資料是否自然形成群，再搭配 K-Means 做分群。",
    ),
    Algorithm(
        id=9,
        name="神經網絡 (Neural Networks)",
        description=(
            "神經網絡受生物神經系統啟發，由多層互連的神經元（層）構成，可以學習複雜的非線性映射。"
            "深度神經網絡特別適用於處理高維數據，如影像、語音和自然語言。"
        ),
        example=(
            "在圖像識別中，卷積神經網絡（CNN）可自動學習從低層像素到高層語意的多層特徵表示，"
            "用於區分不同的物體或人臉。"
        ),
        advantages=["能擬合複雜非線性關係，表現強大。", "適用於大規模資料集，隨著資料增多性能可持續提升。"],
        disadvantages=["需要大量計算資源和時間進行訓練，容易過擬合。", "模型複雜度高，解釋性差，不易理解內部機制。"],
        shortName="神經網路", category="深度學習", task="分類/生成", level="進階", color="#f97316", code="NN",
        concept="透過多層神經元學習複雜非線性映射。",
        bestFor="影像、語音、自然語言",
        quiz=QuizItem(question="神經網路擅長處理哪類關係？", options=["複雜非線性", "只能直線", "固定群中心"], correctIndex=0),
        output="類別、數值或生成結果",
        core="類神經網路由多層神經元組成，透過權重與非線性 activation 學習複雜模式，是深度學習模型的基礎。",
        workflow=["準備大量且一致的資料", "設計層數、神經元與 activation", "設定 loss、optimizer 與 batch size", "用驗證集監控過擬合"],
        metrics=["Accuracy", "Loss curve", "Validation loss", "F1-score"],
        pitfalls=["資料少時容易過擬合", "訓練成本高", "模型較難解釋", "超參數與資料前處理影響很大"],
        practice="用影像資料訓練簡單多層神經網路或 CNN，觀察訓練曲線與驗證曲線是否分離。",
    ),
]


app = FastAPI(title="Machine Learning Algorithms API", version="1.0")

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/algorithms", response_model=List[Algorithm])
def list_algorithms() -> List[Algorithm]:
    """Return the full list of machine learning algorithms."""
    return ALGORITHMS


@app.get("/api/algorithms/{algorithm_id}", response_model=Algorithm)
def get_algorithm(algorithm_id: int) -> Algorithm:
    """Return details of a single algorithm by its ID."""
    for algo in ALGORITHMS:
        if algo.id == algorithm_id:
            return algo
    raise HTTPException(status_code=404, detail="Algorithm not found")


SYSTEM_PROMPT_MOCK = (
    "你是一位專業的「機器學習助教」。你的回答必須緊扣本平台的教學內容：4 種學習類型與 10 大核心演算法。"
    "你需要引導學生思考完整的建模流程（1. 問題定義 -> 2. 資料蒐集 -> 3. 資料清理 -> 4. 特徵工程 -> 5. 訓練/驗證/測試切分 -> 6. 模型訓練 -> 7. 模型評估 -> 8. 解釋與部署維護）。"
    "當學生遇到模型表現不好時，優先引導他們檢查資料品質、特徵定義、切分方式與評估指標（如回歸的 RMSE、分類的 F1-score 等）；"
    "若表現異常好，則提醒注意資料洩漏（Data Leakage）問題。請用繁體中文回答，並以循序漸進、引導思考的方式進行，切勿直接提供大量完整的標準程式碼或結論。"
)


@app.websocket("/ws/ai-chat")
async def websocket_ai_chat(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Receive text from client (JSON string)
            data_str = await websocket.receive_text()
            try:
                data = json.loads(data_str)
                user_message = data.get("message", "").strip()
                algo_context = data.get("algoContext", "").strip()
            except Exception:
                user_message = data_str.strip()
                algo_context = ""

            if not user_message:
                continue

            # List of providers we can attempt
            providers = []
            if gemini_model:
                providers.append(("Gemini", "gemini-3.5-flash"))
            if groq_client:
                providers.append(("Groq", "llama3-8b-8192"))
            if openrouter_client:
                providers.append(("OpenRouter", "openrouter/free"))
            if openai_client:
                providers.append(("OpenAI", "gpt-4o-mini"))

            success = False
            for provider_name, model_name in providers:
                try:
                    if provider_name == "Gemini":
                        prompt_content = user_message
                        if algo_context:
                            prompt_content = f"[情境：學生目前正在學習 {algo_context}]\n\n問題：{user_message}"

                        # Stream from Gemini API
                        response = await gemini_model.generate_content_async(
                            prompt_content,
                            stream=True
                        )
                        async for chunk in response:
                            try:
                                if chunk.text:
                                    await websocket.send_text(chunk.text)
                            except Exception:
                                pass
                        success = True
                        break

                    elif provider_name == "Groq":
                        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
                        if algo_context:
                            messages.append({
                                "role": "system",
                                "content": f"學生目前正在瀏覽【{algo_context}】演算法的章節。請針對該演算法與其相關特質（如分類/回歸屬性、建模細節）回答或引導學生的疑惑。"
                            })
                        messages.append({"role": "user", "content": user_message})

                        response = await groq_client.chat.completions.create(
                            model=model_name,
                            messages=messages,
                            stream=True,
                        )
                        async for chunk in response:
                            text_chunk = chunk.choices[0].delta.content
                            if text_chunk:
                                await websocket.send_text(text_chunk)
                        success = True
                        break

                    elif provider_name == "OpenRouter":
                        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
                        if algo_context:
                            messages.append({
                                "role": "system",
                                "content": f"學生目前正在瀏覽【{algo_context}】演算法的章節。請針對該演算法與其相關特質（如分類/回歸屬性、建模細節）回答或引導學生的疑惑。"
                            })
                        messages.append({"role": "user", "content": user_message})

                        response = await openrouter_client.chat.completions.create(
                            model=model_name,
                            messages=messages,
                            stream=True,
                        )
                        async for chunk in response:
                            text_chunk = chunk.choices[0].delta.content
                            if text_chunk:
                                await websocket.send_text(text_chunk)
                        success = True
                        break

                    elif provider_name == "OpenAI":
                        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
                        if algo_context:
                            messages.append({
                                "role": "system",
                                "content": f"學生目前正在瀏覽【{algo_context}】演算法的章節。請針對該演算法與其相關特質（如分類/回歸屬性、建模細節）回答或引導學生的疑惑。"
                            })
                        messages.append({"role": "user", "content": user_message})

                        response = await openai_client.chat.completions.create(
                            model=model_name,
                            messages=messages,
                            stream=True,
                        )
                        async for chunk in response:
                            text_chunk = chunk.choices[0].delta.content
                            if text_chunk:
                                await websocket.send_text(text_chunk)
                        success = True
                        break

                except Exception as e:
                    print(f"Warning: Provider {provider_name} failed: {e}")
                    # Notify user of failure and fallback
                    await websocket.send_text(f"\n*[系統提示]* {provider_name} API 呼叫失敗（{str(e)[:150]}...），正在自動切換備用方案...\n")
                    continue

            if not success:
                # Fallback to Simulated response (Mock Stream Mode)
                # Show fallback notification
                if providers:
                    await websocket.send_text("\n*[系統提示]* 所有配置的 AI 服務皆不可用，已自動切換至 AI 助教「模擬演示模式」：\n\n")
                
                mock_text = ""
                user_msg_lower = user_message.lower()

                if "過擬合" in user_msg_lower or "overfit" in user_msg_lower:
                    mock_text = (
                        "同學你好，你提到了一個非常關鍵的建模問題：**過擬合 (Overfitting)**。\n\n"
                        "在我們的 8 大建模流程中，當你評估模型時，如果發現**訓練集誤差非常低，但驗證集/測試集誤差卻很高**，就是典型的過擬合。\n\n"
                        "作為你的機器學習助教，我希望你能先思考一下：\n"
                        "1. **特徵工程**上：是不是選取了太多無關或噪聲特徵？\n"
                        "2. **資料清理/切分**上：訓練資料量是否足夠？是否進行了適當的交叉驗證？\n"
                        "3. **模型參數**上：以當前演算法來說，如果是決策樹，是不是限制最大深度 (max_depth) 或進行剪枝會有幫助？如果是隨機森林，樹的數量是否足夠？\n\n"
                        "你可以告訴我你目前正在使用哪一個演算法，以及訓練集與測試集的具體表現（例如 F1-score 或 RMSE）嗎？這樣我們可以一起討論如何調整。"
                    )
                elif "洩漏" in user_msg_lower or "leak" in user_msg_lower or "太好" in user_msg_lower:
                    mock_text = (
                        "同學你好！你的模型表現好得令人難以置信（例如準確率達到 100% 或極高的數值）？這很有可能是發生了**資料洩漏 (Data Leakage)**！\n\n"
                        "資料洩漏通常發生在以下建模環節：\n"
                        "1. **特徵工程階段**：在對整體數據做過濾、填補缺失值或標準化 (Scaler.fit) 時，不小心把測試集/驗證集的資訊也一起算進去，應該**只在訓練集上擬合 fit**。\n"
                        "2. **資料切分階段**：時間序列數據如果使用隨機切分，就會用未來的數據去預測過去，發生時間洩漏。\n\n"
                        "你可以檢查看看你的 `StandardScaler` 或 `MinMaxScaler` 是在什麼時候進行 `fit` 的嗎？是切分資料集之前，還是切分之後？"
                    )
                elif "建模" in user_msg_lower or "流程" in user_msg_lower:
                    mock_text = (
                        "沒問題！我們來重溫一下這套平台的 **8 大建模流程**：\n"
                        "1. **問題定義**：確定你的目標變數是連續的（迴歸問題）還是離散的（分類問題）。\n"
                        "2. **資料蒐集**：獲取原始特徵。\n"
                        "3. **資料清理**：處理缺失值、異常值。\n"
                        "4. **特徵工程**：標準化（對 KNN, SVM 很重要）、編碼、降維（PCA）。\n"
                        "5. **資料切分**：切分 Train / Validation / Test，防範資料洩漏。\n"
                        "6. **模型訓練**：擬合演算法。\n"
                        "7. **模型評估**：選擇正確指標，如迴歸用 RMSE/MAE，分類用 F1-score/Accuracy/ROC-AUC。\n"
                        "8. **部署與維護**：模型解釋、監控與定期重訓。\n\n"
                        "這 8 個步驟是環環相扣的。你目前在做哪一個演算法的實作呢？遇到了什麼阻礙嗎？"
                    )
                else:
                    algo_info = f"在【{algo_context}】" if algo_context else "在機器學習"
                    mock_text = (
                        f"你好！我是你的 AI 機器學習助教（目前處於模擬演示模式，尚未配置 `GEMINI_API_KEY`、`GROQ_API_KEY`、`OPENROUTER_API_KEY` 或 `OPENAI_API_KEY`）。\n\n"
                        f"你所詢問的問題是：『{user_message}』。\n\n"
                        f"當我們{algo_info}進行建模時，助教建議你可以遵循這幾個思考方向：\n"
                        f"1. **資料品質與特徵定義**：輸入特徵是否與目標變數高度相關？是否需要特徵縮放？\n"
                        f"2. **評估指標選擇**：如果我們在解的是分類問題，優先觀察 **F1-score** 或 **ROC-AUC**；若是迴歸，則觀察 **RMSE** 或 **R²**。\n"
                        f"3. **異常表现分析**：若表現極佳，請防範**資料洩漏**；若表現差，則嘗試調整超參數或重新檢查特徵工程。\n\n"
                        f"你可以試著對我提問關於『過擬合』、『資料洩漏』或『建模流程』等關鍵字，我會向你演示相關的引導邏輯喔！"
                    )

                # Slow typewriter simulation
                chunk_len = 5
                for idx in range(0, len(mock_text), chunk_len):
                    await websocket.send_text(mock_text[idx:idx + chunk_len])
                    await asyncio.sleep(0.015)

            # Signal end of stream
            await websocket.send_text("[DONE]")

    except WebSocketDisconnect:
        print("AI Assistant WebSocket connection closed.")
    except Exception as e:
        print(f"Error in WebSocket session: {e}")

