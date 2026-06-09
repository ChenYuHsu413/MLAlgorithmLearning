import os
import json
import asyncio
import time
import numpy as np
from sklearn.linear_model import LinearRegression as SklearnLR, LogisticRegression as SklearnLGR
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier
from sklearn.datasets import make_regression, make_classification, make_blobs
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, r2_score, silhouette_score
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
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
    explanation: str


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
    quiz: List[QuizItem]
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
        quiz=[
            QuizItem(question="線性迴歸最適合預測什麼？", options=["連續數值（如房價）", "資料群中心", "圖像邊緣"], correctIndex=0, explanation="線性迴歸的輸出是連續型數值。若目標是類別（如是/否），應改用邏輯迴歸。"),
            QuizItem(question="線性迴歸用什麼損失函數衡量誤差？", options=["均方誤差 MSE", "Gini 不純度", "交叉熵 Cross-Entropy"], correctIndex=0, explanation="MSE 計算每個預測值與真實值差值的平方平均。RMSE 是 MSE 的根號，單位與目標值相同，更容易解釋誤差大小。"),
            QuizItem(question="為什麼線性迴歸對離群值敏感？", options=["MSE 會平方放大大誤差的影響", "因為它使用對數轉換", "因為它需要整數輸入"], correctIndex=0, explanation="MSE 對誤差進行平方，使少數極端點對係數產生過大影響。改用 MAE（平均絕對誤差）可以降低離群值的衝擊。"),
        ],
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
        quiz=[
            QuizItem(question="邏輯迴歸輸出的核心意義是什麼？", options=["類別機率（0 到 1）", "樹的深度", "主成分方向"], correctIndex=0, explanation="邏輯迴歸透過 Sigmoid 函數將線性分數轉為 0~1 之間的機率，可解釋為屬於正類的信心程度。"),
            QuizItem(question="類別嚴重不平衡時（如正例僅佔 5%），應優先看哪個指標？", options=["F1-score 或 PR-AUC", "只看準確率 Accuracy", "Silhouette Score"], correctIndex=0, explanation="Accuracy 在不平衡資料中會誤導（全猜多數類就有高準確率）。F1-score 同時衡量 Precision 和 Recall，更能反映真實性能。"),
            QuizItem(question="邏輯迴歸的預設分類閾值是多少？", options=["0.5", "0.1", "1.0"], correctIndex=0, explanation="預設閾值 0.5 不一定符合業務需求。醫療診斷中漏診代價遠高於誤診，應降低閾值以提高 Recall（召回率）。"),
        ],
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
        quiz=[
            QuizItem(question="決策樹最直觀的優勢是什麼？", options=["決策流程易解釋（if-else 規則）", "永遠不會過擬合", "不需要資料"], correctIndex=0, explanation="決策樹每個節點都是可解釋的 if-else 條件，非技術人員也能理解其決策邏輯，這是它在需要解釋性場景（如法規遵循）中的最大優勢。"),
            QuizItem(question="決策樹在分裂節點時，通常用什麼衡量分裂品質？", options=["Gini 不純度或 Entropy", "RMSE", "Silhouette Score"], correctIndex=0, explanation="Gini 衡量節點的混雜程度（越低越純），Entropy 使用信息論計算不純度。兩者效果相近，但 Gini 計算較快，是 scikit-learn 的預設。"),
            QuizItem(question="如何防止決策樹過擬合？", options=["限制最大深度 max_depth 或最小葉節點樣本數", "增加更多特徵", "移除所有葉節點"], correctIndex=0, explanation="樹越深越容易記住訓練資料中的雜訊。設定 max_depth 或 min_samples_leaf 是最直接的正則化手段，可強迫樹學習更通用的規則。"),
        ],
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
        quiz=[
            QuizItem(question="隨機森林如何整合多棵樹的分類結果？", options=["多數投票（最多樹同意的類別獲勝）", "只選第一棵樹", "刪掉表現最差的分支"], correctIndex=0, explanation="分類任務用多數投票，迴歸任務用平均值。組合多棵樹的判斷可以降低單棵樹的過擬合風險，提升整體穩定性。"),
            QuizItem(question="隨機森林如何確保每棵樹不同？", options=["Bootstrap 抽樣 + 隨機選擇特徵子集", "每棵樹使用相同資料但不同超參數", "每棵樹只用一個特徵"], correctIndex=0, explanation="Bootstrap 從訓練集有放回地抽樣，加上每次分裂只考慮隨機特徵子集，確保樹間的多樣性。多樣性是集成學習能有效降低方差的關鍵。"),
            QuizItem(question="隨機森林的特徵重要度可能有哪種偏差？", options=["偏向高基數（類別多）的特徵", "永遠公平反映每個特徵的貢獻", "只適用於迴歸任務"], correctIndex=0, explanation="高基數特徵有更多可能的分裂點，被選為最佳分裂的機會更高，導致重要度虛高。建議搭配 Permutation Importance 做比對驗證。"),
        ],
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
        quiz=[
            QuizItem(question="SVM 主要追求最大化什麼？", options=["兩類別之間的間隔（Margin）", "訓練資料筆數", "群中心的數量"], correctIndex=0, explanation="SVM 找到讓兩類別間隔最大的超平面（決策邊界）。更大的間隔代表對未知資料有更高的容錯性，有助於提升泛化能力。"),
            QuizItem(question="SVM 中 Kernel Trick 的主要作用是什麼？", options=["將資料映射到高維空間，讓非線性問題線性可分", "減少訓練資料的數量", "直接輸出類別機率"], correctIndex=0, explanation="Kernel Trick 讓 SVM 在高維空間運算，而無需真正計算高維座標（省去計算成本）。使用 RBF Kernel 可以處理複雜的非線性邊界。"),
            QuizItem(question="為什麼使用 SVM 前通常需要標準化特徵？", options=["間隔計算基於距離，特徵尺度不同會讓大尺度特徵主導邊界", "SVM 只能接受 0 到 1 之間的輸入", "標準化可增加支持向量的數量"], correctIndex=0, explanation="SVM 用歐氏距離衡量間隔。若特徵 A 範圍是 0~1000、特徵 B 是 0~1，特徵 A 的影響力遠大於 B。StandardScaler 讓所有特徵的影響力均等。"),
        ],
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
        quiz=[
            QuizItem(question="KNN 預測時主要依賴什麼？", options=["距離最近的 K 個訓練樣本的標籤", "反向傳播梯度", "隨機森林的投票"], correctIndex=0, explanation="KNN 在預測時找出距離最近的 K 個樣本，再用投票（分類）或平均（迴歸）決定結果。它沒有顯式的訓練階段，所有計算在預測時才進行。"),
            QuizItem(question="K 值設太小（如 K=1）容易造成什麼問題？", options=["過擬合（對雜訊樣本極度敏感）", "欠擬合", "訓練速度變慢"], correctIndex=0, explanation="K=1 時，預測完全由最近的單一樣本決定，任何雜訊點都會直接影響結果。K 越大預測越平滑，但可能忽略局部細節（欠擬合）。"),
            QuizItem(question="KNN 在高維資料中為何效果下降？", options=["高維空間中所有點的距離趨於相等（維度詛咒）", "KNN 不支援多維輸入", "高維資料一定有資料洩漏"], correctIndex=0, explanation="隨維度增加，最近和最遠鄰居的距離差距趨近於零，「鄰近」失去區分能力，這就是「維度詛咒（Curse of Dimensionality）」。可先用 PCA 降維再套用 KNN。"),
        ],
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
        quiz=[
            QuizItem(question="朴素貝葉斯的核心假設是什麼？", options=["給定類別後，各特徵彼此條件獨立", "特徵必須完全線性相關", "不需要類別標籤"], correctIndex=0, explanation="「朴素」一詞正是來自這個強假設。雖然現實中特徵很少真正獨立，但此假設大幅簡化計算，且模型在許多實務場景中依然表現良好。"),
            QuizItem(question="朴素貝葉斯中「平滑（Smoothing）」的目的是什麼？", options=["防止訓練集未出現的詞彙導致機率為零", "讓模型決策邊界更平滑", "增加訓練樣本數量"], correctIndex=0, explanation="若某詞在訓練集的某類別中從未出現，其機率為 0，乘以任何數結果都是 0。Laplace 平滑（加 1）確保所有詞彙有非零機率，避免「零機率問題」。"),
            QuizItem(question="即使特徵獨立假設不成立，朴素貝葉斯為何仍能表現不錯？", options=["分類只需比較後驗機率大小，不需要精確的機率值", "因為 Laplace 平滑補正了獨立假設", "因為獨立假設在文字資料中完全成立"], correctIndex=0, explanation="分類決策是選擇後驗機率最高的類別，只需比較相對大小。即使機率值因獨立假設而不精確，但只要大小排序正確，分類就會是正確的。"),
        ],
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
        quiz=[
            QuizItem(question="K-Means 執行前必須指定什麼？", options=["群數 K", "類別標籤（監督式資訊）", "決策樹的最大深度"], correctIndex=0, explanation="K-Means 是非監督式學習，不需要標籤，但需要事先決定群數 K。K 的選擇通常用 Elbow Method 或 Silhouette Score 協助判斷。"),
            QuizItem(question="K-Means 如何更新每一輪的群中心？", options=["計算群內所有點的座標平均值（均值）", "隨機重新選一個現有資料點", "用距離加權移動"], correctIndex=0, explanation="每輪迭代將群中心移到其群內所有成員的幾何中心（均值），這也是演算法名稱「均值（Means）」的由來。重複直到中心不再移動為止。"),
            QuizItem(question="K-Means 對離群值敏感的原因是什麼？", options=["均值易被極端值拉動，使群中心偏離真正的群核心", "離群值會讓 Silhouette Score 升高", "K-Means 會自動辨識並排除離群值"], correctIndex=0, explanation="群中心是均值，對極端點非常敏感。一個遠離群體的離群點會顯著拉動群中心位置，扭曲分群結果。K-Medoids 使用真實資料點作為中心，更能抵抗離群值。"),
        ],
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
        quiz=[
            QuizItem(question="PCA 的主要目的通常是什麼？", options=["降低資料維度同時保留最多資訊", "增加資料的類別標籤", "產生決策樹的分裂規則"], correctIndex=0, explanation="PCA 將高維資料投影到少數幾個主成分，使資料在低維空間仍保留最多的原始變異。常用於視覺化（降到 2D/3D）或作為後續模型的前處理步驟。"),
            QuizItem(question="主成分（Principal Component）代表什麼方向？", options=["資料變異最大的正交方向", "資料中最常見的特徵值方向", "隨機選取的投影方向"], correctIndex=0, explanation="PC1 是資料中變異最大的方向，PC2 是與 PC1 垂直（正交）且次大變異的方向。這些正交方向讓資料在低維空間仍具有最大區分度。"),
            QuizItem(question="「解釋變異比（Explained Variance Ratio）」是什麼意思？", options=["每個主成分佔原始資料總變異的百分比", "每個特徵的線性相關程度", "資料壓縮前後的誤差比例"], correctIndex=0, explanation="若前兩個主成分的解釋變異比為 0.65 和 0.20，表示它們共同保留了 85% 的原始資訊。通常選到累積解釋變異達 80~95% 為止。"),
        ],
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
        quiz=[
            QuizItem(question="神經網路擅長學習哪類關係？", options=["複雜的非線性模式（如影像、語音）", "只能學習線性關係", "固定群中心位置"], correctIndex=0, explanation="透過多層神經元的非線性激活函數（如 ReLU），神經網路可以學習任意複雜的非線性映射，這是它在影像辨識和自然語言處理中表現卓越的原因。"),
            QuizItem(question="激活函數（Activation Function）的主要作用是什麼？", options=["引入非線性，讓網路能學習複雜模式", "加速矩陣乘法的計算速度", "決定輸入特徵的數量"], correctIndex=0, explanation="若沒有激活函數，多層神經網路等同於單層線性變換，無論多深都無法學習非線性特徵。ReLU（max(0,x)）是最常用的激活函數，計算快且不易梯度消失。"),
            QuizItem(question="訓練時，若訓練損失下降但驗證損失上升，代表什麼？", options=["模型開始過擬合訓練資料", "模型已完美收斂，可以停止訓練", "需要繼續增加訓練輪數"], correctIndex=0, explanation="這是最經典的過擬合信號：模型記住了訓練資料的雜訊，在新資料上表現惡化。解決方法包括 Early Stopping（提早停止）、Dropout 或 L2 正則化。"),
        ],
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


