import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { implementationExamples, executionResults } from '../../lib/algorithmData';
import VisualPanel from '../../components/VisualPanel';
import CodePanel from '../../components/CodePanel';
import QuizPanel from '../../components/QuizPanel';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function AlgorithmPage() {
  const router = useRouter();
  const { id } = router.query;
  const numId = id !== undefined ? parseInt(id, 10) : null;

  const [algorithm, setAlgorithm] = useState(null);
  const [error, setError] = useState('');
  const [scene, setScene] = useState('dark');
  const [simulationRun, setSimulationRun] = useState(0);
  const [simulationStatus, setSimulationStatus] = useState('尚未開始模擬');
  const [codeOutput, setCodeOutput] = useState(null);
  const [answers, setAnswers] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = window.localStorage.getItem('ml-quiz-v2');
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    if (!id) return;
    setError('');
    fetch(`${API_BASE_URL}/api/algorithms/${id}`)
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data) => setAlgorithm(data))
      .catch(() => setError('無法讀取演算法資料，請確認後端 API 是否已啟動。'));
  }, [id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const s = window.localStorage.getItem('ml-learning-scene');
    if (s === 'light' || s === 'dark') setScene(s);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('ml-learning-scene', scene);
  }, [scene]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('ml-quiz-v2', JSON.stringify(answers));
  }, [answers]);

  function selectAnswer(algoId, questionIndex, selectedIndex) {
    if (questionIndex === -1) {
      setAnswers((current) => ({ ...current, [algoId]: [] }));
      return;
    }
    if (!algorithm) return;
    const q = algorithm.quiz[questionIndex];
    if (!q) return;
    const isCorrect = selectedIndex === q.correctIndex;
    setAnswers((current) => {
      const prev = Array.isArray(current[algoId]) ? [...current[algoId]] : [];
      if (prev[questionIndex]?.correct) return current;
      prev[questionIndex] = { selected: selectedIndex, correct: isCorrect };
      return { ...current, [algoId]: prev };
    });
  }

  function runSimulation() {
    if (!algorithm) return;
    setSimulationRun((n) => n + 1);
    const action = algorithm.task.includes('分類') ? '分類邊界已更新'
      : algorithm.task.includes('聚類') ? '群中心已重新配置'
      : algorithm.task.includes('降維') ? '主成分投影已完成'
      : '趨勢線已重新擬合';
    setSimulationStatus(`${algorithm.shortName}：${action}`);
  }

  function executeCode() {
    if (!algorithm || numId === null) return;
    setCodeOutput({
      title: `${algorithm.shortName} 執行結果`,
      lines: executionResults[numId] || ['程式碼執行完成', 'Result: ok'],
    });
  }

  const activeExample = numId !== null ? implementationExamples[numId] : null;

  if (!id) return null;

  if (error) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'Arial', color: '#b00020' }}>
        <Link href="/" style={{ color: '#4f63f6' }}>← 返回總覽</Link>
        <p style={{ marginTop: '1rem' }}>{error}</p>
      </main>
    );
  }

  if (!algorithm || !activeExample) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'Arial', color: '#475569' }}>
        <Link href="/" style={{ color: '#4f63f6' }}>← 返回總覽</Link>
        <p style={{ marginTop: '1rem' }}>讀取資料中...</p>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>{algorithm.name} — 機器學習十大演算法</title>
        <meta name="description" content={`深入學習 ${algorithm.name}（${algorithm.shortName}）：互動視覺化、程式碼範例與測驗，掌握核心概念。`} />
        <meta property="og:title" content={`${algorithm.name} — 機器學習學習平台`} />
        <meta property="og:description" content={algorithm.concept} />
        <meta name="robots" content="index, follow" />
      </Head>

      <main className={`deepDive ${scene}`}>
        <header className="deepHeader">
          <div className="deepHeaderLeft">
            <Link href="/" className="backLink">← 返回總覽</Link>
            <div className="algoTitleRow">
              <span className="algoColorDot" style={{ background: algorithm.color }} />
              <h1>{algorithm.name}</h1>
              <span className={`lvBadge lvBadge-${algorithm.level}`}>{algorithm.level}</span>
              <span className="categoryBadge">{algorithm.category}</span>
            </div>
            <p className="algoDesc">{algorithm.concept}</p>
          </div>
          <button
            type="button"
            className="sceneBtn"
            onClick={() => setScene((s) => s === 'light' ? 'dark' : 'light')}
          >
            {scene === 'light' ? 'Dark' : 'Light'}
          </button>
        </header>

        <section className="labGrid">
          <VisualPanel
            active={algorithm}
            algorithms={[algorithm]}
            simulationRun={simulationRun}
            simulationStatus={simulationStatus}
            onSimulate={runSimulation}
            onSelectAlgo={() => {}}
          />
          <CodePanel
            activeExample={activeExample}
            active={algorithm}
            codeOutput={codeOutput}
            onExecute={executeCode}
            onShowDetails={() => {}}
          />
          <QuizPanel
            active={algorithm}
            answers={answers}
            onSelectAnswer={selectAnswer}
          />
        </section>

        <section className="reportSection">
          <h2>深度解析</h2>
          <p className="coreLine">{algorithm.core}</p>
          <div className="reportGrid">
            <div>
              <h3>優點</h3>
              <ul>
                {algorithm.advantages.map((a) => <li key={a}>{a}</li>)}
              </ul>
            </div>
            <div>
              <h3>缺點</h3>
              <ul>
                {algorithm.disadvantages.map((d) => <li key={d}>{d}</li>)}
              </ul>
            </div>
            <div>
              <h3>評估指標</h3>
              <ul>
                {algorithm.metrics.map((m) => <li key={m}>{m}</li>)}
              </ul>
            </div>
            <div>
              <h3>常見錯誤</h3>
              <ul>
                {algorithm.pitfalls.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </div>
          </div>
          <div className="workflowSection">
            <h3>建模流程</h3>
            <div className="workflowSteps">
              {algorithm.workflow.map((step, i) => (
                <div key={step} className="workflowStep">
                  <span className="stepNum">{i + 1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
          {algorithm.practice && (
            <div className="practiceBox">
              <h3>實作練習</h3>
              <p>{algorithm.practice}</p>
            </div>
          )}
        </section>

        <style jsx global>{`
          html, body { margin: 0; }
          .panel {
            border: 1px solid var(--line);
            border-radius: 9px;
            background: var(--surface);
            padding: 18px;
            box-shadow: 0 8px 24px var(--shadow);
          }
          .panel p { color: var(--muted); line-height: 1.65; }
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
          .chips { display: flex; flex-wrap: wrap; gap: 8px; }
          .chips span {
            border: 1px solid var(--line);
            border-radius: 999px;
            background: var(--surface-soft);
            color: var(--muted-strong);
            padding: 7px 10px;
            font-size: 0.82rem;
            font-weight: 700;
          }
          .controlBox { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center; }
        `}</style>
        <style jsx>{`
          .deepDive {
            --bg: #f8fafc; --surface: #fff; --surface-soft: #f1f5f9;
            --text: #172033; --muted: #475569; --muted-strong: #334155;
            --line: #dbe3ef; --accent: #4f63f6; --shadow: rgba(15,23,42,0.05);
            --code-bg: #172033; --code-text: #e5e7eb; --chart-axis: #cbd5e1;
            min-height: 100vh;
            background: var(--bg);
            color: var(--text);
            font-family: Arial, 'Noto Sans TC', sans-serif;
            padding: 20px 28px 48px;
          }
          .deepDive.dark {
            --bg: #0b1120; --surface: #111827; --surface-soft: #1f2937;
            --text: #e5e7eb; --muted: #cbd5e1; --muted-strong: #e2e8f0;
            --line: #334155; --accent: #8b9cff; --shadow: rgba(0,0,0,0.24);
            --code-bg: #020617; --code-text: #dbeafe; --chart-axis: #475569;
          }
          .deepHeader {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            margin-bottom: 24px;
          }
          .deepHeaderLeft { flex: 1; min-width: 0; }
          .backLink {
            display: inline-block;
            color: var(--accent);
            text-decoration: none;
            font-size: 0.88rem;
            font-weight: 600;
            margin-bottom: 10px;
          }
          .algoTitleRow {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 8px;
          }
          .algoColorDot {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            flex-shrink: 0;
          }
          h1 { margin: 0; font-size: 1.75rem; line-height: 1.2; }
          h2 { margin: 0 0 10px; font-size: 1.15rem; }
          .lvBadge {
            font-size: 0.74rem;
            font-weight: 700;
            border-radius: 6px;
            padding: 3px 8px;
            border: 1px solid transparent;
          }
          .lvBadge-入門 { background: #dcfce7; color: #16a34a; border-color: #86efac; }
          .lvBadge-中階 { background: #dbeafe; color: #1d4ed8; border-color: #93c5fd; }
          .lvBadge-進階 { background: #fae8ff; color: #7e22ce; border-color: #d8b4fe; }
          .categoryBadge {
            font-size: 0.74rem;
            font-weight: 600;
            border-radius: 6px;
            padding: 3px 8px;
            border: 1px solid var(--line);
            background: var(--surface-soft);
            color: var(--muted-strong);
          }
          .algoDesc { color: var(--muted); margin: 0; line-height: 1.7; font-size: 0.95rem; }
          .sceneBtn {
            border: 1px solid var(--line);
            border-radius: 7px;
            background: var(--text);
            color: var(--surface);
            padding: 9px 14px;
            cursor: pointer;
            font: inherit;
            font-weight: 700;
            white-space: nowrap;
            flex-shrink: 0;
          }
          .labGrid {
            display: grid;
            grid-template-columns: 1.05fr 1.25fr 0.9fr;
            gap: 18px;
            margin-bottom: 24px;
          }
          .reportSection {
            border: 1px solid var(--line);
            border-radius: 9px;
            background: var(--surface);
            padding: 20px 22px;
            box-shadow: 0 8px 24px var(--shadow);
          }
          .coreLine {
            color: var(--muted);
            line-height: 1.7;
            margin: 0 0 18px;
            font-size: 0.95rem;
          }
          .reportGrid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 20px;
          }
          .reportGrid h3 {
            margin: 0 0 8px;
            font-size: 0.95rem;
            color: var(--muted-strong);
          }
          .reportGrid ul {
            margin: 0;
            padding-left: 1.1rem;
            color: var(--muted);
            line-height: 1.65;
            font-size: 0.87rem;
          }
          .workflowSection { margin-bottom: 18px; }
          .workflowSection h3 {
            margin: 0 0 10px;
            font-size: 0.95rem;
            color: var(--muted-strong);
          }
          .workflowSteps { display: flex; flex-wrap: wrap; gap: 8px; }
          .workflowStep {
            display: flex;
            align-items: center;
            gap: 7px;
            border: 1px solid var(--line);
            border-radius: 8px;
            background: var(--surface-soft);
            padding: 8px 12px;
            font-size: 0.86rem;
            font-weight: 600;
            color: var(--muted-strong);
          }
          .stepNum {
            width: 20px;
            height: 20px;
            display: grid;
            place-items: center;
            border-radius: 50%;
            background: var(--accent);
            color: #fff;
            font-size: 0.72rem;
            flex-shrink: 0;
          }
          .practiceBox h3 {
            margin: 0 0 6px;
            font-size: 0.95rem;
            color: var(--muted-strong);
          }
          .practiceBox p {
            margin: 0;
            color: var(--muted);
            font-size: 0.88rem;
            line-height: 1.65;
          }
          @media (max-width: 1100px) {
            .labGrid { grid-template-columns: 1fr; }
            .reportGrid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 600px) {
            .deepDive { padding: 14px 14px 40px; }
            .deepHeader { flex-direction: column; }
            .reportGrid { grid-template-columns: 1fr; }
          }
        `}</style>
      </main>
    </>
  );
}
