from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List


class Algorithm(BaseModel):
    id: int
    name: str
    description: str
    example: str
    advantages: List[str]
    disadvantages: List[str]


# Define your algorithms here. These match the descriptions provided in the study guide.
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
        advantages=[
            "簡單易於實作，計算效率高。",
            "模型解釋性佳，可以觀察各特徵對目標變數的影響。",
        ],
        disadvantages=[
            "只能描述線性關係，無法擬合複雜的非線性模式。",
            "對離群值敏感，可能受到極端點的影響。",
        ],
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
        advantages=[
            "訓練快速、適合大規模數據。",
            "模型輸出概率，便於解釋分類的信心度。",
        ],
        disadvantages=[
            "假設類別之間是線性可分的，對於高度非線性的資料效果不佳。",
            "與線性回歸一樣，對離群值敏感。",
        ],
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
        advantages=[
            "直觀易理解，能直接以圖形方式展示決策流程。",
            "能處理非線性和混合型（數值與類別）特徵。",
        ],
        disadvantages=[
            "容易過擬合，需要限制樹的深度或剪枝以提升泛化能力。",
            "對於少量數據的微小變動，結構可能產生大幅度變化。",
        ],
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
        advantages=[
            "能有效處理高維資料並具有高精度。",
            "內建防止過擬合的機制，對異常值和噪聲較為穩健。",
        ],
        disadvantages=[
            "模型複雜度高，不容易解釋單一預測的決策過程。",
            "訓練和預測速度較單棵決策樹慢，消耗更多資源。",
        ],
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
        advantages=[
            "對於高維特徵空間及非線性問題有良好表現。",
            "只依賴部分訓練樣本（支持向量），在模型構建後記憶體需求較小。",
        ],
        disadvantages=[
            "對於大型數據集訓練時間較長；參數（如核參數、懲罰係數）調整複雜。",
            "不易直接提供機率輸出。",
        ],
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
        advantages=[
            "實現簡單，無需顯式訓練階段。",
            "對於多類別問題效果良好，可靈活調整 K 的大小以控制模型複雜度。",
        ],
        disadvantages=[
            "計算成本高，尤其對於大型資料集，每次預測都需計算全體距離。",
            "對尺度敏感，需要正規化特徵以避免高變量主導結果。",
        ],
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
        advantages=[
            "計算速度快，尤其適合高維稀疏特徵（如文字）。",
            "模型簡單，不需要大量訓練數據即可達到不錯效果。",
        ],
        disadvantages=[
            "假設特徵條件獨立在現實中不常成立，可能影響模型精度。",
            "對於特徵相關性高的情況下表現較差。",
        ],
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
        advantages=[
            "算法簡單易於實現，計算效率高。",
            "對大規模資料集友好，能快速收斂。",
        ],
        disadvantages=[
            "需要事先指定 K 值且對初始簇心敏感，可能陷入局部最小值。",
            "只能找到凸形簇，對於非球形分佈效果不佳。",
        ],
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
        advantages=[
            "能有效降低維度，減少計算成本並提升模型速度。",
            "可用於數據可視化，理解資料內在結構。",
        ],
        disadvantages=[
            "主成分是線性組合，難以解釋每個主成分的物理意義。",
            "只關注變異最大方向，可能忽略對目標預測重要的小變異部分。",
        ],
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
        advantages=[
            "能擬合複雜非線性關係，表現強大。",
            "適用於大規模資料集，隨著資料增多性能可持續提升。",
        ],
        disadvantages=[
            "需要大量計算資源和時間進行訓練，容易過擬合。",
            "模型複雜度高，解釋性差，不易理解內部機制。",
        ],
    ),
]


app = FastAPI(title="Machine Learning Algorithms API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