class LinearRegressionInput(BaseModel):
    x_values: List[float]
    y_values: List[float]


@app.post("/api/run-linear-regression")
def run_linear_regression(data: LinearRegressionInput):
    if len(data.x_values) < 2:
        raise HTTPException(status_code=400, detail="至少需要 2 個資料點")
    if len(data.x_values) != len(data.y_values):
        raise HTTPException(status_code=400, detail="X 與 Y 的資料點數量必須相同")
    if len(data.x_values) > 200:
        raise HTTPException(status_code=400, detail="資料點上限為 200 個")

    X = np.array(data.x_values).reshape(-1, 1)
    y = np.array(data.y_values)

    model = SklearnLR()
    model.fit(X, y)

    slope = float(model.coef_[0])
    intercept = float(model.intercept_)
    r_squared = float(model.score(X, y))

    x_min, x_max = float(np.min(X)), float(np.max(X))
    line_x = [x_min, x_max]
    line_y = [slope * x_min + intercept, slope * x_max + intercept]

    predictions = [round(slope * x + intercept, 4) for x in data.x_values]

    return {
        "slope": round(slope, 4),
        "intercept": round(intercept, 4),
        "r_squared": round(r_squared, 4),
        "x_values": data.x_values,
        "y_values": data.y_values,
        "predictions": predictions,
        "line_x": line_x,
        "line_y": [round(v, 4) for v in line_y],
    }


