import { useState, useMemo } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const C0 = '#ef4444'; // class 0 — red
const C1 = '#3b82f6'; // class 1 — blue

function logit(p) {
  return Math.log(p / (1 - p));
}

function computeStats(points, threshold) {
  let tp = 0, tn = 0, fp = 0, fn = 0;
  const preds = points.map((p) => (p.prob >= threshold ? 1 : 0));
  points.forEach((p, i) => {
    if (preds[i] === 1 && p.label === 1) tp++;
    else if (preds[i] === 0 && p.label === 0) tn++;
    else if (preds[i] === 1 && p.label === 0) fp++;
    else fn++;
  });
  const acc = (tp + tn) / points.length;
  const prec = tp + fp > 0 ? tp / (tp + fp) : 0;
  const rec = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = prec + rec > 0 ? (2 * prec * rec) / (prec + rec) : 0;
  return { tp, tn, fp, fn, acc, prec, rec, f1, preds };
}

function buildChart(result) {
  const PAD = { top: 24, right: 24, bottom: 48, left: 48 };
  const W = 420, H = 420;
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const allX = result.points.map((p) => p.x);
  const allY = result.points.map((p) => p.y);
  const rawXMin = Math.min(...allX), rawXMax = Math.max(...allX);
  const rawYMin = Math.min(...allY), rawYMax = Math.max(...allY);
  const xPad = (rawXMax - rawXMin) * 0.12 || 0.5;
  const yPad = (rawYMax - rawYMin) * 0.12 || 0.5;
  const xMin = rawXMin - xPad, xMax = rawXMax + xPad;
  const yMin = rawYMin - yPad, yMax = rawYMax + yPad;

  const toX = (x) => PAD.left + ((x - xMin) / (xMax - xMin)) * cW;
  const toY = (y) => PAD.top + cH - ((y - yMin) / (yMax - yMin)) * cH;

  const makeTicks = (lo, hi) => {
    const range = hi - lo;
    const mag = Math.pow(10, Math.floor(Math.log10(range)));
    const s = mag * (range / mag < 3 ? 0.5 : 1);
    const start = Math.ceil(lo / s) * s;
    const ticks = [];
    for (let t = start; t <= hi + 1e-9; t += s) ticks.push(parseFloat(t.toFixed(6)));
    return ticks.slice(0, 8);
  };

  return {
    toX, toY,
    xTicks: makeTicks(xMin, xMax),
    yTicks: makeTicks(yMin, yMax),
    W, H, PAD, xMin, xMax, yMin, yMax,
  };
}

