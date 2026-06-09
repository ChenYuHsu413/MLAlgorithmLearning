import { useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const PARAM_DEFAULTS = { n: 80, a: 3, b: 30, var: 60 };

function buildChart(result) {
  const PAD = { top: 32, right: 32, bottom: 52, left: 64 };
  const W = 420, H = 420;
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const xMin = -100, xMax = 100;
  const allY = [...result.y_values, ...result.true_line_y, ...result.fitted_line_y];
  const rawYMin = Math.min(...allY), rawYMax = Math.max(...allY);
  const yPad = (rawYMax - rawYMin) * 0.12 || 10;
  const yMin = rawYMin - yPad, yMax = rawYMax + yPad;

  const toX = (x) => PAD.left + ((x - xMin) / (xMax - xMin)) * cW;
  const toY = (y) => PAD.top + cH - ((y - yMin) / (yMax - yMin)) * cH;

  const xTicks = [-100, -50, 0, 50, 100];
  const yStep = (rawYMax - rawYMin) / 5 || 1;
  const yTicks = Array.from({ length: 6 }, (_, i) => rawYMin + yStep * i);

  const outlierSet = new Set(result.outlier_indices);

  return { toX, toY, xTicks, yTicks, W, H, PAD, outlierSet };
}

function SliderRow({ label, sub, value, min, max, step, onChange, color }) {
  return (
    <div className="paramRow">
      <div className="paramMeta">
        <span className="paramLabel">{label}</span>
        <span className="paramSub">{sub}</span>
      </div>
      <div className="paramControl">
        <input
          type="range" min={min} max={max} step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ accentColor: color }}
        />
        <span className="paramVal" style={{ color }}>{value}</span>
      </div>
      <style jsx>{`
        .paramRow { display: grid; grid-template-columns: 140px 1fr; gap: 10px; align-items: center; }
        .paramMeta { display: flex; flex-direction: column; }
        .paramLabel { font-size: 0.88rem; font-weight: 700; color: var(--text); }
        .paramSub { font-size: 0.72rem; color: var(--muted); margin-top: 1px; }
        .paramControl { display: flex; align-items: center; gap: 10px; }
        .paramControl input[type=range] { flex: 1; cursor: pointer; height: 4px; }
        .paramVal { font-size: 0.95rem; font-weight: 800; min-width: 44px; text-align: right; font-family: 'Consolas', monospace; }
      `}</style>
    </div>
  );
}