class SimulateLinearRegressionInput(BaseModel):
    n: int
    a: float
    b: float
    var: float


@app.post("/api/simulate-linear-regression")
def simulate_linear_regression(data: SimulateLinearRegressionInput):
    if not (5 <= data.n <= 500):
        raise HTTPException(status_code=400, detail="n 必須介於 5 ~ 500 之間")
    if not (-200 <= data.a <= 200):
        raise HTTPException(status_code=400, detail="a 超出範圍")
    var = max(0.0, data.var)

    rng = np.random.default_rng()
    x_vals = rng.uniform(-100, 100, data.n)
    noise = rng.normal(0, float(np.sqrt(var)), data.n) if var > 0 else np.zeros(data.n)
    y_vals = data.a * x_vals + data.b + noise

    X = x_vals.reshape(-1, 1)
    model = SklearnLR()
    model.fit(X, y_vals)

    fitted_a = float(model.coef_[0])
    fitted_b = float(model.intercept_)
    r_squared = float(model.score(X, y_vals))

    y_pred = model.predict(X)
    residuals = np.abs(y_vals - y_pred)
    top10_idx = np.argsort(residuals)[-10:][::-1].tolist()

    true_line_y = [data.a * -100 + data.b, data.a * 100 + data.b]
    fitted_line_y = [fitted_a * -100 + fitted_b, fitted_a * 100 + fitted_b]
    rmse = float(np.sqrt(np.mean((y_vals - y_pred) ** 2)))

    return {
        "x_values": [round(float(v), 3) for v in x_vals],
        "y_values": [round(float(v), 3) for v in y_vals],
        "fitted_slope": round(fitted_a, 4),
        "fitted_intercept": round(fitted_b, 4),
        "r_squared": round(r_squared, 4),
        "rmse": round(rmse, 4),
        "true_line_y": [round(v, 4) for v in true_line_y],
        "fitted_line_y": [round(v, 4) for v in fitted_line_y],
        "outlier_indices": top10_idx,
        "residuals": [round(float(v), 3) for v in residuals],
    }


