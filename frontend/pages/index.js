import { useEffect, useMemo, useRef, useState } from 'react';
import { reportGuide } from '../lib/algorithmReport';
import { implementationExamples, filters, executionResults, chartType } from '../lib/algorithmData';
import AIChatbot from '../components/AIChatbot';
import MiniChart from '../components/MiniChart';
import HeroIllustration from '../components/HeroIllustration';
import VisualPanel from '../components/VisualPanel';
import CodePanel from '../components/CodePanel';
import QuizPanel from '../components/QuizPanel';
import DetailModal from '../components/DetailModal';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function Home() {
  const [algorithms, setAlgorithms] = useState([]);
  const [activeId, setActiveId] = useState(0);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('全部');
  const [answers, setAnswers] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = window.localStorage.getItem('ml-quiz-answers');
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });
  const [scene, setScene] = useState('dark');
  const [error, setError] = useState('');
  const [simulationRun, setSimulationRun] = useState(0);
  const [simulationStatus, setSimulationStatus] = useState('尚未開始模擬');
  const [codeOutput, setCodeOutput] = useState(null);
  const [learningNotice, setLearningNotice] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const labRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/algorithms`)
      .then((res) => {
        if (!res.ok) throw new Error('無法取得資料');
        return res.json();
      })
      .then((data) => {
        setAlgorithms(data);
        setActiveId(data[0]?.id ?? 0);
      })
      .catch((err) => {
        console.error(err);
        setError('目前無法讀取資料，請確認後端 API 是否已啟動。');
      });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedScene = window.localStorage.getItem('ml-learning-scene');
    if (storedScene === 'light' || storedScene === 'dark') setScene(storedScene);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('ml-learning-scene', scene);
  }, [scene]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('ml-quiz-answers', JSON.stringify(answers));
  }, [answers]);

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
  const activeInsight = active || null;
  const done = Object.values(answers).filter(Boolean).length;
  const progress = algorithms.length ? Math.round((done / algorithms.length) * 100) : 0;

  function selectAnswer(algoId, index) {
    if (answers[algoId] === true) return;
    const algo = algorithms.find((a) => a.id === algoId);
    const correctIndex = algo?.quiz?.correctIndex ?? -1;
    setAnswers((current) => ({ ...current, [algoId]: index === correctIndex }));
  }

  function startLearning(algoId) {
    const selected = algorithms.find((algo) => algo.id === algoId);
    setActiveId(algoId);
    setCodeOutput(null);
    setLearningNotice(`${selected?.shortName || '演算法'} 學習區已載入`);
    if (typeof window !== 'undefined') {
      window.setTimeout(() => setLearningNotice(''), 2200);
      window.requestAnimationFrame(() => {
        labRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  function runSimulation() {
    if (!active) return;
    setSimulationRun((current) => current + 1);
    const action = active.task.includes('分類')
      ? '分類邊界已更新'
      : active.task.includes('聚類')
        ? '群中心已重新配置'
        : active.task.includes('降維')
          ? '主成分投影已完成'
          : '趨勢線已重新擬合';
    setSimulationStatus(`${active.shortName}：${action}`);
  }

  function executeCode() {
    if (!active) return;
    setCodeOutput({
      title: `${active.shortName} 執行結果`,
      lines: executionResults[active.id] || ['程式碼執行完成', 'Result: ok'],
    });
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
            <button key={algo.id} type="button" onClick={() => startLearning(algo.id)}>
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
            <button key={algo.id} type="button" className={`algoCard ${active?.id === algo.id ? 'active' : ''}`} onClick={() => startLearning(algo.id)}>
              <b style={{ background: algo.color }}>{index + 1}</b>
              <h3>{algo.shortName}</h3>
              <MiniChart type={chartType(algo.id)} color={algo.color} algoId={algo.id} />
              <p>{algo.concept}</p>
              <span>{active?.id === algo.id ? '正在學習' : '開始學習'}</span>
            </button>
          ))}
        </section>

        {learningNotice && <p className="learningNotice">{learningNotice}</p>}

        {active && activeExample && (
          <section ref={labRef} className="labGrid">
            <VisualPanel
              active={active}
              algorithms={algorithms}
              simulationRun={simulationRun}
              simulationStatus={simulationStatus}
              onSimulate={runSimulation}
              onSelectAlgo={startLearning}
            />
            <CodePanel
              activeExample={activeExample}
              active={active}
              codeOutput={codeOutput}
              onExecute={executeCode}
              onShowDetails={() => setShowDetails(true)}
            />
            <QuizPanel
              active={active}
              answers={answers}
              onSelectAnswer={selectAnswer}
            />
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
              <button key={algo.id} type="button" onClick={() => startLearning(algo.id)} style={{ '--accent': algo.color }}>
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
                  <th>演算法</th><th>類型</th><th>任務</th><th>難度</th><th>適合情境</th>
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

      <DetailModal
        show={showDetails}
        active={active}
        activeInsight={activeInsight}
        onClose={() => setShowDetails(false)}
      />
      <AIChatbot activeAlgorithmName={active?.name} />

      <style jsx>{`
        /* ── Theme variables ── */
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
          --hero-start: #e0e7ff;
          --hero-end: #ede9fe;
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

        /* ── Shared panel styles (global so extracted components can use them) ── */
        :global(.panel) {
          border: 1px solid var(--line);
          border-radius: 9px;
          background: var(--surface);
          padding: 18px;
          box-shadow: 0 8px 24px var(--shadow);
        }
        :global(.panel p) {
          color: var(--muted);
          line-height: 1.65;
        }
        :global(.panelHeader) {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
        }
        :global(.panelHeader span) {
          border: 1px solid var(--line);
          border-radius: 999px;
          color: var(--accent);
          padding: 7px 10px;
          font-size: 0.78rem;
          font-weight: 800;
          white-space: nowrap;
        }
        :global(.chips) {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        :global(.chips span) {
          border: 1px solid var(--line);
          border-radius: 999px;
          background: var(--surface-soft);
          color: var(--muted-strong);
          padding: 7px 10px;
          font-size: 0.82rem;
          font-weight: 700;
        }

        /* ── Sidebar ── */
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

        /* ── Main workspace ── */
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

        /* ── Hero ── */
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

        /* ── Filter & Cards ── */
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
        .algoCard.active span {
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
        }
        .learningNotice {
          width: fit-content;
          border: 1px solid var(--line);
          border-radius: 7px;
          background: var(--surface);
          color: var(--accent);
          padding: 9px 12px;
          margin: -4px 0 14px;
          font-weight: 800;
          box-shadow: 0 8px 20px var(--shadow);
        }
        .labGrid {
          display: grid;
          grid-template-columns: 1.05fr 1.25fr 0.9fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        /* ── Report & Guide panels ── */
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

        /* ── Examples overview & Compare ── */
        .examplesOverview {
          margin-bottom: 18px;
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

        /* ── Responsive ── */
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
          :global(.controlBox),
          :global(.panelHeader) {
            grid-template-columns: 1fr;
          }
          :global(.panelHeader) {
            display: grid;
          }
        }
      `}</style>
    </main>
  );
}
