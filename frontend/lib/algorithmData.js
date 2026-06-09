export const animationDescriptions = {
  0: ['初始狀態：資料點散布，等待擬合', '正斜率：趨勢向右上方', '陡斜率：強正相關擬合', '負斜率：反向趨勢', '水平線：無線性相關基準'],
  1: ['Sigmoid 初始：分類邊界剛建立', '邊界右移：決策面調整中', '邊界確立：清晰的二元分類區', '高置信度：多數點正確分類', '極端分離：兩類幾乎完全分開'],
  2: ['完整決策樹：所有分支展開', '左子樹路徑：追蹤左側決策', '右子樹路徑：追蹤右側決策', '剪枝後：更簡潔的規則樹', '從根重長：樹結構重新建立'],
  3: ['單棵樹：森林最基本單元', '兩棵投票：集成開始，穩定性提升', '三棵並列：多數決效果更強', '完整森林：最大集成效果', '不同組合：展示多樣化樹結構'],
  4: ['嘗試分隔線：初始邊界', '調整間隔：尋找更大間距', '最佳超平面：最大間隔確立', '調整角度：另一線性邊界', 'RBF 核心：圓形邊界處理非線性'],
  5: ['目標點出現：待分類樣本（紫色）', '擴大搜尋：搜尋半徑逐漸增大', '鎖定鄰居：K 個最近鄰已確認', '目標移動：換位置重新搜尋鄰居', '另一目標：展示不同 KNN 情境'],
  6: ['初始分布：兩類別的先驗機率', '左類別優勢：證據偏向左側', '右類別優勢：證據偏向右側', '接近競爭：兩類機率相當', '高不確定性：邊界落在中央'],
  7: ['隨機散布：資料點尚未分群', '初步分配：點被分到初始群', '群心更新：中心移到重心位置', '幾乎收斂：群心幾乎不再移動', '重新初始化：換起始點再執行'],
  8: ['高維分布：原始資料的散布情形', '找主成分：PC1 方向確立（最大變異）', '投影完成：資料投影到 PC1 軸上', '雙主成分：同時顯示 PC1 與 PC2', '變異解釋比：各主成分貢獻的長條圖'],
  9: ['全連接啟動：所有神經元初始狀態', '稀疏激活：部分神經元被抑制', '另一激活模式：不同特徵組合', '接近輸出層：分類前的激活集中', '最終預測：輸出層對應分類結果'],
};