class SimulateSVMInput(BaseModel):
    C: float = 1.0


@app.post("/api/simulate-svm")
def simulate_svm(data: SimulateSVMInput):
    C = max(0.01, min(100.0, float(data.C)))
    X, y = make_classification(
        n_samples=200, n_features=2, n_informative=2,
        n_redundant=0, n_clusters_per_class=1, random_state=42,
    )
    X_scaled = StandardScaler().fit_transform(X)
    model = SVC(kernel="linear", C=C)
    model.fit(X_scaled, y)
    w = model.coef_[0]
    b = float(model.intercept_[0])
    margin = round(2.0 / float(np.linalg.norm(w)), 4)
    preds = model.predict(X_scaled)
    return {
        "points": [
            {"x": round(float(X_scaled[i, 0]), 3), "y": round(float(X_scaled[i, 1]), 3), "label": int(y[i])}
            for i in range(len(X_scaled))
        ],
        "coef": [round(float(w[0]), 6), round(float(w[1]), 6)],
        "intercept": b,
        "margin_width": margin,
        "n_support": int(sum(model.n_support_)),
        "accuracy": round(float(accuracy_score(y, preds)), 4),
        "support_vectors": [
            {"x": round(float(sv[0]), 3), "y": round(float(sv[1]), 3)}
            for sv in model.support_vectors_
        ],
    }


