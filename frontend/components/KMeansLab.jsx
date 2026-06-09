import { useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const CLUSTER_COLORS = [
  '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6',
];

function SliderRow({ label, sub, value, min, max, step, onChange, color }) {
  return (
    <div className="paramRow">
      <div className="paramMeta">
        <span className="paramLabel">{label}</span>
        <span className="paramSub">{sub}</span>
      </div>
      <input
        className="paramSlider"
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ accentColor: color }}
      />
      <span className="paramVal" style={{ color }}>{value}</span>
      <style jsx>{`
        .paramRow { display: grid; grid-template-columns: 140px 1fr 48px; gap: 10px; align-items: center; }
        .paramMeta { display: flex; flex-direction: column; }
        .paramLabel { font-size: 0.88rem; font-weight: 700; color: var(--text); }
        .paramSub { font-size: 0.72rem; color: var(--muted); margin-top: 1px; }
        .paramSlider { width: 100%; cursor: pointer; height: 4px; min-width: 0; }
        .paramVal { font-size: 0.95rem; font-weight: 800; text-align: right; font-family: 'Consolas', monospace; white-space: nowrap; }
      `}</style>
    </div>
  );
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
  const xPad = (rawXMax - rawXMin) * 0.1 || 0.5;
  const yPad = (rawYMax - rawYMin) * 0.1 || 0.5;
  const xMin = rawXMin - xPad, xMax = rawXMax + xPad;
  const yMin = rawYMin - yPad, yMax = rawYMax + yPad;

  const toX = (x) => PAD.left + ((x - xMin) / (xMax - xMin)) * cW;
  const toY = (y) => PAD.top + cH - ((y - yMin) / (yMax - yMin)) * cH;

  const step = (v) => {
    const range = v[1] - v[0];
    const mag = Math.pow(10, Math.floor(Math.log10(range)));
    return mag * (range / mag < 3 ? 0.5 : 1);
  };
  const makeTicks = (lo, hi) => {
    const s = step([lo, hi]);
    const start = Math.ceil(lo / s) * s;
    const ticks = [];
    for (let t = start; t <= hi + 1e-9; t += s) ticks.push(parseFloat(t.toFixed(6)));
    return ticks.slice(0, 8);
  };

  const xTicks = makeTicks(xMin, xMax);
  const yTicks = makeTicks(yMin, yMax);

  return { toX, toY, xTicks, yTicks, W, H, PAD };
}

