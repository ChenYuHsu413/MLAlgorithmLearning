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

# Setup Gemini Client (Primary Free-Tier option)
gemini_api_key = os.getenv("GEMINI_API_KEY")
gemini_model = None
if gemini_api_key:
    try:
        genai.configure(api_key=gemini_api_key)
        gemini_model = genai.GenerativeModel(
            model_name='gemini-3.5-flash',
            system_instruction=SYSTEM_PROMPT
        )
        print("INFO: Gemini API configured successfully (Primary LLM).")
    except Exception as e:
        print(f"Error configuring Gemini: {e}")

# Setup Groq Client (Alternative Free-Tier option)
groq_api_key = os.getenv("GROQ_API_KEY")
groq_client = None
if groq_api_key:
    try:
        groq_client = AsyncOpenAI(
            api_key=groq_api_key,
            base_url="https://api.groq.com/openai/v1"
        )
        print("INFO: Groq API configured successfully (Llama 3).")
    except Exception as e:
        print(f"Error configuring Groq: {e}")

# Setup OpenRouter Client (Alternative Free-Tier option)
openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
openrouter_client = None
if openrouter_api_key:
    try:
        openrouter_client = AsyncOpenAI(
            api_key=openrouter_api_key,
            base_url="https://openrouter.ai/api/v1"
        )
        print("INFO: OpenRouter API configured successfully.")
    except Exception as e:
        print(f"Error configuring OpenRouter: {e}")

# Setup OpenAI Client (Alternative option)
openai_api_key = os.getenv("OPENAI_API_KEY")
openai_client = None
if openai_api_key:
    try:
        openai_client = AsyncOpenAI(api_key=openai_api_key)
        print("INFO: OpenAI API configured successfully.")
    except Exception as e:
        print(f"Error configuring OpenAI: {e}")

if not gemini_model and not groq_client and not openrouter_client and not openai_client:
    print("WARNING: No AI API keys (Gemini, Groq, OpenRouter, OpenAI) configured. Chatbot will run in mock streaming fallback mode.")




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

            if gemini_model:
                try:
                    # Construct context prompt
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
                except Exception as e:
                    await websocket.send_text(f"\n[系統錯誤] 無法連結 Gemini API: {str(e)}\n")

            elif groq_client:
                messages = [{"role": "system", "content": SYSTEM_PROMPT}]
                if algo_context:
                    messages.append({
                        "role": "system",
                        "content": f"學生目前正在瀏覽【{algo_context}】演算法的章節。請針對該演算法與其相關特質（如分類/回歸屬性、建模細節）回答或引導學生的疑惑。"
                    })
                messages.append({"role": "user", "content": user_message})

                try:
                    # Stream answer from Groq
                    response = await groq_client.chat.completions.create(
                        model="llama3-8b-8192",
                        messages=messages,
                        stream=True,
                    )
                    async for chunk in response:
                        text_chunk = chunk.choices[0].delta.content
                        if text_chunk:
                            await websocket.send_text(text_chunk)
                except Exception as e:
                    await websocket.send_text(f"\n[系統錯誤] 無法連結 Groq API: {str(e)}\n")

            elif openrouter_client:
                messages = [{"role": "system", "content": SYSTEM_PROMPT}]
                if algo_context:
                    messages.append({
                        "role": "system",
                        "content": f"學生目前正在瀏覽【{algo_context}】演算法的章節。請針對該演算法與其相關特質（如分類/回歸屬性、建模細節）回答或引導學生的疑惑。"
                    })
                messages.append({"role": "user", "content": user_message})

                try:
                    # Stream answer from OpenRouter
                    response = await openrouter_client.chat.completions.create(
                        model="meta-llama/llama-3-8b-instruct:free",
                        messages=messages,
                        stream=True,
                    )
                    async for chunk in response:
                        text_chunk = chunk.choices[0].delta.content
                        if text_chunk:
                            await websocket.send_text(text_chunk)
                except Exception as e:
                    await websocket.send_text(f"\n[系統錯誤] 無法連結 OpenRouter API: {str(e)}\n")

            elif openai_client:
                # Construct messages context for OpenAI
                messages = [{"role": "system", "content": SYSTEM_PROMPT}]
                if algo_context:
                    messages.append({
                        "role": "system",
                        "content": f"學生目前正在瀏覽【{algo_context}】演算法的章節。請針對該演算法與其相關特質（如分類/回歸屬性、建模細節）回答或引導學生的疑惑。"
                    })
                messages.append({"role": "user", "content": user_message})

                try:
                    # Stream answer from OpenAI
                    response = await openai_client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=messages,
                        stream=True,
                    )
                    async for chunk in response:
                        text_chunk = chunk.choices[0].delta.content
                        if text_chunk:
                            await websocket.send_text(text_chunk)
                except Exception as e:
                    await websocket.send_text(f"\n[系統錯誤] 無法連結 OpenAI API: {str(e)}\n")
            else:
                # Simulated response (Mock Stream Mode)
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