@app.post("/api/simulate-random-forest")
def simulate_random_forest():
    X, y = make_classification(n_samples=300, n_features=10, n_informative=5, random_state=42)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
    n_est_list = [1, 3, 5, 10, 20, 30, 50, 75, 100, 150, 200]
    curve = []
    for n in n_est_list:
        m = RandomForestClassifier(n_estimators=n, random_state=42)
        m.fit(X_train, y_train)
        curve.append({"n": n, "acc": round(float(accuracy_score(y_test, m.predict(X_test))), 4)})
    importances = sorted(
        [{"feature": f"特徵 {i}", "importance": round(float(v), 4)} for i, v in enumerate(m.feature_importances_)],
        key=lambda x: x["importance"], reverse=True,
    )
    return {
        "curve": curve,
        "importances": importances,
        "n_train": len(X_train),
        "n_test": len(X_test),
        "final_acc": curve[-1]["acc"],
    }


@app.post("/api/simulate-pca")
def simulate_pca():
    X, y = make_classification(
        n_samples=200, n_features=10, n_informative=8,
        n_redundant=0, random_state=42,
    )
    X_scaled = StandardScaler().fit_transform(X)
    pca = PCA(n_components=10)
    X_pca = pca.fit_transform(X_scaled)
    evr = pca.explained_variance_ratio_
    return {
        "points": [
            {"x": round(float(X_pca[i, 0]), 3), "y": round(float(X_pca[i, 1]), 3), "label": int(y[i])}
            for i in range(len(X_pca))
        ],
        "evr": [round(float(v), 4) for v in evr],
        "cumulative_evr": [round(float(np.sum(evr[: k + 1])), 4) for k in range(len(evr))],
    }


class SimulateDecisionTreeInput(BaseModel):
    max_depth: int = 3


@app.post("/api/simulate-decision-tree")
def simulate_decision_tree(data: SimulateDecisionTreeInput):
    depth = max(1, min(10, int(data.max_depth)))
    X, y = make_classification(
        n_samples=200, n_features=2, n_informative=2,
        n_redundant=0, n_clusters_per_class=1, random_state=42,
    )
    X_scaled = StandardScaler().fit_transform(X)
    model = DecisionTreeClassifier(max_depth=depth, random_state=42)
    model.fit(X_scaled, y)
    preds = model.predict(X_scaled)

    # Build tree structure for visualization (BFS, capped at 63 nodes = depth 6)
    from sklearn.tree import _tree
    tree = model.tree_
    def recurse(node, depth_left):
        if tree.children_left[node] == _tree.TREE_LEAF or depth_left == 0:
            vals = tree.value[node][0]
            cls = int(np.argmax(vals))
            return {"leaf": True, "class": cls, "samples": int(tree.n_node_samples[node]),
                    "impurity": round(float(tree.impurity[node]), 4)}
        return {
            "leaf": False,
            "feature": int(tree.feature[node]),
            "threshold": round(float(tree.threshold[node]), 3),
            "samples": int(tree.n_node_samples[node]),
            "impurity": round(float(tree.impurity[node]), 4),
            "left": recurse(tree.children_left[node], depth_left - 1),
            "right": recurse(tree.children_right[node], depth_left - 1),
        }

    tree_json = recurse(0, depth)
    return {
        "points": [
            {"x": round(float(X_scaled[i, 0]), 3), "y": round(float(X_scaled[i, 1]), 3), "label": int(y[i])}
            for i in range(len(X_scaled))
        ],
        "tree": tree_json,
        "accuracy": round(float(accuracy_score(y, preds)), 4),
        "n_leaves": int(model.get_n_leaves()),
        "max_depth": int(model.get_depth()),
    }


class SimulateNeuralNetInput(BaseModel):
    hidden_layer_sizes: list[int] = [16, 8]
    activation: str = "relu"