export const implementationExamples = {
  0: {
    title: '房價預測：用面積預測價格',
    library: 'scikit-learn / LinearRegression',
    steps: ['準備連續型目標值', '切分訓練與測試資料', 'fit 後用 predict 產生價格預測'],
    code: `from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split

X = houses[['area', 'rooms', 'age']]
y = houses['price']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
model = LinearRegression()
model.fit(X_train, y_train)

predictions = model.predict(X_test)`,
  },
  1: {
    title: '垃圾郵件分類：預測 spam / not spam',
    library: 'scikit-learn / LogisticRegression',
    steps: ['把文字轉成特徵矩陣', '訓練分類器', '輸出類別與機率'],
    code: `from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(emails)

model = LogisticRegression(max_iter=1000)
model.fit(X, labels)

probability = model.predict_proba(vectorizer.transform(new_emails))
classes = model.predict(vectorizer.transform(new_emails))`,
  },
  2: {
    title: '貸款風險：用規則樹判斷是否違約',
    library: 'scikit-learn / DecisionTreeClassifier',
    steps: ['選擇可解釋特徵', '限制 max_depth 避免過擬合', '檢視樹的分裂規則'],
    code: `from sklearn.tree import DecisionTreeClassifier

X = applicants[['income', 'credit_score', 'debt_ratio']]
y = applicants['defaulted']

model = DecisionTreeClassifier(max_depth=4, random_state=42)
model.fit(X, y)

risk = model.predict(new_applicants)`,
  },
  3: {
    title: '疾病風險：多棵樹投票提高穩定性',
    library: 'scikit-learn / RandomForestClassifier',
    steps: ['準備多個臨床特徵', '訓練多棵決策樹', '查看 feature_importances_'],
    code: `from sklearn.ensemble import RandomForestClassifier

X = patients[['blood_pressure', 'cholesterol', 'age', 'bmi']]
y = patients['has_disease']

model = RandomForestClassifier(n_estimators=200, random_state=42)
model.fit(X, y)

diagnosis = model.predict(new_patients)
importance = model.feature_importances_`,
  },
  4: {
    title: '手寫數字分類：用最大間隔分出類別',
    library: 'scikit-learn / SVC',
    steps: ['標準化特徵', '選擇 kernel', '調整 C 與 gamma'],
    code: `from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

model = make_pipeline(
    StandardScaler(),
    SVC(kernel='rbf', C=1.0, gamma='scale')
)

model.fit(X_train, y_train)
digits = model.predict(X_test)`,
  },
  5: {
    title: '推薦系統：找出最相似的鄰居',
    library: 'scikit-learn / KNeighborsClassifier',
    steps: ['標準化特徵距離', '設定 K 值', '找最近鄰居投票'],
    code: `from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_scaled = scaler.fit_transform(user_features)

model = KNeighborsClassifier(n_neighbors=5, metric='euclidean')
model.fit(X_scaled, labels)

similar_users = model.predict(scaler.transform(new_user))`,
  },
  6: {
    title: '文件分類：用詞頻估計主題機率',
    library: 'scikit-learn / MultinomialNB',
    steps: ['轉換文字為詞頻矩陣', '訓練貝葉斯分類器', '預測類別機率'],
    code: `from sklearn.naive_bayes import MultinomialNB
from sklearn.feature_extraction.text import CountVectorizer

vectorizer = CountVectorizer()
X = vectorizer.fit_transform(documents)

model = MultinomialNB()
model.fit(X, labels)

topic = model.predict(vectorizer.transform(new_docs))`,
  },
  7: {
    title: '客戶分群：用購買行為分群',
    library: 'scikit-learn / KMeans',
    steps: ['標準化特徵', '設定群數 K', '取得群標籤'],
    code: `from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

X_scaled = StandardScaler().fit_transform(purchase_data)

model = KMeans(n_clusters=4, random_state=42, n_init='auto')
model.fit(X_scaled)

segments = model.fit_predict(X_scaled)

customers['segment'] = segments`,
  },
  8: {
    title: '資料視覺化：把高維資料降到 2D',
    library: 'scikit-learn / PCA',
    steps: ['先標準化資料', '設定 n_components', '投影到低維空間'],
    code: `from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

X_scaled = StandardScaler().fit_transform(features)

pca = PCA(n_components=2)
points_2d = pca.fit_transform(X_scaled)

explained = pca.explained_variance_ratio_`,
  },
  9: {
    title: '影像分類：用多層神經網路學特徵',
    library: 'TensorFlow / Keras',
    steps: ['定義網路層', '設定 loss 與 optimizer', '用 epochs 訓練模型'],
    code: `import tensorflow as tf

model = tf.keras.Sequential([
    tf.keras.layers.Flatten(input_shape=(28, 28)),
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dense(10, activation='softmax')
])

model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

model.fit(x_train, y_train, epochs=8, validation_split=0.2)`,
  },
};

export const filters = ['全部', '監督式', '非監督式', '集成', '深度學習'];

export const executionResults = {
  0: ['模型完成訓練', 'RMSE: 18423.7', '預測價格: [312000, 428500, 515200]'],
  1: ['模型完成訓練', 'Accuracy: 0.91', 'Spam probability: 0.82'],
  2: ['決策樹已建立', 'Tree depth: 4', 'Accuracy: 0.88'],
  3: ['森林投票完成', 'Accuracy: 0.94', 'Top feature: credit_score'],
  4: ['最佳分隔超平面已更新', 'F1-score: 0.92', 'Support vectors: 37'],
  5: ['鄰近點搜尋完成', 'K=5', 'Accuracy: 0.87'],
  6: ['機率表已估計', 'Accuracy: 0.89', 'Predicted topic: technology'],
  7: ['群中心重新配置完成', 'Clusters: 4', 'Silhouette: 0.62'],
  8: ['投影完成', 'Explained variance: 78%', 'Output shape: (120, 2)'],
  9: ['模型完成 8 epochs 訓練', 'Validation accuracy: 0.96', 'Loss: 0.11'],
};

export function chartType(id) {
  if ([2, 3].includes(id)) return 'tree';
  if (id === 7) return 'cluster';
  if (id === 9) return 'network';
  return 'line';
}

