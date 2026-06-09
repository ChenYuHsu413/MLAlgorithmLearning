import { useState, useMemo } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const C0 = '#ef4444';
const C1 = '#3b82f6';
const CURVE_N = 300;

function gaussianPDF(x, mu, sigma) {
  return Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
}

function logScore(x, mu, sigma, prior) {
  return -0.5 * Math.log(sigma ** 2) - (x - mu) ** 2 / (2 * sigma ** 2) + Math.log(prior);
}

// Numerically find x values where log P(x|c0)*p0 = log P(x|c1)*p1
function findBoundaries(c0, c1, p0, p1) {
  const xMin = Math.min(c0.mu - 5 * c0.sigma, c1.mu - 5 * c1.sigma);
  const xMax = Math.max(c0.mu + 5 * c0.sigma, c1.mu + 5 * c1.sigma);
  const N = 2000;
  const step = (xMax - xMin) / N;
  const crossings = [];
  let prev = null;
  for (let i = 0; i <= N; i++) {
    const x = xMin + i * step;
    const diff = logScore(x, c1.mu, c1.sigma, p1) - logScore(x, c0.mu, c0.sigma, p0);
    if (prev !== null && prev !== 0 && Math.sign(diff) !== Math.sign(prev)) {
      crossings.push(parseFloat((x - step / 2).toFixed(3)));
    }
    prev = diff;
  }
  return crossings;
}

function computeStats(points, c0, c1, p0, p1) {
  let tp = 0, tn = 0, fp = 0, fn = 0;
  points.forEach((p) => {
    const pred = logScore(p.x, c1.mu, c1.sigma, p1) >= logScore(p.x, c0.mu, c0.sigma, p0) ? 1 : 0;
    if (pred === 1 && p.label === 1) tp++;
    else if (pred === 0 && p.label === 0) tn++;
    else if (pred === 1 && p.label === 0) fp++;
    else fn++;
  });
  return { tp, tn, fp, fn, acc: (tp + tn) / points.length };
}