@app.post("/api/simulate-neural-network")
def simulate_neural_network(data: SimulateNeuralNetInput):
    sizes = tuple(max(1, min(256, s)) for s in (data.hidden_layer_sizes or [16, 8])[:4])
    act = data.activation if data.activation in ("relu", "tanh", "logistic") else "relu"
    X, y = make_classification(
        n_samples=300, n_features=2, n_informative=2,
        n_redundant=0, n_clusters_per_class=1, random_state=42,
    )
    X_scaled = StandardScaler().fit_transform(X)
    model = MLPClassifier(
        hidden_layer_sizes=sizes,
        activation=act,
        max_iter=500,
        random_state=42,
        learning_rate_init=0.01,
    )
    model.fit(X_scaled, y)
    preds = model.predict(X_scaled)

    # Decision boundary grid (30×30)
    xx = np.linspace(X_scaled[:, 0].min() - 0.3, X_scaled[:, 0].max() + 0.3, 30)
    yy = np.linspace(X_scaled[:, 1].min() - 0.3, X_scaled[:, 1].max() + 0.3, 30)
    grid = np.array([[xi, yi] for yi in yy for xi in xx])
    grid_preds = model.predict_proba(grid)[:, 1]

    # Architecture description for visualization
    layer_sizes = [2] + list(sizes) + [1]

    return {
        "points": [
            {"x": round(float(X_scaled[i, 0]), 3), "y": round(float(X_scaled[i, 1]), 3), "label": int(y[i])}
            for i in range(len(X_scaled))
        ],
        "grid": {
            "x": [round(float(v), 3) for v in xx],
            "y": [round(float(v), 3) for v in yy],
            "probs": [round(float(v), 3) for v in grid_preds],
        },
        "accuracy": round(float(accuracy_score(y, preds)), 4),
        "n_iter": int(model.n_iter_),
        "loss": round(float(model.loss_), 4),
        "layer_sizes": layer_sizes,
        "activation": act,
    }


@app.post("/api/simulate-naive-bayes")
def simulate_naive_bayes():
    X, y = make_classification(
        n_samples=300, n_features=4, n_informative=2,
        n_redundant=0, random_state=42,
    )
    X_scaled = StandardScaler().fit_transform(X)
    model = GaussianNB()
    model.fit(X_scaled, y)
    # Pick feature with best class separation (highest |μ1−μ0| / avg σ)
    seps = [
        abs(model.theta_[1, f] - model.theta_[0, f])
        / ((np.sqrt(model.var_[0, f]) + np.sqrt(model.var_[1, f])) / 2)
        for f in range(X_scaled.shape[1])
    ]
    feat = int(np.argmax(seps))
    return {
        "points": [
            {"x": round(float(X_scaled[i, feat]), 3), "label": int(y[i])}
            for i in range(len(X_scaled))
        ],
        "class0": {
            "mu": round(float(model.theta_[0, feat]), 4),
            "sigma": round(float(np.sqrt(model.var_[0, feat])), 4),
            "prior": round(float(model.class_prior_[0]), 4),
        },
        "class1": {
            "mu": round(float(model.theta_[1, feat]), 4),
            "sigma": round(float(np.sqrt(model.var_[1, feat])), 4),
            "prior": round(float(model.class_prior_[1]), 4),
        },
    }


@app.post("/api/simulate-knn")
def simulate_knn():
    X, y = make_classification(
        n_samples=200, n_features=2, n_informative=2,
        n_redundant=0, n_clusters_per_class=1, random_state=7,
    )
    X_scaled = StandardScaler().fit_transform(X)
    return {
        "points": [
            {"x": round(float(X_scaled[i, 0]), 3), "y": round(float(X_scaled[i, 1]), 3), "label": int(y[i])}
            for i in range(len(X_scaled))
        ],
    }


@app.post("/api/simulate-logistic-regression")
def simulate_logistic_regression():
    X, y = make_classification(
        n_samples=200, n_features=2, n_informative=2,
        n_redundant=0, n_clusters_per_class=1, random_state=42,
    )
    X_scaled = StandardScaler().fit_transform(X)
    model = SklearnLGR(max_iter=1000, random_state=42)
    model.fit(X_scaled, y)
    probs = model.predict_proba(X_scaled)[:, 1]
    return {
        "points": [
            {
                "x": round(float(X_scaled[i, 0]), 3),
                "y": round(float(X_scaled[i, 1]), 3),
                "label": int(y[i]),
                "prob": round(float(probs[i]), 4),
            }
            for i in range(len(X_scaled))
        ],
        "coef": [round(float(model.coef_[0][0]), 6), round(float(model.coef_[0][1]), 6)],
        "intercept": round(float(model.intercept_[0]), 6),
    }


