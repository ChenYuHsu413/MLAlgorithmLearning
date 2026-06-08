import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { reportGuide, reportInsights } from '../lib/algorithmReport';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const meta = {
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

const implementationExamples = {
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
    steps: ['先做特徵尺度正規化', '選擇 K 值', '用鄰近樣本投票'],
    code: `from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier

model = make_pipeline(
    StandardScaler(),
    KNeighborsClassifier(n_neighbors=5)
)

model.fit(user_features, user_labels)
recommendation_group = model.predict(new_users)`,
  },
  6: {
    title: '新聞分類：用詞彙機率判斷主題',
    library: 'scikit-learn / MultinomialNB',
    steps: ['把文字轉成詞頻特徵', '訓練貝葉斯分類器', '快速預測新文本類別'],
    code: `from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB

vectorizer = CountVectorizer()
X = vectorizer.fit_transform(news_texts)

model = MultinomialNB()
model.fit(X, topics)

topic = model.predict(vectorizer.transform(new_articles))`,
  },
  7: {
    title: '客戶分群：找出相似消費行為',
    library: 'scikit-learn / KMeans',
    steps: ['設定 K 群數量', 'fit 後取得 cluster labels', '分析各群特徵'],
    code: `from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

X = customers[['avg_spend', 'visit_count', 'coupon_usage']]
X_scaled = StandardScaler().fit_transform(X)

model = KMeans(n_clusters=4, random_state=42, n_init='auto')
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

const filters = ['全部', '監督式', '非監督式', '集成', '深度學習'];

function enrich(algo) {
  return { ...algo, ...meta[algo.id] };
}

function MiniChart({ type, color }) {
  const dots = ['12,74', '24,62', '36,58', '48,43', '62,38', '76,24'];
  return (
    <svg className="miniChart" viewBox="0 0 100 80" aria-hidden="true">
      {type === 'tree' ? (
        <>
          <path d="M50 12 L28 34 L18 58 M28 34 L40 58 M50 12 L72 34 L62 58 M72 34 L84 58" />
          {[50, 28, 18, 40, 72, 62, 84].map((x, index) => (
            <circle key={index} cx={x} cy={index === 0 ? 12 : index % 2 ? 34 : 58} r="4" />
          ))}
        </>
      ) : type === 'cluster' ? (
        <>
          {[16, 25, 32, 66, 75, 82].map((x, index) => (
            <circle key={index} cx={x} cy={index < 3 ? 28 + index * 9 : 24 + (index - 3) * 12} r="5" />
          ))}
          {[42, 50, 57].map((x, index) => (
            <circle key={`b${index}`} cx={x} cy={56 + index * 2} r="5" className="warm" />
          ))}
        </>
      ) : type === 'network' ? (
        <>
          <path d="M18 18 L50 30 L82 18 M18 40 L50 30 L82 40 M18 62 L50 52 L82 62 M50 30 L82 62 M50 52 L82 18" />
          {[18, 18, 18, 50, 50, 82, 82, 82].map((x, index) => (
            <circle key={index} cx={x} cy={[18, 40, 62, 30, 52, 18, 40, 62][index]} r="5" />
          ))}
        </>
      ) : (
        <>
          <path className="axis" d="M12 68 H88 M12 68 V10" />
          <path className="line" d="M14 64 C32 54 42 46 55 36 S78 23 88 12" />
          {dots.map((dot) => {
            const [cx, cy] = dot.split(',');
            return <circle key={dot} cx={cx} cy={cy} r="4" />;
          })}
        </>
      )}
      <style jsx>{`
        .miniChart {
          width: 100%;
          height: 82px;
        }
        path {
          fill: none;
          stroke: ${color};
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .axis {
          stroke: var(--chart-axis);
          stroke-width: 2;
        }
        .line {
          stroke: ${color};
        }
        circle {
          fill: ${color};
          opacity: 0.9;
        }
        .warm {
          fill: #fb923c;
        }
      `}</style>
    </svg>
  );
}

function HeroIllustration() {
  const points = [
    ['b', 22, 42], ['b', 38, 58], ['b', 50, 38], ['b', 34, 24], ['r', 66, 26], ['r', 76, 48], ['r', 58, 62], ['r', 82, 30],
  ];
  return (
    <div className="heroArt" aria-hidden="true">
      <div className="laptop">
        <svg viewBox="0 0 260 150">
          <rect x="16" y="12" width="228" height="120" rx="8" />
          <path d="M4 138 H256 L238 148 H22 Z" />
          <path className="curve" d="M78 122 C82 86 112 82 123 60 C132 42 141 28 160 20" />
          {points.map(([kind, cx, cy]) => (
            <circle key={`${kind}-${cx}-${cy}`} className={kind} cx={cx + 42} cy={cy + 16} r="5" />
          ))}
        </svg>
      </div>
      <div className="floatCard treeIcon"><MiniChart type="tree" color="#f59e0b" /></div>
      <div className="floatCard formula">Σx²</div>
      <div className="floatCard bars"><span /><span /><span /></div>
    </div>
  );
}

export default function Home() {
  const [algorithms, setAlgorithms] = useState([]);
  const [activeId, setActiveId] = useState(0);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('全部');
  const [answers, setAnswers] = useState({});
  const [scene, setScene] = useState('light');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/algorithms`)
      .then((res) => {
        if (!res.ok) throw new Error('無法取得資料');
        return res.json();
      })
      .then((data) => {
        const enriched = data.map(enrich);
        setAlgorithms(enriched);
        setActiveId(enriched[0]?.id ?? 0);
      })
      .catch((err) => {
        console.error(err);
        setError('目前無法讀取資料，請確認後端 API 是否已啟動。');
      });
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return algorithms.filter((algo) => {
      const byFilter = filter === '全部' || algo.category === filter;
      const text = `${algo.name} ${algo.shortName} ${algo.task} ${algo.bestFor}`.toLowerCase();
      return byFilter && (!keyword || text.includes(keyword));
    });
  }, [algorithms, filter, query]);

  const active = algorithms.find((algo) => algo.id === activeId) || filtered[0] || algorithms[0];
  const activeExample = active ? implementationExamples[active.id] : null;
  const activeInsight = active ? reportInsights[active.id] : null;
  const done = Object.values(answers).filter(Boolean).length;
  const progress = algorithms.length ? Math.round((done / algorithms.length) * 100) : 0;

  function selectAnswer(algoId, index) {
    const correctIndex = meta[algoId].quiz[2];
    setAnswers((current) => ({ ...current, [algoId]: index === correctIndex }));
  }

  function chartType(id) {
    if ([2, 3].includes(id)) return 'tree';
    if (id === 7) return 'cluster';
    if (id === 9) return 'network';
    return 'line';
  }

  return (
    <main className={`appShell ${scene}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">ML</div>
          <div>
            <strong>機器學習十大演算法</strong>
            <span>互動式學習平台</span>
          </div>
        </div>
        <nav>
          <a className="navActive">首頁總覽</a>
          <span>十大演算法</span>
          {algorithms.map((algo, index) => (
            <button key={algo.id} type="button" onClick={() => setActiveId(algo.id)}>
              <b style={{ background: algo.color }}>{index + 1}</b>
              {algo.shortName}
            </button>
          ))}
          <span>學習資源</span>
          <a href="#examples">實作範例</a>
          <a href="#compare">演算法比較</a>
        </nav>
        <button className="testButton" type="button">測驗中心</button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <label className="search">
            <span>⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋演算法、概念或範例..." />
          </label>
          <div className="topActions">
            <button type="button" className="sceneToggle" onClick={() => setScene((current) => current === 'light' ? 'dark' : 'light')}>
              {scene === 'light' ? 'Dark Scene' : 'Light Scene'}
            </button>
            <button type="button">學習路徑</button>
            <button type="button">進度追蹤</button>
            <div className="ring" style={{ '--progress': `${progress}%` }}><span>{progress}%</span></div>
          </div>
        </header>

        <section className="hero">
          <div className="heroCopy">
            <h1>探索機器學習的世界</h1>
            <p>透過視覺化示意、互動實驗與實作範例，快速理解十大機器學習演算法的核心概念、工作原理與實際應用。</p>
            <div className="metrics">
              <span><b>10</b> 大核心演算法</span>
              <span><b>{filters.length - 1}</b> 種學習類型</span>
              <span><b>{done}</b> 題已完成</span>
            </div>
          </div>
          <HeroIllustration />
        </section>

        <section className="filterRow">
          {filters.map((item) => (
            <button key={item} type="button" className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </section>

        {error && <p className="error">{error}</p>}

        <section className="sectionTitle">
          <h2>演算法總覽</h2>
          <a href="#compare">查看完整比較</a>
        </section>

        <section className="cardRail">
          {filtered.map((algo, index) => (
            <button key={algo.id} type="button" className={`algoCard ${active?.id === algo.id ? 'active' : ''}`} onClick={() => setActiveId(algo.id)}>
              <b style={{ background: algo.color }}>{index + 1}</b>
              <h3>{algo.shortName}</h3>
              <MiniChart type={chartType(algo.id)} color={algo.color} />
              <p>{algo.concept}</p>
              <span>開始學習</span>
            </button>
          ))}
        </section>

        {active && (
          <section className="labGrid">
            <article className="panel visualPanel">
              <h2>互動式可視化</h2>
              <p>目前選擇：{active.shortName}</p>
              <div className="bigChart">
                <MiniChart type={chartType(active.id)} color={active.color} />
              </div>
              <div className="controlBox">
                <label>
                  選擇演算法
                  <select value={active.id} onChange={(event) => setActiveId(Number(event.target.value))}>
                    {algorithms.map((algo) => <option key={algo.id} value={algo.id}>{algo.shortName}</option>)}
                  </select>
                </label>
                <div>
                  <span>任務類型</span>
                  <strong>{active.task}</strong>
                </div>
                <button type="button">開始模擬</button>
              </div>
            </article>

            <article id="examples" className="panel codePanel">
              <div className="panelHeader">
                <div>
                  <h2>實作範例</h2>
                  <p>{activeExample.title}</p>
                </div>
                <span>{activeExample.library}</span>
              </div>
              <ol className="steps">
                {activeExample.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
              <pre>{activeExample.code}</pre>
              <Link href={`/algorithms/${active.id}`}>查看完整說明</Link>
            </article>

            <article className="panel quizPanel">
              <h2>小測驗</h2>
              <p>{active.quiz[0]}</p>
              <div className="quizOptions">
                {active.quiz[1].map((option, index) => {
                  const hasAnswer = answers[active.id] !== undefined;
                  const isCorrect = index === active.quiz[2];
                  return (
                    <button
                      key={option}
                      type="button"
                      className={hasAnswer && isCorrect ? 'correct' : ''}
                      onClick={() => selectAnswer(active.id, index)}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {answers[active.id] !== undefined && <strong className={answers[active.id] ? 'ok' : 'no'}>{answers[active.id] ? '答對了' : '再想一下'}</strong>}
            </article>
          </section>
        )}

        {activeInsight && (
          <section className="panel reportPanel">
            <div className="panelHeader">
              <div>
                <h2>PDF 研讀報告重點</h2>
                <p>{active.shortName} 的輸出型態：{activeInsight.output}</p>
              </div>
              <span>Study Report</span>
            </div>
            <p className="coreNote">{activeInsight.core}</p>
            <div className="reportGrid">
              <div>
                <h3>建模流程</h3>
                <ol>
                  {activeInsight.workflow.map((item) => <li key={item}>{item}</li>)}
                </ol>
              </div>
              <div>
                <h3>評估指標</h3>
                <div className="chips">
                  {activeInsight.metrics.map((item) => <span key={item}>{item}</span>)}
                </div>
              </div>
              <div>
                <h3>常見錯誤</h3>
                <ul>
                  {activeInsight.pitfalls.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div>
                <h3>實作練習</h3>
                <p>{activeInsight.practice}</p>
              </div>
            </div>
          </section>
        )}

        <section className="panel guidePanel">
          <h2>完整建模流程與評估地圖</h2>
          <div className="flowRail">
            {reportGuide.modelingFlow.map((step, index) => (
              <span key={step}><b>{index + 1}</b>{step}</span>
            ))}
          </div>
          <div className="metricGrid">
            {reportGuide.evaluationMap.map((item) => (
              <div key={item.task}>
                <strong>{item.task}</strong>
                <p>{item.metrics}</p>
              </div>
            ))}
          </div>
          <ul className="selectionRules">
            {reportGuide.selectionRules.map((rule) => <li key={rule}>{rule}</li>)}
          </ul>
        </section>

        <section className="panel examplesOverview">
          <h2>所有演算法實作索引</h2>
          <div className="exampleGrid">
            {algorithms.map((algo) => (
              <button key={algo.id} type="button" onClick={() => setActiveId(algo.id)} style={{ '--accent': algo.color }}>
                <strong>{algo.shortName}</strong>
                <span>{implementationExamples[algo.id].title}</span>
              </button>
            ))}
          </div>
        </section>

        <section id="compare" className="panel comparePanel">
          <h2>演算法比較</h2>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>演算法</th>
                  <th>類型</th>
                  <th>任務</th>
                  <th>難度</th>
                  <th>適合情境</th>
                </tr>
              </thead>
              <tbody>
                {algorithms.map((algo) => (
                  <tr key={algo.id}>
                    <td>{algo.shortName}</td>
                    <td>{algo.category}</td>
                    <td>{algo.task}</td>
                    <td>{algo.level}</td>
                    <td>{algo.bestFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <style jsx>{`
        .appShell {
          --bg: #f8fafc;
          --surface: #ffffff;
          --surface-soft: #f1f5f9;
          --text: #172033;
          --muted: #475569;
          --muted-strong: #334155;
          --line: #dbe3ef;
          --line-soft: #e5e7eb;
          --accent: #4f63f6;
          --hero-start: #a7d7ff;
          --hero-end: #dcd8ff;
          --shadow: rgba(15, 23, 42, 0.05);
          --code-bg: #172033;
          --code-text: #e5e7eb;
          --chart-axis: #cbd5e1;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          background: var(--bg);
          color: var(--text);
          font-family: Arial, 'Noto Sans TC', sans-serif;
        }
        .appShell.dark {
          --bg: #0b1120;
          --surface: #111827;
          --surface-soft: #1f2937;
          --text: #e5e7eb;
          --muted: #cbd5e1;
          --muted-strong: #e2e8f0;
          --line: #334155;
          --line-soft: #1f2937;
          --accent: #8b9cff;
          --hero-start: #1e3a8a;
          --hero-end: #581c87;
          --shadow: rgba(0, 0, 0, 0.24);
          --code-bg: #020617;
          --code-text: #dbeafe;
          --chart-axis: #475569;
        }
        .sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          display: flex;
          flex-direction: column;
          gap: 20px;
          border-right: 1px solid var(--line-soft);
          background: var(--surface);
          padding: 18px 16px;
        }
        .brand {
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr);
          gap: 12px;
          align-items: center;
        }
        .brandMark {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: var(--accent);
          color: #fff;
          font-weight: 800;
        }
        .brand strong,
        .brand span {
          display: block;
        }
        .brand span {
          margin-top: 4px;
          color: var(--muted);
          font-size: 0.84rem;
        }
        nav {
          display: grid;
          gap: 7px;
          overflow-y: auto;
          padding-right: 3px;
        }
        nav span {
          margin: 10px 10px 4px;
          color: var(--muted-strong);
          font-weight: 700;
          font-size: 0.9rem;
        }
        nav a,
        nav button {
          min-height: 38px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: var(--muted-strong);
          padding: 8px 10px;
          text-align: left;
          text-decoration: none;
          cursor: pointer;
          font: inherit;
          font-size: 0.9rem;
        }
        nav b {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          color: #fff;
          font-size: 0.78rem;
        }
        .navActive {
          background: var(--accent);
          color: #fff;
          font-weight: 700;
        }
        .testButton {
          margin-top: auto;
          border: 0;
          border-radius: 7px;
          background: var(--text);
          color: var(--surface);
          padding: 13px 14px;
          cursor: pointer;
          font: inherit;
          font-weight: 700;
        }
        .workspace {
          min-width: 0;
          padding: 14px 26px 28px;
          overflow: hidden;
        }
        .topbar {
          min-height: 54px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 18px;
        }
        .search {
          width: min(520px, 100%);
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 8px;
          background: var(--surface-soft);
          padding: 0 14px;
          color: var(--muted);
        }
        .search input {
          width: 100%;
          height: 42px;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--text);
          font-size: 0.95rem;
        }
        .topActions {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text);
        }
        .topActions button {
          border: 1px solid var(--line);
          border-radius: 7px;
          background: var(--surface);
          color: var(--muted-strong);
          padding: 9px 12px;
          cursor: pointer;
          font: inherit;
          font-weight: 700;
          white-space: nowrap;
        }
        .sceneToggle {
          background: var(--text) !important;
          border-color: var(--text) !important;
          color: var(--surface) !important;
        }
        .ring {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: conic-gradient(var(--accent) var(--progress), var(--line-soft) 0);
          color: var(--text);
          font-size: 0.82rem;
          font-weight: 800;
          position: relative;
        }
        .ring::before {
          content: '';
          position: absolute;
          inset: 5px;
          border-radius: 50%;
          background: var(--surface);
        }
        .ring span {
          position: relative;
        }
        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 440px;
          gap: 20px;
          align-items: center;
          border-radius: 10px;
          background: linear-gradient(110deg, var(--hero-start) 0%, var(--hero-end) 100%);
          padding: 34px;
          margin-bottom: 22px;
          overflow: hidden;
        }
        .hero h1 {
          margin: 0 0 14px;
          font-size: 2.1rem;
          line-height: 1.2;
        }
        .hero p {
          max-width: 720px;
          color: var(--muted-strong);
          line-height: 1.8;
          margin: 0;
        }
        .metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 22px;
          margin-top: 26px;
        }
        .metrics span {
          display: flex;
          align-items: center;
          gap: 9px;
          color: var(--muted-strong);
          font-weight: 700;
        }
        .metrics b {
          font-size: 1.4rem;
          color: var(--text);
        }
        .heroArt {
          min-height: 210px;
          position: relative;
        }
        .laptop {
          position: absolute;
          right: 54px;
          bottom: 18px;
          width: 270px;
        }
        .laptop svg rect {
          fill: #111827;
        }
        .laptop svg path:first-of-type {
          fill: #1f2937;
        }
        .laptop svg .curve {
          fill: none;
          stroke: #2563eb;
          stroke-width: 4;
        }
        .laptop svg circle.b {
          fill: #3b82f6;
        }
        .laptop svg circle.r {
          fill: #ef4444;
        }
        .floatCard {
          position: absolute;
          display: grid;
          place-items: center;
          width: 86px;
          height: 66px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.82);
          box-shadow: 0 16px 32px rgba(30, 41, 59, 0.12);
          color: #334155;
          font-weight: 800;
        }
        .treeIcon {
          right: 0;
          top: 8px;
        }
        .formula {
          right: 20px;
          top: 88px;
          font-size: 1.4rem;
        }
        .bars {
          right: 32px;
          bottom: 6px;
          grid-auto-flow: column;
          align-items: end;
          gap: 7px;
        }
        .bars span {
          width: 9px;
          background: #fb923c;
          border-radius: 4px 4px 0 0;
        }
        .bars span:nth-child(1) {
          height: 22px;
          background: #93c5fd;
        }
        .bars span:nth-child(2) {
          height: 34px;
        }
        .bars span:nth-child(3) {
          height: 46px;
          background: #ef4444;
        }
        .filterRow,
        .sectionTitle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }
        .filterRow {
          justify-content: flex-start;
          flex-wrap: wrap;
        }
        .filterRow button {
          border: 1px solid var(--line);
          border-radius: 7px;
          background: var(--surface);
          padding: 9px 12px;
          cursor: pointer;
          color: var(--muted-strong);
          font: inherit;
        }
        .filterRow .selected {
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
        }
        .sectionTitle h2,
        .panel h2 {
          margin: 0;
          font-size: 1.18rem;
        }
        .sectionTitle a {
          color: var(--accent);
          text-decoration: none;
          font-weight: 700;
        }
        .error {
          border: 1px solid #fecaca;
          border-radius: 8px;
          background: #fee2e2;
          color: #991b1b;
          padding: 12px;
        }
        .cardRail {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 124px;
          gap: 9px;
          overflow-x: auto;
          padding: 3px 2px 20px;
          margin-bottom: 10px;
        }
        .algoCard {
          min-height: 252px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text);
          padding: 10px;
          text-align: left;
          cursor: pointer;
          box-shadow: 0 8px 20px var(--shadow);
        }
        .algoCard.active {
          box-shadow: 0 0 0 2px var(--accent);
        }
        .algoCard b {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          color: #fff;
          font-size: 0.8rem;
        }
        .algoCard h3 {
          height: 38px;
          margin: 8px 0;
          font-size: 0.9rem;
          line-height: 1.35;
        }
        .algoCard p {
          min-height: 62px;
          margin: 6px 0 10px;
          color: var(--muted);
          font-size: 0.82rem;
          line-height: 1.45;
        }
        .algoCard span {
          display: block;
          border: 1px solid var(--line);
          border-radius: 6px;
          background: var(--surface-soft);
          color: var(--accent);
          text-align: center;
          padding: 8px 4px;
          font-weight: 700;
          font-size: 0.82rem;
        }
        .labGrid {
          display: grid;
          grid-template-columns: 1.05fr 1.25fr 0.9fr;
          gap: 18px;
          margin-bottom: 18px;
        }
        .panel {
          border: 1px solid var(--line);
          border-radius: 9px;
          background: var(--surface);
          padding: 18px;
          box-shadow: 0 8px 24px var(--shadow);
        }
        .panel p {
          color: var(--muted);
          line-height: 1.65;
        }
        .panelHeader {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
        }
        .panelHeader span {
          border: 1px solid var(--line);
          border-radius: 999px;
          color: var(--accent);
          padding: 7px 10px;
          font-size: 0.78rem;
          font-weight: 800;
          white-space: nowrap;
        }
        .bigChart {
          height: 220px;
          display: grid;
          place-items: center;
          border: 1px solid var(--line-soft);
          border-radius: 8px;
          background: linear-gradient(var(--surface), var(--surface-soft));
          margin: 16px 0;
        }
        .bigChart :global(.miniChart) {
          width: 82%;
          height: 180px;
        }
        .controlBox {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 130px;
          gap: 12px;
          align-items: end;
        }
        .controlBox label,
        .controlBox div {
          display: grid;
          gap: 8px;
          color: var(--muted);
          font-size: 0.88rem;
        }
        select {
          height: 38px;
          border: 1px solid var(--line);
          border-radius: 7px;
          padding: 0 10px;
          background: var(--surface);
          color: var(--text);
        }
        .controlBox button {
          grid-column: 1 / -1;
          border: 0;
          border-radius: 7px;
          background: var(--accent);
          color: #fff;
          padding: 12px;
          cursor: pointer;
          font: inherit;
          font-weight: 800;
        }
        .steps {
          display: grid;
          gap: 7px;
          margin: 0 0 14px;
          padding-left: 1.3rem;
          color: var(--muted-strong);
        }
        .codePanel pre {
          max-height: 340px;
          overflow: auto;
          border-radius: 8px;
          background: var(--code-bg);
          color: var(--code-text);
          padding: 16px;
          line-height: 1.6;
          font-size: 0.82rem;
        }
        .codePanel a {
          display: block;
          border: 1px solid var(--line);
          border-radius: 7px;
          color: var(--accent);
          text-align: center;
          text-decoration: none;
          font-weight: 800;
          padding: 11px;
        }
        .quizOptions {
          display: grid;
          gap: 8px;
          margin: 14px 0;
        }
        .quizOptions button {
          border: 1px solid var(--line);
          border-radius: 7px;
          background: var(--surface);
          color: var(--text);
          padding: 11px;
          text-align: left;
          cursor: pointer;
          font: inherit;
        }
        .quizOptions .correct {
          border-color: #86efac;
          background: #dcfce7;
          color: #14532d;
        }
        .ok {
          color: #16a34a;
        }
        .no {
          color: #dc2626;
        }
        .examplesOverview {
          margin-bottom: 18px;
        }
        .reportPanel,
        .guidePanel {
          margin-bottom: 18px;
        }
        .coreNote {
          margin: 14px 0 16px;
          font-size: 1rem;
        }
        .reportGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }
        .reportGrid h3 {
          margin: 0 0 10px;
          font-size: 0.98rem;
        }
        .reportGrid ol,
        .reportGrid ul,
        .selectionRules {
          margin: 0;
          padding-left: 1.2rem;
          color: var(--muted);
          line-height: 1.6;
        }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .chips span {
          border: 1px solid var(--line);
          border-radius: 999px;
          background: var(--surface-soft);
          color: var(--muted-strong);
          padding: 7px 10px;
          font-size: 0.82rem;
          font-weight: 700;
        }
        .flowRail {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin: 16px 0;
        }
        .flowRail span {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--surface-soft);
          color: var(--muted-strong);
          padding: 10px;
          font-size: 0.88rem;
          font-weight: 700;
        }
        .flowRail b {
          width: 24px;
          height: 24px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: var(--accent);
          color: #fff;
          font-size: 0.78rem;
        }
        .metricGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 14px;
        }
        .metricGrid div {
          border-left: 4px solid var(--accent);
          border-radius: 8px;
          background: var(--surface-soft);
          padding: 12px;
        }
        .metricGrid strong {
          display: block;
          margin-bottom: 6px;
        }
        .metricGrid p {
          margin: 0;
        }
        .exampleGrid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
          margin-top: 14px;
        }
        .exampleGrid button {
          min-height: 94px;
          border: 1px solid var(--line);
          border-left: 5px solid var(--accent);
          border-radius: 8px;
          background: var(--surface-soft);
          color: var(--text);
          padding: 12px;
          text-align: left;
          cursor: pointer;
          font: inherit;
        }
        .exampleGrid strong,
        .exampleGrid span {
          display: block;
        }
        .exampleGrid span {
          margin-top: 8px;
          color: var(--muted);
          font-size: 0.84rem;
          line-height: 1.45;
        }
        .comparePanel {
          margin-bottom: 18px;
        }
        .tableWrap {
          overflow-x: auto;
          margin-top: 14px;
        }
        table {
          width: 100%;
          min-width: 760px;
          border-collapse: collapse;
        }
        th,
        td {
          border-bottom: 1px solid var(--line-soft);
          padding: 11px 10px;
          text-align: left;
          vertical-align: top;
        }
        th {
          color: var(--muted);
          background: var(--surface-soft);
          font-size: 0.86rem;
        }
        @media (max-width: 1120px) {
          .appShell {
            grid-template-columns: 1fr;
          }
          .sidebar {
            position: static;
            height: auto;
          }
          nav {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          nav span,
          .testButton {
            grid-column: 1 / -1;
          }
          .hero,
          .labGrid {
            grid-template-columns: 1fr;
          }
          .heroArt {
            min-height: 260px;
          }
          .exampleGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .reportGrid,
          .flowRail,
          .metricGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 680px) {
          .workspace {
            padding: 14px;
          }
          .topbar,
          .topActions,
          .metrics {
            align-items: stretch;
            flex-direction: column;
          }
          .hero {
            padding: 22px;
          }
          .hero h1 {
            font-size: 1.55rem;
          }
          nav,
          .exampleGrid,
          .reportGrid,
          .flowRail,
          .metricGrid {
            grid-template-columns: 1fr;
          }
          .controlBox,
          .panelHeader {
            grid-template-columns: 1fr;
          }
          .panelHeader {
            display: grid;
          }
        }
      `}</style>
    </main>
  );
}