// Chart geometry only depends on result (not prior) — curves stay fixed, only boundary line moves
function buildChart(result) {
  const { class0: c0, class1: c1 } = result;
  const PAD = { top: 32, right: 20, bottom: 72, left: 52 };
  const W = 440, H = 300;
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const allX = result.points.map((p) => p.x);
  const xMin = Math.min(c0.mu - 3.8 * c0.sigma, c1.mu - 3.8 * c1.sigma, Math.min(...allX)) - 0.3;
  const xMax = Math.max(c0.mu + 3.8 * c0.sigma, c1.mu + 3.8 * c1.sigma, Math.max(...allX)) + 0.3;

  const yMax = Math.max(gaussianPDF(c0.mu, c0.mu, c0.sigma), gaussianPDF(c1.mu, c1.mu, c1.sigma)) * 1.35;

  const toX = (x) => PAD.left + ((x - xMin) / (xMax - xMin)) * cW;
  const toY = (y) => PAD.top + cH - (y / yMax) * cH;
  const baseY = PAD.top + cH;

  const xStep = (xMax - xMin) / CURVE_N;
  const pts0 = [], pts1 = [];
  for (let i = 0; i <= CURVE_N; i++) {
    const x = xMin + i * xStep;
    pts0.push([toX(x), toY(gaussianPDF(x, c0.mu, c0.sigma))]);
    pts1.push([toX(x), toY(gaussianPDF(x, c1.mu, c1.sigma))]);
  }

  const toFill = (pts) =>
    `M ${pts[0][0]},${baseY} ` + pts.map(([x, y]) => `L ${x},${y}`).join(' ') + ` L ${pts[pts.length - 1][0]},${baseY} Z`;
  const toStroke = (pts) =>
    pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x},${y}`).join(' ');

  const xTicks = [];
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) xTicks.push({ x, svgX: toX(x) });

  const yTickVal = gaussianPDF(c0.mu, c0.mu, c0.sigma) * 0.5 + gaussianPDF(c1.mu, c1.mu, c1.sigma) * 0.5;
  const yTicks = [yTickVal * 0.5, yTickVal].map((y) => ({ svgY: toY(y), label: y.toFixed(2) }));

  return {
    W, H, PAD, cW, cH, toX, toY, baseY, xMin, xMax, yMax,
    fill0: toFill(pts0), stroke0: toStroke(pts0),
    fill1: toFill(pts1), stroke1: toStroke(pts1),
    xTicks, yTicks,
    rugY0: baseY + 22, rugY1: baseY + 38,
  };
}

export default function NaiveBayesLab() {
  const [result, setResult] = useState(null);
  const [prior1, setPrior1] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const prior0 = parseFloat((1 - prior1).toFixed(2));

  async function fetchData() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/simulate-naive-bayes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || '執行失敗'); }
      const data = await res.json();
      setResult(data);
      setPrior1(parseFloat(data.class1.prior.toFixed(2)));
    } catch (e) {
      setError(e.message || '無法連線到後端');
    } finally {
      setLoading(false);
    }
  }

  const chart = useMemo(() => (result ? buildChart(result) : null), [result]);

  const boundaries = useMemo(() => {
    if (!result) return [];
    return findBoundaries(result.class0, result.class1, prior0, prior1);
  }, [result, prior0, prior1]);

  const stats = useMemo(() => {
    if (!result) return null;
    return computeStats(result.points, result.class0, result.class1, prior0, prior1);
  }, [result, prior0, prior1]);

  return (
    <section className="nbLab">
      <div className="nbHeader">
        <h3>樸素貝葉斯模擬實驗室</h3>
        <p>
          每條曲線代表某類別特徵的高斯分布（固定）。
          拖曳<b>先驗機率</b>滑桿，觀察決策邊界（橘線）如何偏移：
          類別越常出現，分類器就越傾向預測它。
        </p>
      </div>

      <div className="nbBody">
        {/* ── Left panel ── */}
        <div className="paramPanel">
          <div className="formulaBox">
            <span className="formulaTitle">貝葉斯決策規則</span>
            <code>ŷ = argmax P(x|y) × P(y)</code>
            <span className="formulaHint">P(x|y) = 高斯 PDF，P(y) = 先驗機率（可調）</span>
          </div>

          {error && <p className="errMsg">{error}</p>}

          <button type="button" className="runBtn" onClick={fetchData} disabled={loading}>
            {loading ? '訓練中…' : result ? '↺ 重新載入' : '▶ 載入模型'}
          </button>

          {result && (
            <>
              <div className="priorSection">
                <div className="priorRow">
                  <span className="priorLabel">P(類別 1) 先驗</span>
                  <span className="priorVal" style={{ color: C1 }}>{prior1.toFixed(2)}</span>
                </div>
                <input
                  type="range" min={0.05} max={0.95} step={0.01}
                  value={prior1}
                  onChange={(e) => setPrior1(Number(e.target.value))}
                  className="priorSlider"
                />
                <div className="priorMirror">
                  <span style={{ color: C0 }}>P(類別 0) = {prior0.toFixed(2)}</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>（自動補足）</span>
                </div>
              </div>

              <div className="modelParams">
                <div className="mpRow">
                  <span className="mpDot" style={{ background: C0 }} />
                  <span className="mpLabel">類別 0</span>
                  <span>μ = <b>{result.class0.mu}</b></span>
                  <span>σ = <b>{result.class0.sigma}</b></span>
                </div>
                <div className="mpRow">
                  <span className="mpDot" style={{ background: C1 }} />
                  <span className="mpLabel">類別 1</span>
                  <span>μ = <b>{result.class1.mu}</b></span>
                  <span>σ = <b>{result.class1.sigma}</b></span>
                </div>
              </div>

              <div className="statsPanel">
                <div className="statItem full">
                  <span>準確率 Accuracy</span>
                  <strong className={stats.acc >= 0.85 ? 'good' : stats.acc >= 0.7 ? 'ok' : 'weak'}>
                    {(stats.acc * 100).toFixed(1)}%
                  </strong>
                </div>
                <div className="statItem full">
                  <span>決策邊界 x*</span>
                  <strong style={{ color: '#f59e0b' }}>
                    {boundaries.length > 0 ? boundaries.map((b) => b.toFixed(3)).join(', ') : '—'}
                  </strong>
                  <small>
                    {boundaries.length === 2 ? '兩個交點（σ₀ ≠ σ₁）' : boundaries.length === 0 ? '無交叉（一類佔絕對優勢）' : '單一決策點'}
                  </small>
                </div>
                <div className="statItem">
                  <span>TP</span>
                  <strong style={{ color: C1 }}>{stats.tp}</strong>
                </div>
                <div className="statItem">
                  <span>FP</span>
                  <strong style={{ color: '#f97316' }}>{stats.fp}</strong>
                </div>
                <div className="statItem">
                  <span>FN</span>
                  <strong style={{ color: '#a855f7' }}>{stats.fn}</strong>
                </div>
                <div className="statItem">
                  <span>TN</span>
                  <strong style={{ color: C0 }}>{stats.tn}</strong>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Right panel: distribution chart ── */}
        <div className="chartPanel">
          {!result && !loading && (
            <div className="placeholder">
              <div className="placeholderIcon">🔔</div>
              <p>按左側「載入模型」，高斯分布曲線將顯示在這裡。</p>
            </div>
          )}
          {loading && (
            <div className="placeholder">
              <div className="spinner" />
              <p>Python 擬合 GaussianNB 中…</p>
            </div>
          )}

          {result && chart && (
            <>
              <div className="chartLegend">
                <span><i className="curveLine" style={{ background: C0 }} />P(x | 類別 0)</span>
                <span><i className="curveLine" style={{ background: C1 }} />P(x | 類別 1)</span>
                <span><i className="boundaryLine" />決策邊界 x*</span>
                <span><i className="rugSample" style={{ background: C0 }} /><i className="rugSample" style={{ background: C1 }} />資料 rug</span>
              </div>

              <div className="svgWrap">
                <svg viewBox={`0 0 ${chart.W} ${chart.H}`} className="nbChart">

                  {/* Filled areas */}
                  <path d={chart.fill0} fill={C0} fillOpacity="0.12" />
                  <path d={chart.fill1} fill={C1} fillOpacity="0.12" />

                  {/* Grid */}
                  {chart.yTicks.map((t, i) => (
                    <line key={i}
                      x1={chart.PAD.left} y1={t.svgY}
                      x2={chart.W - chart.PAD.right} y2={t.svgY}
                      stroke="var(--grid)" strokeWidth="1"
                    />
                  ))}

                  {/* Axes */}
                  <line x1={chart.PAD.left} y1={chart.baseY} x2={chart.W - chart.PAD.right} y2={chart.baseY} stroke="var(--axis)" strokeWidth="1.5" />
                  <line x1={chart.PAD.left} y1={chart.PAD.top} x2={chart.PAD.left} y2={chart.baseY} stroke="var(--axis)" strokeWidth="1.5" />

                  {/* Gaussian curves */}
                  <path d={chart.stroke0} fill="none" stroke={C0} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={chart.stroke1} fill="none" stroke={C1} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                  {/* μ markers */}
                  <line x1={chart.toX(result.class0.mu)} y1={chart.PAD.top} x2={chart.toX(result.class0.mu)} y2={chart.baseY} stroke={C0} strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.5" />
                  <text x={chart.toX(result.class0.mu)} y={chart.PAD.top - 4} textAnchor="middle" fontSize="11" fill={C0} fontWeight="800">μ₀</text>
                  <line x1={chart.toX(result.class1.mu)} y1={chart.PAD.top} x2={chart.toX(result.class1.mu)} y2={chart.baseY} stroke={C1} strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.5" />
                  <text x={chart.toX(result.class1.mu)} y={chart.PAD.top - 4} textAnchor="middle" fontSize="11" fill={C1} fontWeight="800">μ₁</text>

                  {/* Decision boundaries */}
                  {boundaries.map((bx, i) => (
                    <g key={i}>
                      <line
                        x1={chart.toX(bx)} y1={chart.PAD.top}
                        x2={chart.toX(bx)} y2={chart.baseY}
                        stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="6 3"
                      />
                      <circle cx={chart.toX(bx)} cy={chart.baseY} r="4" fill="#f59e0b" />
                    </g>
                  ))}

                  {/* Tick labels */}
                  {chart.xTicks.map((t, i) => (
                    <text key={i} x={t.svgX} y={chart.baseY + 15} textAnchor="middle" fontSize="11" fill="var(--tick)">{t.x}</text>
                  ))}
                  {chart.yTicks.map((t, i) => (
                    <text key={i} x={chart.PAD.left - 5} y={t.svgY + 4} textAnchor="end" fontSize="10" fill="var(--tick)">{t.label}</text>
                  ))}

                  {/* Axis labels */}
                  <text x={chart.PAD.left + chart.cW / 2} y={chart.H - 2} textAnchor="middle" fontSize="11" fill="var(--tick)" fontWeight="600">特徵值 x</text>
                  <text x={11} y={chart.PAD.top + chart.cH / 2} textAnchor="middle" fontSize="11" fill="var(--tick)" fontWeight="600" transform={`rotate(-90, 11, ${chart.PAD.top + chart.cH / 2})`}>P(x | class)</text>

                  {/* Data rug — class 0 */}
                  {result.points.filter((p) => p.label === 0).map((p, i) => (
                    <line key={i}
                      x1={chart.toX(p.x)} y1={chart.rugY0}
                      x2={chart.toX(p.x)} y2={chart.rugY0 + 8}
                      stroke={C0} strokeWidth="1.2" strokeOpacity="0.4"
                    />
                  ))}
                  {/* Data rug — class 1 */}
                  {result.points.filter((p) => p.label === 1).map((p, i) => (
                    <line key={i}
                      x1={chart.toX(p.x)} y1={chart.rugY1}
                      x2={chart.toX(p.x)} y2={chart.rugY1 + 8}
                      stroke={C1} strokeWidth="1.2" strokeOpacity="0.4"
                    />
                  ))}
                  {/* Rug class labels */}
                  <text x={chart.PAD.left - 4} y={chart.rugY0 + 5} textAnchor="end" fontSize="9" fill={C0} fontWeight="700">c₀</text>
                  <text x={chart.PAD.left - 4} y={chart.rugY1 + 5} textAnchor="end" fontSize="9" fill={C1} fontWeight="700">c₁</text>

                </svg>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .nbLab {
          border: 1px solid var(--line); border-radius: 12px;
          background: var(--surface); padding: 24px;
          box-shadow: 0 8px 24px var(--shadow); margin-top: 24px;
          max-width: 860px;
        }
        .nbHeader h3 { margin: 0 0 4px; font-size: 1.1rem; }
        .nbHeader p { margin: 0; color: var(--muted); font-size: 0.86rem; line-height: 1.5; }

        .nbBody {
          display: grid;
          grid-template-columns: 270px minmax(0, 1fr);
          gap: 28px; align-items: start; margin-top: 20px;
        }

        .formulaBox {
          background: var(--surface-soft); border: 1px solid var(--line);
          border-radius: 8px; padding: 10px 14px; margin-bottom: 16px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .formulaTitle { font-size: 0.7rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .formulaBox code { font-family: 'Consolas', monospace; font-size: 0.9rem; color: var(--text); }
        .formulaHint { font-size: 0.72rem; color: var(--muted); line-height: 1.45; }

        .errMsg {
          margin: 0 0 10px; font-size: 0.82rem; color: #dc2626;
          background: #fee2e2; border: 1px solid #fca5a5;
          border-radius: 6px; padding: 8px 10px;
        }
        .runBtn {
          width: 100%; border: 0; border-radius: 8px;
          background: var(--accent); color: #fff;
          padding: 13px; font: inherit; font-weight: 800;
          cursor: pointer; font-size: 0.95rem; transition: opacity 0.15s;
          margin-bottom: 14px;
        }
        .runBtn:disabled { opacity: 0.6; cursor: not-allowed; }

        .priorSection {
          border: 1px solid var(--line); border-radius: 8px;
          background: var(--surface-soft); padding: 11px 14px;
          margin-bottom: 12px;
        }
        .priorRow { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
        .priorLabel { font-size: 0.82rem; font-weight: 700; color: var(--text); }
        .priorVal { font-size: 1.25rem; font-weight: 900; font-family: 'Consolas', monospace; }
        .priorSlider { width: 100%; cursor: pointer; height: 4px; accent-color: #3b82f6; display: block; }
        .priorMirror { display: flex; justify-content: space-between; align-items: center; margin-top: 7px; font-size: 0.8rem; font-weight: 700; }

        .modelParams {
          border: 1px solid var(--line); border-radius: 8px;
          background: var(--surface-soft); padding: 9px 12px;
          margin-bottom: 14px; display: flex; flex-direction: column; gap: 6px;
        }
        .mpRow { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--muted); }
        .mpRow b { color: var(--text); }
        .mpDot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .mpLabel { font-weight: 700; color: var(--text); min-width: 42px; }

        .statsPanel {
          display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
          border-top: 1px solid var(--line); padding-top: 14px;
        }
        .statItem {
          border: 1px solid var(--line); border-radius: 7px;
          background: var(--surface-soft); padding: 9px 11px;
          display: flex; flex-direction: column; gap: 2px;
        }
        .statItem.full { grid-column: 1 / -1; }
        .statItem span { font-size: 0.72rem; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
        .statItem strong { font-size: 1rem; font-family: 'Consolas', monospace; color: var(--text); }
        .statItem strong.good { color: #16a34a; }
        .statItem strong.ok   { color: #d97706; }
        .statItem strong.weak { color: #dc2626; }
        .statItem small { font-size: 0.7rem; color: var(--muted); margin-top: 2px; }

        .placeholder {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 12px; padding: 48px 24px;
          border: 2px dashed var(--line); border-radius: 10px;
          color: var(--muted); text-align: center;
        }
        .placeholderIcon { font-size: 2.8rem; }
        .placeholder p { margin: 0; font-size: 0.88rem; }
        .spinner {
          width: 36px; height: 36px;
          border: 3px solid var(--line); border-top-color: var(--accent);
          border-radius: 50%; animation: spin 0.85s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .chartLegend {
          display: flex; flex-wrap: wrap; gap: 8px 16px;
          margin-bottom: 10px; font-size: 0.78rem; color: var(--muted-strong);
          align-items: center;
        }
        .chartLegend span { display: flex; align-items: center; gap: 5px; }
        .curveLine { display: inline-block; width: 22px; height: 3px; border-radius: 2px; }
        .boundaryLine { display: inline-block; width: 20px; height: 3px; background: repeating-linear-gradient(90deg, #f59e0b 0 5px, transparent 5px 9px); }
        .rugSample { display: inline-block; width: 2px; height: 10px; border-radius: 1px; margin-right: 1px; }

        .svgWrap {
          border: 1px solid var(--line); border-radius: 8px;
          background: var(--surface-soft); overflow: visible;
        }
        .nbChart {
          width: 100%; display: block; overflow: visible;
          --grid: var(--line-soft); --axis: var(--line); --tick: var(--muted);
        }

        @media (max-width: 960px) {
          .nbBody { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