export default function LinearRegressionLab() {
  const [params, setParams] = useState(PARAM_DEFAULTS);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(key, val) { setParams((p) => ({ ...p, [key]: val })); }

  async function simulate() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/simulate-linear-regression`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
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

  return (
    <section className="lrLab">
      <div className="lrHeader">
        <h3>線性迴歸模擬實驗室</h3>
        <p>
          設定真實模型參數，生成帶噪聲的資料點，觀察迴歸線如何逼近真實線，並找出最大的 10 個離群點。
        </p>
      </div>

      <div className="lrBody">
        {/* ── Left: parameter sliders ── */}
        <div className="paramPanel">
          <div className="formulaBox">
            <span className="formulaTitle">資料生成公式</span>
            <code>y = <b style={{color:'#3b82f6'}}>{params.a}</b>x + <b style={{color:'#8b5cf6'}}>{params.b}</b> + N(0, <b style={{color:'#f59e0b'}}>{params.var}</b>)</code>
            <span className="formulaHint">x ~ Uniform(-100, 100)</span>
          </div>

          <div className="sliderStack">
            <SliderRow
              label="資料點數量 n"
              sub={`生成 ${params.n} 個隨機點`}
              value={params.n} min={10} max={300} step={5}
              onChange={(v) => set('n', v)}
              color="#22c55e"
            />
            <SliderRow
              label="真實斜率 a"
              sub="控制直線傾斜程度"
              value={params.a} min={-50} max={50} step={1}
              onChange={(v) => set('a', v)}
              color="#3b82f6"
            />
            <SliderRow
              label="真實截距 b"
              sub="直線與 y 軸的交點"
              value={params.b} min={0} max={100} step={1}
              onChange={(v) => set('b', v)}
              color="#8b5cf6"
            />
            <SliderRow
              label="噪聲變異數 σ²"
              sub="越大表示資料越散亂"
              value={params.var} min={0} max={300} step={5}
              onChange={(v) => set('var', v)}
              color="#f59e0b"
            />
          </div>

          {error && <p className="errMsg">{error}</p>}

          <button type="button" className="runBtn" onClick={simulate} disabled={loading}>
            {loading ? '計算中…' : '▶ 送出模擬'}
          </button>

          {result && (
            <div className="statsPanel">
              <div className="statItem">
                <span>擬合斜率 â</span>
                <strong style={{color:'#ef4444'}}>{result.fitted_slope}</strong>
                <small>真實值 {params.a}</small>
              </div>
              <div className="statItem">
                <span>擬合截距 b̂</span>
                <strong style={{color:'#ef4444'}}>{result.fitted_intercept}</strong>
                <small>真實值 {params.b}</small>
              </div>
              <div className="statItem full">
                <span>決定係數 R²</span>
                <strong className={result.r_squared >= 0.8 ? 'good' : result.r_squared >= 0.5 ? 'ok' : 'weak'}>
                  {result.r_squared}
                </strong>
                <small>{result.r_squared >= 0.8 ? '擬合良好' : result.r_squared >= 0.5 ? '中等' : '擬合較差'}</small>
              </div>
              <div className="statItem full">
                <span>均方根誤差 RMSE</span>
                <strong>{result.rmse}</strong>
                <small>預測誤差平均量</small>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: chart ── */}
        <div className="chartPanel">
          {!result && !loading && (
            <div className="placeholder">
              <div className="placeholderIcon">📉</div>
              <p>調整左側參數後按「送出模擬」，圖表將顯示在這裡。</p>
            </div>
          )}
          {loading && (
            <div className="placeholder">
              <div className="spinner" />
              <p>Python 生成資料並計算中…</p>
            </div>
          )}

          {result && chart && (
            <>
              <div className="chartLegend">
                <span><i className="dot blue" />資料點（{result.x_values.length} 個）</span>
                <span><i className="line blue dashed" />真實線 y={params.a}x+{params.b}</span>
                <span><i className="line red" />迴歸線（擬合結果）</span>
                <span><i className="dot orange big" />離群點（前 10 大殘差）</span>
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

                  {/* axis zero lines */}
                  <line x1={chart.toX(0)} y1={chart.PAD.top} x2={chart.toX(0)} y2={chart.H - chart.PAD.bottom} stroke="var(--axis)" strokeWidth="0.5" strokeDasharray="4 3" opacity="0.5" />

                  {/* tick labels */}
                  {chart.xTicks.map((t, i) => (
                    <text key={i} x={chart.toX(t)} y={chart.H - chart.PAD.bottom + 18} textAnchor="middle" fontSize="11" fill="var(--tick)">{t}</text>
                  ))}
                  {chart.yTicks.map((t, i) => (
                    <text key={i} x={chart.PAD.left - 8} y={chart.toY(t) + 4} textAnchor="end" fontSize="11" fill="var(--tick)">
                      {Math.abs(t) >= 1000 ? (t / 1000).toFixed(1) + 'k' : Number.isInteger(t) ? t : t.toFixed(0)}
                    </text>
                  ))}

                  {/* axis labels */}
                  <text x={chart.PAD.left + (chart.W - chart.PAD.left - chart.PAD.right) / 2} y={chart.H - 6} textAnchor="middle" fontSize="11" fill="var(--tick)" fontWeight="600">x</text>
                  <text x={14} y={chart.PAD.top + (chart.H - chart.PAD.top - chart.PAD.bottom) / 2} textAnchor="middle" fontSize="11" fill="var(--tick)" fontWeight="600" transform={`rotate(-90, 14, ${chart.PAD.top + (chart.H - chart.PAD.top - chart.PAD.bottom) / 2})`}>y</text>

                  {/* data points (normal) */}
                  {result.x_values.map((x, i) => !chart.outlierSet.has(i) && (
                    <circle key={i}
                      cx={chart.toX(x)} cy={chart.toY(result.y_values[i])}
                      r="3.5" fill="#64748b" fillOpacity="0.55"
                    />
                  ))}

                  {/* true line (blue dashed) */}
                  <line
                    x1={chart.toX(-100)} y1={chart.toY(result.true_line_y[0])}
                    x2={chart.toX(100)}  y2={chart.toY(result.true_line_y[1])}
                    stroke="#3b82f6" strokeWidth="2" strokeDasharray="7 4"
                  />

                  {/* fitted line (red solid) */}
                  <line
                    x1={chart.toX(-100)} y1={chart.toY(result.fitted_line_y[0])}
                    x2={chart.toX(100)}  y2={chart.toY(result.fitted_line_y[1])}
                    stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"
                  />

                  {/* outlier drop-lines */}
                  {result.outlier_indices.map((idx) => (
                    <line key={`dl-${idx}`}
                      x1={chart.toX(result.x_values[idx])} y1={chart.toY(result.y_values[idx])}
                      x2={chart.toX(result.x_values[idx])} y2={chart.toY(result.fitted_slope * result.x_values[idx] + result.fitted_intercept)}
                      stroke="#facc15" strokeWidth="2" opacity="0.85"
                    />
                  ))}

                  {/* outlier points — bright yellow, glow ring + rank number */}
                  {result.outlier_indices.map((idx, rank) => {
                    const cx = chart.toX(result.x_values[idx]);
                    const cy = chart.toY(result.y_values[idx]);
                    return (
                      <g key={`ol-${idx}`}>
                        <circle cx={cx} cy={cy} r="16" fill="#facc15" opacity="0.2" />
                        <circle cx={cx} cy={cy} r="10" fill="#facc15" stroke="#1e1e1e" strokeWidth="2" />
                        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="800" fill="#1e1e1e">
                          {rank + 1}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* outlier table */}
              <div className="outlierSection">
                <p className="outlierTitle">Top 10 離群點（殘差最大）</p>
                <div className="outlierGrid">
                  {result.outlier_indices.map((idx, rank) => (
                    <div key={idx} className="outlierItem">
                      <span className="outlierRank">#{rank + 1}</span>
                      <span>x = <b>{result.x_values[idx]}</b></span>
                      <span>y = <b>{result.y_values[idx]}</b></span>
                      <span className="outlierResid">殘差 {result.residuals[idx]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .lrLab {
          border: 1px solid var(--line); border-radius: 12px;
          background: var(--surface); padding: 24px;
          box-shadow: 0 8px 24px var(--shadow); margin-top: 24px;
          max-width: 780px;
        }
        .lrHeader h3 { margin: 0 0 4px; font-size: 1.1rem; }
        .lrHeader p { margin: 0 0 0; color: var(--muted); font-size: 0.86rem; }

        .lrBody {
          display: grid;
          grid-template-columns: 300px 420px;
          gap: 28px; align-items: start; margin-top: 20px;
        }

        /* ── Param panel ── */
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
        .statItem small { font-size: 0.72rem; color: var(--muted); }

        /* ── Chart panel ── */
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
          display: flex; flex-wrap: wrap; gap: 10px 18px;
          margin-bottom: 10px; font-size: 0.78rem; color: var(--muted-strong);
          align-items: center;
        }
        .chartLegend span { display: flex; align-items: center; gap: 5px; }
        .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
        .dot.blue { background: #64748b; opacity: 0.7; }
        .dot.orange.big { background: #facc15; width: 16px; height: 16px; border: 2px solid #1e1e1e; box-shadow: 0 0 0 3px rgba(250,204,21,0.3); }
        .line { display: inline-block; width: 22px; height: 3px; border-radius: 2px; }
        .line.blue { background: #3b82f6; }
        .line.blue.dashed { background: repeating-linear-gradient(90deg, #3b82f6 0 5px, transparent 5px 9px); }
        .line.red { background: #ef4444; }

        .svgWrap {
          border: 1px solid var(--line); border-radius: 8px;
          background: var(--surface-soft); overflow: hidden; margin-bottom: 16px;
        }
        .simChart {
          width: 100%; display: block;
          --grid: var(--line-soft); --axis: var(--line); --tick: var(--muted);
        }

        .outlierTitle { margin: 0 0 8px; font-size: 0.8rem; font-weight: 700; color: var(--muted); }
        .outlierGrid { display: flex; flex-direction: column; gap: 5px; }
        .outlierItem {
          display: grid; grid-template-columns: 30px 1fr 1fr 1fr;
          gap: 6px; align-items: center;
          font-size: 0.78rem; color: var(--muted);
          border: 1px solid var(--line); border-radius: 6px;
          background: var(--surface-soft); padding: 6px 10px;
        }
        .outlierItem b { color: var(--text); }
        .outlierRank { font-weight: 800; color: #ca8a04; font-size: 0.75rem; }
        .outlierResid { font-weight: 700; color: #ca8a04; }

        @media (max-width: 960px) {
          .lrBody { grid-template-columns: 1fr; }
          .statsPanel { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </section>
  );
}