export default function LogisticRegressionLab() {
  const [result, setResult] = useState(null);
  const [threshold, setThreshold] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function simulate() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/simulate-logistic-regression`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || '執行失敗'); }
      setResult(await res.json());
    } catch (e) {
      setError(e.message || '無法連線到後端');
    } finally {
      setLoading(false);
    }
  }

  const chart = useMemo(() => result ? buildChart(result) : null, [result]);
  const stats = useMemo(() => result ? computeStats(result.points, threshold) : null, [result, threshold]);

  // Decision boundary line in SVG pixel coords
  const boundary = useMemo(() => {
    if (!result || !chart || threshold <= 0 || threshold >= 1) return null;
    const [w1, w2] = result.coef;
    const b = result.intercept;
    if (Math.abs(w2) < 1e-6) return null;
    const lt = logit(threshold);
    const y1 = (lt - w1 * chart.xMin - b) / w2;
    const y2 = (lt - w1 * chart.xMax - b) / w2;
    return {
      x1: chart.toX(chart.xMin), y1: chart.toY(y1),
      x2: chart.toX(chart.xMax), y2: chart.toY(y2),
    };
  }, [result, chart, threshold]);

  return (
    <section className="lgLab">
      <div className="lgHeader">
        <h3>邏輯斯迴歸模擬實驗室</h3>
        <p>
          按「生成資料」訓練一次模型，再拖曳閾值滑桿，即時觀察決策邊界如何移動，
          並追蹤 Precision / Recall 的消長關係。
        </p>
      </div>

      <div className="lgBody">
        {/* ── Left panel ── */}
        <div className="paramPanel">
          <div className="formulaBox">
            <span className="formulaTitle">模型公式</span>
            <code>P(y=1) = σ(w·x + b)</code>
            <span className="formulaHint">
              決策邊界：w₁x₁ + w₂x₂ + b = logit(閾值)
            </span>
          </div>

          {error && <p className="errMsg">{error}</p>}

          <button type="button" className="runBtn" onClick={simulate} disabled={loading}>
            {loading ? '訓練中…' : result ? '↺ 重新生成' : '▶ 生成資料並訓練'}
          </button>

          {result && (
            <>
              <div className="thresholdSection">
                <div className="thresholdHeader">
                  <span className="thresholdLabel">決策閾值</span>
                  <span className="thresholdVal">{threshold.toFixed(2)}</span>
                </div>
                <input
                  type="range" min={0.05} max={0.95} step={0.01}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="thresholdSlider"
                />
                <div className="thresholdHints">
                  <span>← 提高 Recall（減少漏診）</span>
                  <span>降低 FP →</span>
                </div>
              </div>

              <div className="statsPanel">
                <div className="statItem full">
                  <span>準確率 Accuracy</span>
                  <strong className={stats.acc >= 0.85 ? 'good' : stats.acc >= 0.7 ? 'ok' : 'weak'}>
                    {(stats.acc * 100).toFixed(1)}%
                  </strong>
                </div>
                <div className="statItem">
                  <span>Precision</span>
                  <strong>{stats.prec.toFixed(4)}</strong>
                  <small>TP / (TP+FP)</small>
                </div>
                <div className="statItem">
                  <span>Recall</span>
                  <strong>{stats.rec.toFixed(4)}</strong>
                  <small>TP / (TP+FN)</small>
                </div>
                <div className="statItem full">
                  <span>F1-score</span>
                  <strong className={stats.f1 >= 0.8 ? 'good' : stats.f1 >= 0.6 ? 'ok' : 'weak'}>
                    {stats.f1.toFixed(4)}
                  </strong>
                  <small>2 × Precision × Recall / (P + R)</small>
                </div>

                {/* Confusion matrix */}
                <div className="cmWrap full">
                  <span className="cmTitle">混淆矩陣</span>
                  <div className="cm">
                    <div className="cmCell tp">
                      <span className="cmVal">{stats.tp}</span>
                      <span className="cmLbl">TP</span>
                    </div>
                    <div className="cmCell fp">
                      <span className="cmVal">{stats.fp}</span>
                      <span className="cmLbl">FP</span>
                    </div>
                    <div className="cmCell fn">
                      <span className="cmVal">{stats.fn}</span>
                      <span className="cmLbl">FN</span>
                    </div>
                    <div className="cmCell tn">
                      <span className="cmVal">{stats.tn}</span>
                      <span className="cmLbl">TN</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Right panel: scatter plot ── */}
        <div className="chartPanel">
          {!result && !loading && (
            <div className="placeholder">
              <div className="placeholderIcon">📊</div>
              <p>按左側「生成資料並訓練」，散佈圖與決策邊界將顯示在這裡。</p>
            </div>
          )}
          {loading && (
            <div className="placeholder">
              <div className="spinner" />
              <p>Python 訓練邏輯斯迴歸中…</p>
            </div>
          )}

          {result && chart && stats && (
            <>
              <div className="chartLegend">
                <span><i className="dot" style={{ background: C1 }} />類別 1（正例）</span>
                <span><i className="dot" style={{ background: C0 }} />類別 0（負例）</span>
                <span><i className="dotMiss" />誤分類</span>
                <span><i className="boundaryLine" />決策邊界（閾值 {threshold.toFixed(2)}）</span>
              </div>

              <div className="svgWrap">
                <svg viewBox={`0 0 ${chart.W} ${chart.H}`} className="simChart">
                  {/* grid */}
                  {chart.yTicks.map((t, i) => (
                    <line key={i}
                      x1={chart.PAD.left} y1={chart.toY(t)}
                      x2={chart.W - chart.PAD.right} y2={chart.toY(t)}
                      stroke="var(--grid)" strokeWidth="1"
                    />
                  ))}
                  {chart.xTicks.map((t, i) => (
                    <line key={i}
                      x1={chart.toX(t)} y1={chart.PAD.top}
                      x2={chart.toX(t)} y2={chart.H - chart.PAD.bottom}
                      stroke="var(--grid)" strokeWidth="1"
                    />
                  ))}

                  {/* axes */}
                  <line x1={chart.PAD.left} y1={chart.PAD.top} x2={chart.PAD.left} y2={chart.H - chart.PAD.bottom} stroke="var(--axis)" strokeWidth="1.5" />
                  <line x1={chart.PAD.left} y1={chart.H - chart.PAD.bottom} x2={chart.W - chart.PAD.right} y2={chart.H - chart.PAD.bottom} stroke="var(--axis)" strokeWidth="1.5" />

                  {/* tick labels */}
                  {chart.xTicks.map((t, i) => (
                    <text key={i} x={chart.toX(t)} y={chart.H - chart.PAD.bottom + 16} textAnchor="middle" fontSize="11" fill="var(--tick)">
                      {Number.isInteger(t) ? t : t.toFixed(1)}
                    </text>
                  ))}
                  {chart.yTicks.map((t, i) => (
                    <text key={i} x={chart.PAD.left - 7} y={chart.toY(t) + 4} textAnchor="end" fontSize="11" fill="var(--tick)">
                      {Number.isInteger(t) ? t : t.toFixed(1)}
                    </text>
                  ))}

                  {/* axis labels */}
                  <text x={chart.PAD.left + (chart.W - chart.PAD.left - chart.PAD.right) / 2} y={chart.H - 6} textAnchor="middle" fontSize="11" fill="var(--tick)" fontWeight="600">特徵 1</text>
                  <text x={12} y={chart.PAD.top + (chart.H - chart.PAD.top - chart.PAD.bottom) / 2} textAnchor="middle" fontSize="11" fill="var(--tick)" fontWeight="600" transform={`rotate(-90, 12, ${chart.PAD.top + (chart.H - chart.PAD.top - chart.PAD.bottom) / 2})`}>特徵 2</text>

                  {/* data points */}
                  {result.points.map((p, i) => {
                    const correct = stats.preds[i] === p.label;
                    const color = p.label === 1 ? C1 : C0;
                    const cx = chart.toX(p.x);
                    const cy = chart.toY(p.y);
                    if (correct) {
                      return <circle key={i} cx={cx} cy={cy} r="4" fill={color} fillOpacity="0.7" />;
                    }
                    return (
                      <g key={i}>
                        <circle cx={cx} cy={cy} r="5" fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="3 2" />
                        <circle cx={cx} cy={cy} r="2" fill={color} fillOpacity="0.35" />
                      </g>
                    );
                  })}

                  {/* decision boundary */}
                  {boundary && (
                    <line
                      x1={boundary.x1} y1={boundary.y1}
                      x2={boundary.x2} y2={boundary.y2}
                      stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"
                      strokeDasharray={threshold === 0.5 ? 'none' : '6 3'}
                    />
                  )}
                </svg>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .lgLab {
          border: 1px solid var(--line); border-radius: 12px;
          background: var(--surface); padding: 24px;
          box-shadow: 0 8px 24px var(--shadow); margin-top: 24px;
          max-width: 860px;
        }
        .lgHeader h3 { margin: 0 0 4px; font-size: 1.1rem; }
        .lgHeader p { margin: 0; color: var(--muted); font-size: 0.86rem; line-height: 1.5; }

        .lgBody {
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          gap: 28px; align-items: start; margin-top: 20px;
        }

        .formulaBox {
          background: var(--surface-soft); border: 1px solid var(--line);
          border-radius: 8px; padding: 10px 14px; margin-bottom: 16px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .formulaTitle { font-size: 0.7rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .formulaBox code { font-family: 'Consolas', monospace; font-size: 0.93rem; color: var(--text); }
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
          margin-bottom: 16px;
        }
        .runBtn:disabled { opacity: 0.6; cursor: not-allowed; }

        .thresholdSection {
          border: 1px solid var(--line); border-radius: 8px;
          background: var(--surface-soft); padding: 12px 14px;
          margin-bottom: 14px;
        }
        .thresholdHeader { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
        .thresholdLabel { font-size: 0.82rem; font-weight: 700; color: var(--text); }
        .thresholdVal {
          font-size: 1.2rem; font-weight: 900; font-family: 'Consolas', monospace;
          color: #f59e0b;
        }
        .thresholdSlider { width: 100%; cursor: pointer; height: 4px; accent-color: #f59e0b; display: block; }
        .thresholdHints {
          display: flex; justify-content: space-between;
          font-size: 0.68rem; color: var(--muted); margin-top: 6px;
        }

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

        .cmWrap { display: flex; flex-direction: column; gap: 6px; }
        .cmTitle { font-size: 0.72rem; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
        .cm { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
        .cmCell {
          border-radius: 6px; padding: 7px 8px;
          display: flex; flex-direction: column; align-items: center; gap: 1px;
        }
        .cmCell .cmVal { font-size: 1.1rem; font-weight: 900; font-family: 'Consolas', monospace; }
        .cmCell .cmLbl { font-size: 0.68rem; font-weight: 700; }
        .cmCell.tp { background: rgba(59,130,246,0.12); color: #3b82f6; }
        .cmCell.tn { background: rgba(239,68,68,0.12); color: #ef4444; }
        .cmCell.fp { background: rgba(249,115,22,0.12); color: #f97316; }
        .cmCell.fn { background: rgba(168,85,247,0.12); color: #a855f7; }

        .placeholder {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 12px; padding: 56px 24px;
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
        .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
        .dotMiss {
          display: inline-block; width: 10px; height: 10px; border-radius: 50%;
          border: 2px dashed #94a3b8; background: rgba(148,163,184,0.2);
        }
        .boundaryLine { display: inline-block; width: 22px; height: 3px; background: #f59e0b; border-radius: 2px; }

        .svgWrap {
          border: 1px solid var(--line); border-radius: 8px;
          background: var(--surface-soft); overflow: hidden;
        }
        .simChart {
          width: 100%; display: block;
          --grid: var(--line-soft); --axis: var(--line); --tick: var(--muted);
        }

        @media (max-width: 960px) {
          .lgBody { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
