import { useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const PRESETS = {
  custom: { label: '自訂資料', points: [] },
  house: {
    label: '房價 vs 面積（坪）',
    points: [
      [20, 480], [25, 580], [30, 700], [35, 780], [40, 900],
      [45, 1050], [50, 1150], [55, 1280], [60, 1400], [28, 640],
    ],
  },
  study: {
    label: '讀書時數 vs 成績',
    points: [
      [1, 45], [2, 55], [3, 60], [4, 65], [5, 72],
      [6, 78], [7, 82], [8, 88], [9, 91], [10, 95],
    ],
  },
  temp: {
    label: '氣溫 vs 冰淇淋銷量',
    points: [
      [15, 30], [18, 45], [22, 70], [25, 95], [28, 130],
      [30, 160], [32, 190], [35, 220], [20, 58], [26, 110],
    ],
  },
};

function buildChart(xVals, yVals, lineX, lineY) {
  const PAD = { top: 24, right: 20, bottom: 44, left: 54 };
  const W = 480, H = 300;
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const allX = [...xVals, ...lineX];
  const allY = [...yVals, ...lineY];
  const xMin = Math.min(...allX), xMax = Math.max(...allX);
  const yMin = Math.min(...allY), yMax = Math.max(...allY);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;
  const margin = 0.08;

  function toSvgX(x) {
    return PAD.left + ((x - xMin) / xRange) * chartW * (1 - margin) + chartW * margin * 0.5;
  }
  function toSvgY(y) {
    return PAD.top + chartH - ((y - yMin) / yRange) * chartH * (1 - margin) - chartH * margin * 0.5;
  }

  const ticks = 5;
  const xTicks = Array.from({ length: ticks }, (_, i) => xMin + (xRange / (ticks - 1)) * i);
  const yTicks = Array.from({ length: ticks }, (_, i) => yMin + (yRange / (ticks - 1)) * i);

  const lx1 = toSvgX(lineX[0]), ly1 = toSvgY(lineY[0]);
  const lx2 = toSvgX(lineX[1]), ly2 = toSvgY(lineY[1]);

  return { toSvgX, toSvgY, xTicks, yTicks, lx1, ly1, lx2, ly2, W, H, PAD, chartW, chartH, xMin, xMax, yMin, yMax };
}

export default function LinearRegressionLab() {
  const [preset, setPreset] = useState('house');
  const [rows, setRows] = useState(() => PRESETS.house.points.map(([x, y]) => ({ x: String(x), y: String(y) })));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handlePreset(key) {
    setPreset(key);
    setResult(null);
    setError('');
    if (key === 'custom') {
      setRows([{ x: '', y: '' }, { x: '', y: '' }]);
    } else {
      setRows(PRESETS[key].points.map(([x, y]) => ({ x: String(x), y: String(y) })));
    }
  }

  function updateRow(index, field, value) {
    setRows((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  }

  function addRow() {
    setRows((prev) => [...prev, { x: '', y: '' }]);
  }

  function removeRow(index) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function runRegression() {
    setError('');
    setResult(null);
    const valid = rows.filter((r) => r.x.trim() !== '' && r.y.trim() !== '' && !isNaN(r.x) && !isNaN(r.y));
    if (valid.length < 2) {
      setError('至少需要 2 個有效的資料點（X 和 Y 皆須填寫）');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/run-linear-regression`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x_values: valid.map((r) => parseFloat(r.x)),
          y_values: valid.map((r) => parseFloat(r.y)),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || '執行失敗');
      }
      setResult(await res.json());
    } catch (e) {
      setError(e.message || '無法連線到後端');
    } finally {
      setLoading(false);
    }
  }

  const chart = result
    ? buildChart(result.x_values, result.y_values, result.line_x, result.line_y)
    : null;

  return (
    <section className="lrLab">
      <div className="lrHeader">
        <h3>線性迴歸實驗室</h3>
        <p>輸入你自己的資料點，讓 Python（scikit-learn）幫你計算並繪製迴歸線。</p>
      </div>

      <div className="lrBody">
        {/* ── Left: data input ── */}
        <div className="lrInput">
          <div className="presetRow">
            <label>選擇範例資料集</label>
            <div className="presetBtns">
              {Object.entries(PRESETS).map(([key, p]) => (
                <button
                  key={key}
                  type="button"
                  className={preset === key ? 'active' : ''}
                  onClick={() => handlePreset(key)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="tableWrap">
            <table>
              <thead>
                <tr><th>#</th><th>X 值</th><th>Y 值</th><th></th></tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td className="rowNum">{i + 1}</td>
                    <td>
                      <input
                        type="number"
                        value={row.x}
                        placeholder="例：25"
                        onChange={(e) => updateRow(i, 'x', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.y}
                        placeholder="例：580"
                        onChange={(e) => updateRow(i, 'y', e.target.value)}
                      />
                    </td>
                    <td>
                      <button type="button" className="removeBtn" onClick={() => removeRow(i)} aria-label="刪除">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tableActions">
            <button type="button" className="addBtn" onClick={addRow}>+ 新增資料點</button>
            <span className="pointCount">{rows.filter((r) => r.x && r.y && !isNaN(r.x) && !isNaN(r.y)).length} 個有效點</span>
          </div>

          {error && <p className="errMsg">{error}</p>}

          <button
            type="button"
            className="runBtn"
            onClick={runRegression}
            disabled={loading}
          >
            {loading ? '計算中…' : '▶ 執行線性迴歸'}
          </button>
        </div>

        {/* ── Right: result ── */}
        <div className="lrResult">
          {!result && !loading && (
            <div className="placeholder">
              <div className="placeholderIcon">📈</div>
              <p>點擊「執行線性迴歸」後，圖表與統計數據將顯示在這裡。</p>
            </div>
          )}

          {loading && (
            <div className="placeholder">
              <div className="spinner" />
              <p>Python 運算中…</p>
            </div>
          )}

          {result && chart && (
            <>
              <div className="statsRow">
                <div className="statCard accent">
                  <span className="statLabel">迴歸方程式</span>
                  <code className="statValue">ŷ = {result.slope}x {result.intercept >= 0 ? '+' : '−'} {Math.abs(result.intercept)}</code>
                </div>
                <div className="statCard">
                  <span className="statLabel">斜率 (slope)</span>
                  <strong className="statValue">{result.slope}</strong>
                </div>
                <div className="statCard">
                  <span className="statLabel">截距 (intercept)</span>
                  <strong className="statValue">{result.intercept}</strong>
                </div>
                <div className={`statCard ${result.r_squared >= 0.8 ? 'good' : result.r_squared >= 0.5 ? 'ok' : 'weak'}`}>
                  <span className="statLabel">決定係數 R²</span>
                  <strong className="statValue">{result.r_squared}</strong>
                  <span className="statHint">{result.r_squared >= 0.8 ? '擬合良好' : result.r_squared >= 0.5 ? '中等擬合' : '擬合較差'}</span>
                </div>
              </div>

              <div className="chartWrap">
                <svg viewBox={`0 0 ${chart.W} ${chart.H}`} className="regressionChart">
                  {/* grid lines */}
                  {chart.yTicks.map((tick, i) => (
                    <line
                      key={i}
                      x1={chart.PAD.left} y1={chart.toSvgY(tick)}
                      x2={chart.W - chart.PAD.right} y2={chart.toSvgY(tick)}
                      stroke="var(--grid)" strokeWidth="1"
                    />
                  ))}

                  {/* axes */}
                  <line x1={chart.PAD.left} y1={chart.PAD.top} x2={chart.PAD.left} y2={chart.H - chart.PAD.bottom} stroke="var(--axis)" strokeWidth="1.5" />
                  <line x1={chart.PAD.left} y1={chart.H - chart.PAD.bottom} x2={chart.W - chart.PAD.right} y2={chart.H - chart.PAD.bottom} stroke="var(--axis)" strokeWidth="1.5" />

                  {/* x-axis ticks + labels */}
                  {chart.xTicks.map((tick, i) => (
                    <g key={i}>
                      <line x1={chart.toSvgX(tick)} y1={chart.H - chart.PAD.bottom} x2={chart.toSvgX(tick)} y2={chart.H - chart.PAD.bottom + 5} stroke="var(--axis)" strokeWidth="1" />
                      <text x={chart.toSvgX(tick)} y={chart.H - chart.PAD.bottom + 17} textAnchor="middle" fontSize="10" fill="var(--tick)">
                        {Number.isInteger(tick) ? tick : tick.toFixed(1)}
                      </text>
                    </g>
                  ))}

                  {/* y-axis ticks + labels */}
                  {chart.yTicks.map((tick, i) => (
                    <g key={i}>
                      <line x1={chart.PAD.left - 5} y1={chart.toSvgY(tick)} x2={chart.PAD.left} y2={chart.toSvgY(tick)} stroke="var(--axis)" strokeWidth="1" />
                      <text x={chart.PAD.left - 8} y={chart.toSvgY(tick) + 4} textAnchor="end" fontSize="10" fill="var(--tick)">
                        {Number.isInteger(tick) ? tick : tick.toFixed(1)}
                      </text>
                    </g>
                  ))}

                  {/* regression line */}
                  <line
                    x1={chart.lx1} y1={chart.ly1}
                    x2={chart.lx2} y2={chart.ly2}
                    stroke="#4f63f6" strokeWidth="2.5" strokeLinecap="round"
                  />

                  {/* scatter points */}
                  {result.x_values.map((x, i) => (
                    <circle
                      key={i}
                      cx={chart.toSvgX(x)} cy={chart.toSvgY(result.y_values[i])}
                      r="5" fill="#ef4444" fillOpacity="0.75" stroke="#fff" strokeWidth="1.5"
                    />
                  ))}

                  {/* legend */}
                  <circle cx={chart.W - chart.PAD.right - 90} cy={chart.PAD.top} r="5" fill="#ef4444" fillOpacity="0.75" />
                  <text x={chart.W - chart.PAD.right - 82} y={chart.PAD.top + 4} fontSize="10" fill="var(--tick)">資料點</text>
                  <line x1={chart.W - chart.PAD.right - 45} y1={chart.PAD.top} x2={chart.W - chart.PAD.right - 25} y2={chart.PAD.top} stroke="#4f63f6" strokeWidth="2.5" />
                  <text x={chart.W - chart.PAD.right - 22} y={chart.PAD.top + 4} fontSize="10" fill="var(--tick)">迴歸線</text>
                </svg>
              </div>

              <div className="predictBox">
                <p className="predictTitle">部分預測值（前 5 筆）</p>
                <div className="predictList">
                  {result.x_values.slice(0, 5).map((x, i) => (
                    <div key={i} className="predictItem">
                      <span>x = <b>{x}</b></span>
                      <span>實際 y = <b>{result.y_values[i]}</b></span>
                      <span>預測 ŷ = <b>{result.predictions[i]}</b></span>
                      <span className={Math.abs(result.predictions[i] - result.y_values[i]) < Math.abs(result.y_values[i]) * 0.1 ? 'close' : ''}>
                        誤差 {(result.predictions[i] - result.y_values[i]).toFixed(2)}
                      </span>
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
          border: 1px solid var(--line);
          border-radius: 12px;
          background: var(--surface);
          padding: 24px;
          box-shadow: 0 8px 24px var(--shadow);
          margin-top: 24px;
        }
        .lrHeader h3 { margin: 0 0 4px; font-size: 1.1rem; }
        .lrHeader p { margin: 0 0 20px; color: var(--muted); font-size: 0.86rem; }

        .lrBody {
          display: grid;
          grid-template-columns: 320px minmax(0, 1fr);
          gap: 24px;
          align-items: start;
        }

        /* ── Input panel ── */
        .presetRow { margin-bottom: 12px; }
        .presetRow label { display: block; font-size: 0.8rem; color: var(--muted); margin-bottom: 6px; }
        .presetBtns { display: flex; flex-wrap: wrap; gap: 6px; }
        .presetBtns button {
          border: 1px solid var(--line);
          border-radius: 6px;
          background: var(--surface-soft);
          color: var(--muted-strong);
          padding: 4px 10px;
          font: inherit;
          font-size: 0.78rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .presetBtns button.active {
          border-color: var(--accent);
          background: var(--accent);
          color: #fff;
        }

        .tableWrap {
          max-height: 260px;
          overflow-y: auto;
          border: 1px solid var(--line);
          border-radius: 8px;
          margin-bottom: 8px;
        }
        table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        thead th {
          position: sticky; top: 0;
          background: var(--surface-soft);
          padding: 7px 8px;
          text-align: left;
          color: var(--muted);
          font-weight: 600;
          font-size: 0.78rem;
          border-bottom: 1px solid var(--line);
        }
        tbody tr:not(:last-child) td { border-bottom: 1px solid var(--line-soft); }
        td { padding: 4px 6px; }
        .rowNum { color: var(--muted); font-size: 0.78rem; text-align: center; width: 28px; }
        input[type="number"] {
          width: 100%;
          border: 1px solid var(--line);
          border-radius: 5px;
          padding: 5px 8px;
          background: var(--surface);
          color: var(--text);
          font: inherit;
          font-size: 0.85rem;
        }
        input[type="number"]:focus { outline: none; border-color: var(--accent); }
        .removeBtn {
          border: 0; background: transparent; color: var(--muted);
          cursor: pointer; font-size: 1rem; padding: 2px 6px;
          border-radius: 4px; line-height: 1;
        }
        .removeBtn:hover { background: #fee2e2; color: #dc2626; }

        .tableActions {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 10px;
        }
        .addBtn {
          border: 1px dashed var(--line); border-radius: 6px;
          background: transparent; color: var(--accent);
          padding: 6px 12px; font: inherit; font-size: 0.82rem;
          cursor: pointer;
        }
        .addBtn:hover { background: var(--surface-soft); }
        .pointCount { font-size: 0.78rem; color: var(--muted); }

        .errMsg {
          margin: 0 0 8px;
          font-size: 0.82rem;
          color: #dc2626;
          background: #fee2e2;
          border: 1px solid #fca5a5;
          border-radius: 6px;
          padding: 8px 10px;
        }

        .runBtn {
          width: 100%;
          border: 0; border-radius: 8px;
          background: var(--accent); color: #fff;
          padding: 13px; font: inherit; font-weight: 800;
          cursor: pointer; font-size: 0.95rem;
          transition: opacity 0.15s;
        }
        .runBtn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Result panel ── */
        .placeholder {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 12px; padding: 48px 24px;
          border: 2px dashed var(--line); border-radius: 10px;
          color: var(--muted); text-align: center;
        }
        .placeholderIcon { font-size: 2.4rem; }
        .placeholder p { margin: 0; font-size: 0.88rem; }
        .spinner {
          width: 36px; height: 36px;
          border: 3px solid var(--line); border-top-color: var(--accent);
          border-radius: 50%; animation: spin 0.9s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .statsRow {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 14px;
        }
        .statCard {
          border: 1px solid var(--line); border-radius: 8px;
          background: var(--surface-soft); padding: 10px 12px;
        }
        .statCard.accent { grid-column: 1 / -1; border-color: var(--accent); background: var(--surface); }
        .statCard.good { border-color: #86efac; background: #f0fdf4; }
        .statCard.ok { border-color: #fde68a; background: #fffbeb; }
        .statCard.weak { border-color: #fca5a5; background: #fff1f2; }
        .statLabel { display: block; font-size: 0.72rem; color: var(--muted); margin-bottom: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
        .statValue { display: block; font-size: 0.95rem; color: var(--text); font-family: 'Consolas', monospace; }
        .statHint { font-size: 0.72rem; color: var(--muted); }
        .statCard.good .statHint { color: #16a34a; }
        .statCard.ok .statHint { color: #b45309; }
        .statCard.weak .statHint { color: #dc2626; }

        .chartWrap {
          border: 1px solid var(--line); border-radius: 8px;
          background: var(--surface-soft); overflow: hidden;
          margin-bottom: 14px;
        }
        .regressionChart {
          width: 100%; display: block;
          --grid: var(--line-soft);
          --axis: var(--line);
          --tick: var(--muted);
        }

        .predictTitle { margin: 0 0 8px; font-size: 0.8rem; font-weight: 700; color: var(--muted); }
        .predictList { display: flex; flex-direction: column; gap: 5px; }
        .predictItem {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 6px; font-size: 0.78rem;
          border: 1px solid var(--line-soft); border-radius: 6px;
          background: var(--surface-soft); padding: 7px 10px;
          color: var(--muted);
        }
        .predictItem b { color: var(--text); }
        .predictItem .close { color: #16a34a; }

        @media (max-width: 900px) {
          .lrBody { grid-template-columns: 1fr; }
          .statsRow { grid-template-columns: 1fr; }
          .statCard.accent { grid-column: 1; }
        }
      `}</style>
    </section>
  );
}
