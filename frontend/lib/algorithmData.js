export const meta = {
  0: { shortName: '線性迴歸', category: '監督式', task: '迴歸', level: '入門', color: '#ef4444', code: 'LR', concept: '用最佳直線描述特徵與連續數值之間的關係。', bestFor: '房價預測、銷售額、趨勢估計', quiz: ['線性迴歸最適合預測什麼？', ['連續數值', '資料群中心', '圖像邊緣'], 0] },
  1: { shortName: '邏輯迴歸', category: '監督式', task: '分類', level: '入門', color: '#f97316', code: 'LG', concept: '把線性分數轉成機率，常用於二元分類。', bestFor: '垃圾郵件、是否違約、是否罹病', quiz: ['邏輯迴歸輸出的核心意義是什麼？', ['類別機率', '樹的深度', '主成分方向'], 0] },
  2: { shortName: '決策樹', category: '監督式', task: '分類', level: '入門', color: '#eab308', code: 'DT', concept: '用條件分支一步步切分資料，形成容易解釋的規則。', bestFor: '規則清楚、需要解釋的決策問題', quiz: ['決策樹最直觀的優勢是什麼？', ['決策流程易解釋', '永遠不會過擬合', '不需要資料'], 0] },
  3: { shortName: '隨機森林', category: '集成', task: '分類/迴歸', level: '中階', color: '#22c55e', code: 'RF', concept: '組合多棵決策樹，用投票或平均提升穩定性。', bestFor: '高維資料、穩健預測、特徵多的任務', quiz: ['隨機森林如何整合分類結果？', ['投票', '只選第一棵樹', '刪除分支'], 0] },
  4: { shortName: '支援向量機', category: '監督式', task: '分類', level: '中階', color: '#3b82f6', code: 'SV', concept: '尋找最大間隔的分隔邊界，也能處理非線性資料。', bestFor: '中小型高維分類問題', quiz: ['SVM 主要追求最大化什麼？', ['類別間隔', '資料筆數', '群中心數量'], 0] },
  5: { shortName: 'K近鄰', category: '監督式', task: '分類/迴歸', level: '入門', color: '#6366f1', code: 'KN', concept: '找出最相近的 K 個樣本，再投票或平均。', bestFor: '相似性推薦、資料量較小的分類', quiz: ['KNN 預測時主要依賴什麼？', ['鄰近樣本', '反向傳播', '隨機森林'], 0] },
  6: { shortName: '朴素貝葉斯', category: '監督式', task: '分類', level: '入門', color: '#a855f7', code: 'NB', concept: '用貝葉斯定理估計類別機率，假設特徵條件獨立。', bestFor: '文字分類、垃圾郵件過濾', quiz: ['朴素貝葉斯常見假設是什麼？', ['條件獨立', '完全線性', '無需類別'], 0] },
  7: { shortName: 'K-Means 聚類', category: '非監督式', task: '聚類', level: '入門', color: '#06b6d4', code: 'KM', concept: '反覆分配資料到 K 個群，並更新每個群的中心。', bestFor: '客戶分群、市場區隔、探索資料', quiz: ['K-Means 執行前通常要指定什麼？', ['K 值', '標籤答案', '樹深度'], 0] },
  8: { shortName: '主成分分析', category: '非監督式', task: '降維', level: '中階', color: '#8b5cf6', code: 'PC', concept: '找出保留最多變異的方向，把高維資料壓縮到低維。', bestFor: '資料視覺化、降維、去雜訊', quiz: ['PCA 的主要目的通常是什麼？', ['降維', '增加標籤', '產生決策樹'], 0] },
  9: { shortName: '神經網路', category: '深度學習', task: '分類/生成', level: '進階', color: '#f97316', code: 'NN', concept: '透過多層神經元學習複雜非線性映射。', bestFor: '影像、語音、自然語言', quiz: ['神經網路擅長處理哪類關係？', ['複雜非線性', '只能直線', '固定群中心'], 0] },
};

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

export function enrich(algo) {
  return { ...algo, ...meta[algo.id] };
}

export function chartType(id) {
  if ([2, 3].includes(id)) return 'tree';
  if (id === 7) return 'cluster';
  if (id === 9) return 'network';
  return 'line';
}