class SimulateKMeansInput(BaseModel):
    n_clusters: int = 4


@app.post("/api/simulate-kmeans")
def simulate_kmeans(data: SimulateKMeansInput):
    n_clusters = max(1, min(10, data.n_clusters))
    X, _ = make_blobs(n_samples=200, centers=4, cluster_std=1.2, random_state=42)
    X_scaled = StandardScaler().fit_transform(X)
    model = KMeans(n_clusters=n_clusters, random_state=42, n_init="auto")
    labels = model.fit_predict(X_scaled)
    centers = model.cluster_centers_
    inertia = float(model.inertia_)
    sil = float(silhouette_score(X_scaled, labels)) if n_clusters > 1 else 0.0
    return {
        "points": [
            {"x": round(float(X_scaled[i, 0]), 3), "y": round(float(X_scaled[i, 1]), 3), "label": int(labels[i])}
            for i in range(len(X_scaled))
        ],
        "centers": [
            {"x": round(float(centers[j, 0]), 3), "y": round(float(centers[j, 1]), 3), "label": j}
            for j in range(n_clusters)
        ],
        "inertia": round(inertia, 2),
        "silhouette": round(sil, 4),
        "n_clusters": n_clusters,
    }


class RunCodeInput(BaseModel):
    algorithm_id: int
    params: dict = {}