export const chartLegend = {
  0: [
    { symbol: '●', color: '#ef4444', label: '資料點（真實值）' },
    { symbol: '—', color: '#3b82f6', label: '擬合直線（預測值）' },
  ],
  1: [
    { symbol: '●', color: '#ef4444', label: '類別 A（負例）' },
    { symbol: '●', color: '#22c55e', label: '類別 B（正例）' },
    { symbol: '—', color: '#3b82f6', label: 'Sigmoid 決策邊界' },
  ],
  2: [
    { symbol: '◆', color: '#eab308', label: '決策節點（分裂條件）' },
    { symbol: '■', color: '#86efac', label: '葉節點（預測結果）' },
  ],
  3: [
    { symbol: '▶', color: '#22c55e', label: '單棵決策樹' },
    { symbol: '→', color: '#16a34a', label: '多樹整合投票' },
  ],
  4: [
    { symbol: '●', color: '#ef4444', label: '類別 A 樣本' },
    { symbol: '●', color: '#3b82f6', label: '類別 B 樣本' },
    { symbol: '—', color: '#f59e0b', label: '決策超平面（最大間隔）' },
  ],
  5: [
    { symbol: '●', color: '#a855f7', label: '待分類目標點' },
    { symbol: '●', color: '#6366f1', label: '訓練資料點' },
    { symbol: '○', color: '#6366f1', label: 'K 近鄰搜尋範圍' },
  ],
  6: [
    { symbol: '▬', color: '#ef4444', label: '類別 A 的特徵分布' },
    { symbol: '▬', color: '#a855f7', label: '類別 B 的特徵分布' },
  ],
  7: [
    { symbol: '●', color: '#06b6d4', label: '資料點（群成員）' },
    { symbol: '✕', color: '#f59e0b', label: '群中心（Centroid）' },
  ],
  8: [
    { symbol: '●', color: '#8b5cf6', label: '原始資料點' },
    { symbol: '→', color: '#ef4444', label: 'PC1（第一主成分方向）' },
    { symbol: '→', color: '#22c55e', label: 'PC2（第二主成分方向）' },
  ],
  9: [
    { symbol: '●', color: '#f97316', label: '激活神經元' },
    { symbol: '○', color: '#6b7280', label: '抑制神經元' },
    { symbol: '—', color: '#94a3b8', label: '神經元連結（權重）' },
  ],
};

export const mathFormulas = {
  0: { formula: 'ŷ = w₁x₁ + w₂x₂ + … + b', name: '線性方程式', desc: '訓練目標：最小化 MSE = Σ(ŷ − y)² / n' },
  1: { formula: 'P(y=1|x) = 1 / (1 + e⁻ᶻ)，z = w·x + b', name: 'Sigmoid 函數', desc: 'z 是線性分數，Sigmoid 將其壓縮到 0~1 的機率' },
  2: { formula: 'Gini = 1 − Σ pᵢ²', name: 'Gini 不純度', desc: 'pᵢ 是節點中各類別的比例；Gini = 0 表示節點完全純' },
  3: { formula: 'ŷ = majority_vote(T₁(x), T₂(x), …, Tₙ(x))', name: '集成投票', desc: 'n 棵樹各自預測，取多數決（分類）或平均（迴歸）' },
  4: { formula: 'max 2/‖w‖，限制：yᵢ(w·xᵢ + b) ≥ 1', name: '最大間隔目標', desc: '支持向量是離邊界最近的點；‖w‖ 越小間隔越大' },
  5: { formula: 'd(a, b) = √Σ (aⱼ − bⱼ)²', name: '歐氏距離', desc: '找最近的 K 個鄰居，用其標籤投票或平均' },
  6: { formula: 'P(y|x) ∝ P(y) · Π P(xᵢ|y)', name: '貝葉斯定理（條件獨立版）', desc: '先驗機率 × 各特徵似然度，取機率最大的類別' },
  7: { formula: 'argmin Σᵢ Σ_{x∈Cᵢ} ‖x − μᵢ‖²', name: 'K-Means 目標函數', desc: 'μᵢ 是群 i 的中心；最小化群內所有點到中心的距離總和' },
  8: { formula: 'Z = X · W，WᵀW = I（正交）', name: '主成分投影', desc: 'W 的各列是特徵向量（主成分方向）；Z 是降維後的新座標' },
  9: { formula: 'aˡ = f(Wˡ · aˡ⁻¹ + bˡ)', name: '神經元激活（逐層傳遞）', desc: 'f 是激活函數（如 ReLU）；反向傳播用鏈式法則更新 W 和 b' },
};