export default function KMeansLab() {
  const [nClusters, setNClusters] = useState(4);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function simulate() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/simulate-kmeans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n_clusters: nClusters }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || '執行失敗'); }
      setResult(await res.json());
    } catch (e) {
      setError(e.message || '無法連線到後端');
    } finally {
      setLoading(false);
    }
  }

  const chart = result ? buildChart(result) : null;
  const sil = result?.silhouette ?? 0;
  const silClass = sil >= 0.6 ? 'good' : sil >= 0.35 ? 'ok' : 'weak';

  return (
    <section className="kmLab">
      <div className="kmHeader">
        <h3>K-Means 聚類模擬實驗室</h3>
        <p>
          調整群數 K，觀察聚類結果如何改變。資料由 4 個 Gaussian blob 生成（固定），
          ✕ 標記為 K-Means 計算出的群中心，顏色表示每個點的所屬群。
        </p>
      </div>

      <div className="kmBody">
        {/* ── Left: sliders + stats ── */}
        <div className="paramPanel">
          <div className="formulaBox">
            <span className="formulaTitle">演算法目標</span>
            <code>min Σ ||x&#x1D62; − μ&#x2096;||²</code>
            <span className="formulaHint">最小化每個點到所屬群中心的距離平方和</span>
          </div>

          <div className="sliderStack">
            <SliderRow
              label="群數 K"
              sub={`分成 ${nClusters} 個群`}
              value={nClusters} min={1} max={10} step={1}
              onChange={setNClusters}
              color="#06b6d4"
            />
          </div>

          {error && <p className="errMsg">{error}</p>}

          <button type="button" className="runBtn" onClick={simulate} disabled={loading}>
            {loading ? '計算中…' : '▶ 送出模擬'}
          </button>

          {result && (
            <div className="statsPanel">
              <div className="statItem full">
                <span>群數 K</span>
                <strong style={{ color: '#06b6d4' }}>{result.n_clusters}</strong>
                <small>資料真實群數為 4</small>
              </div>
              <div className="statItem">
                <span>Inertia</span>
                <strong>{result.inertia}</strong>
                <small>群內距離平方和，越小越緊密</small>
              </div>
              <div className="statItem">
                <span>Silhouette Score</span>
                <strong className={silClass}>{result.silhouette}</strong>
                <small>{sil >= 0.6 ? '分群良好' : sil >= 0.35 ? '尚可' : '分群重疊'}</small>
              </div>
              {result.n_clusters !== 4 && (
                <div className="hintBox">
                  <b>提示：</b>本資料有 4 個真實群。試試 K=4，觀察 Silhouette Score 的變化！
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: scatter plot ── */}
        <div className="chartPanel">
          {!result && !loading && (
            <div className="placeholder">
              <div className="placeholderIcon">🔵</div>
              <p>調整左側群數後按「送出模擬」，聚類結果將顯示在這裡。</p>
            </div>
          )}
          {loading && (
            <div className="placeholder">
              <div className="spinner" />
              <p>Python 執行 K-Means 中…</p>
            </div>
          )}

          {result && chart && (
            <>
              <div className="chartLegend">
                {result.centers.map((_, i) => (
                  <span key={i}>
                    <i className="dot" style={{ background: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }} />
                    群 {i + 1}
                  </span>
                ))}
                <span><i className="centerIcon" />群中心</span>
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
                  {result.points.map((p, i) => (
                    <circle key={i}
                      cx={chart.toX(p.x)} cy={chart.toY(p.y)}
                      r="3.5"
                      fill={CLUSTER_COLORS[p.label % CLUSTER_COLORS.length]}
                      fillOpacity="0.65"
                    />
                  ))}

                  {/* cluster centers: glow ring + X cross + dot */}
                  {result.centers.map((c, i) => {
                    const cx = chart.toX(c.x);
                    const cy = chart.toY(c.y);
                    const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
                    const s = 9;
                    return (
                      <g key={i}>
                        <circle cx={cx} cy={cy} r="18" fill={color} fillOpacity="0.12" />
                        <line x1={cx - s} y1={cy - s} x2={cx + s} y2={cy + s} stroke={color} strokeWidth="3.5" strokeLinecap="round" />
                        <line x1={cx + s} y1={cy - s} x2={cx - s} y2={cy + s} stroke={color} strokeWidth="3.5" strokeLinecap="round" />
                        <circle cx={cx} cy={cy} r="5" fill={color} stroke="var(--surface-soft)" strokeWidth="2" />
                      </g>
                    );
                  })}
                </svg>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .kmLab {
          border: 1px solid var(--line); border-radius: 12px;
          background: var(--surface); padding: 24px;
          box-shadow: 0 8px 24px var(--shadow); margin-top: 24px;
          max-width: 860px;
        }
        .kmHeader h3 { margin: 0 0 4px; font-size: 1.1rem; }
        .kmHeader p { margin: 0; color: var(--muted); font-size: 0.86rem; line-height: 1.5; }

        .kmBody {
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          gap: 28px; align-items: start; margin-top: 20px;
        }

        .formulaBox {
          background: var(--surface-soft); border: 1px solid var(--line);
          border-radius: 8px; padding: 10px 14px; margin-bottom: 18px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .formulaTitle { font-size: 0.7rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .formulaBox code { font-family: 'Consolas', monospace; font-size: 0.93rem; color: var(--text); }
        .formulaHint { font-size: 0.72rem; color: var(--muted); }

        .sliderStack { display: flex; flex-direction: column; gap: 16px; margin-bottom: 18px; }

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
        .statItem small { font-size: 0.72rem; color: var(--muted); margin-top: 2px; }

        .hintBox {
          grid-column: 1 / -1; border-radius: 7px;
          background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.25);
          padding: 9px 11px; font-size: 0.78rem; color: var(--muted-strong); line-height: 1.5;
        }

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
        .centerIcon {
          display: inline-block; width: 14px; height: 14px;
          background: linear-gradient(45deg, transparent 45%, #94a3b8 45%, #94a3b8 55%, transparent 55%),
                      linear-gradient(-45deg, transparent 45%, #94a3b8 45%, #94a3b8 55%, transparent 55%);
        }

        .svgWrap {
          border: 1px solid var(--line); border-radius: 8px;
          background: var(--surface-soft); overflow: hidden;
        }
        .simChart {
          width: 100%; display: block;
          --grid: var(--line-soft); --axis: var(--line); --tick: var(--muted);
        }

        @media (max-width: 960px) {
          .kmBody { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