@app.post("/api/run-code")
def run_code(data: RunCodeInput):
    aid = data.algorithm_id
    params = data.params
    start = time.time()

    def elapsed_ms():
        return f"{(time.time() - start) * 1000:.1f} ms"

    try:
        if aid == 0:
            X, y = make_regression(n_samples=200, n_features=3, noise=20, random_state=42)
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            model = SklearnLR()
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
            r2 = float(r2_score(y_test, preds))
            return {"lines": [
                "模型完成訓練（make_regression，200 樣本，3 特徵）",
                f"RMSE: {rmse:.4f}",
                f"R-squared: {r2:.4f}",
                f"執行時間: {elapsed_ms()}",
            ]}

        elif aid == 1:
            max_iter = int(params.get("max_iter", 1000))
            X, y = make_classification(n_samples=200, n_features=10, random_state=42)
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            model = SklearnLGR(max_iter=max_iter, random_state=42)
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            acc = accuracy_score(y_test, preds)
            f1 = f1_score(y_test, preds)
            return {"lines": [
                f"模型完成訓練（make_classification，200 樣本，max_iter={max_iter}）",
                f"Accuracy: {acc:.4f}",
                f"F1-score: {f1:.4f}",
                f"執行時間: {elapsed_ms()}",
            ]}

        elif aid == 2:
            max_depth = int(params.get("max_depth", 4))
            X, y = make_classification(n_samples=200, n_features=10, random_state=42)
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            model = DecisionTreeClassifier(max_depth=max_depth, random_state=42)
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            acc = accuracy_score(y_test, preds)
            f1 = f1_score(y_test, preds)
            actual_depth = model.get_depth()
            return {"lines": [
                f"決策樹已建立（max_depth={max_depth}，實際深度={actual_depth}）",
                f"Accuracy: {acc:.4f}",
                f"F1-score: {f1:.4f}",
                f"執行時間: {elapsed_ms()}",
            ]}

        elif aid == 3:
            n_est = int(params.get("n_estimators", 100))
            X, y = make_classification(n_samples=200, n_features=10, random_state=42)
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            model = RandomForestClassifier(n_estimators=n_est, random_state=42)
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            acc = accuracy_score(y_test, preds)
            top_idx = int(np.argmax(model.feature_importances_))
            top_imp = float(model.feature_importances_[top_idx])
            return {"lines": [
                f"森林投票完成（{n_est} 棵決策樹）",
                f"Accuracy: {acc:.4f}",
                f"最重要特徵: feature_{top_idx}（重要度 {top_imp:.3f}）",
                f"執行時間: {elapsed_ms()}",
            ]}

        elif aid == 4:
            C = float(params.get("C", 1.0))
            X, y = make_classification(n_samples=200, n_features=10, random_state=42)
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            scaler = StandardScaler()
            model = SVC(kernel="rbf", C=C, gamma="scale", random_state=42)
            model.fit(scaler.fit_transform(X_train), y_train)
            preds = model.predict(scaler.transform(X_test))
            acc = accuracy_score(y_test, preds)
            f1 = f1_score(y_test, preds)
            n_sv = int(np.sum(model.n_support_))
            return {"lines": [
                f"最佳分隔超平面已更新（RBF kernel，C={C}）",
                f"Accuracy: {acc:.4f}",
                f"F1-score: {f1:.4f}",
                f"支持向量數: {n_sv}",
                f"執行時間: {elapsed_ms()}",
            ]}

        elif aid == 5:
            k = int(params.get("n_neighbors", 5))
            X, y = make_classification(n_samples=200, n_features=10, random_state=42)
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            scaler = StandardScaler()
            model = KNeighborsClassifier(n_neighbors=k)
            model.fit(scaler.fit_transform(X_train), y_train)
            preds = model.predict(scaler.transform(X_test))
            acc = accuracy_score(y_test, preds)
            f1 = f1_score(y_test, preds)
            return {"lines": [
                f"鄰近點搜尋完成（K={k}）",
                f"Accuracy: {acc:.4f}",
                f"F1-score: {f1:.4f}",
                f"執行時間: {elapsed_ms()}",
            ]}

        elif aid == 6:
            X, y = make_classification(n_samples=200, n_features=10, random_state=42)
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            model = GaussianNB()
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            acc = accuracy_score(y_test, preds)
            f1 = f1_score(y_test, preds)
            return {"lines": [
                "機率表已估計（GaussianNB，200 樣本）",
                f"Accuracy: {acc:.4f}",
                f"F1-score: {f1:.4f}",
                f"執行時間: {elapsed_ms()}",
            ]}

        elif aid == 7:
            n_clusters = int(params.get("n_clusters", 4))
            X, _ = make_blobs(n_samples=200, centers=4, random_state=42)
            X_scaled = StandardScaler().fit_transform(X)
            model = KMeans(n_clusters=n_clusters, random_state=42, n_init="auto")
            labels = model.fit_predict(X_scaled)
            inertia = float(model.inertia_)
            sil = float(silhouette_score(X_scaled, labels)) if n_clusters > 1 else 0.0
            return {"lines": [
                f"群中心重新配置完成（K={n_clusters}）",
                f"Inertia: {inertia:.2f}",
                f"Silhouette Score: {sil:.4f}",
                f"執行時間: {elapsed_ms()}",
            ]}

        elif aid == 8:
            n_comp = int(params.get("n_components", 2))
            X, _ = make_classification(n_samples=200, n_features=20, n_informative=8, random_state=42)
            X_scaled = StandardScaler().fit_transform(X)
            n_comp = min(n_comp, X_scaled.shape[1])
            pca = PCA(n_components=n_comp)
            pca.fit_transform(X_scaled)
            evr = pca.explained_variance_ratio_
            total_var = float(np.sum(evr) * 100)
            evr_str = ", ".join([f"{v*100:.1f}%" for v in evr])
            return {"lines": [
                f"投影完成（{n_comp} 個主成分，原始 20 維）",
                f"各成分解釋變異: {evr_str}",
                f"總解釋變異: {total_var:.1f}%",
                f"執行時間: {elapsed_ms()}",
            ]}

        elif aid == 9:
            hidden = int(params.get("hidden_size", 64))
            X, y = make_classification(n_samples=300, n_features=10, random_state=42)
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            scaler = StandardScaler()
            model = MLPClassifier(hidden_layer_sizes=(hidden,), max_iter=200, random_state=42)
            model.fit(scaler.fit_transform(X_train), y_train)
            preds = model.predict(scaler.transform(X_test))
            acc = accuracy_score(y_test, preds)
            loss = float(model.loss_)
            n_iter = model.n_iter_
            return {"lines": [
                f"神經網路訓練完成（隱藏層={hidden} 神經元，{n_iter} 輪）",
                f"Accuracy: {acc:.4f}",
                f"Training Loss: {loss:.4f}",
                f"執行時間: {elapsed_ms()}",
            ]}

        else:
            raise HTTPException(status_code=400, detail="Invalid algorithm_id")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"執行失敗: {str(e)}")


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

