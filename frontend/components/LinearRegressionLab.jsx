import { useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const PRESETS = {
  house: {
    label: '房價 vs 面積',
    xLabel: '面積（坪）', yLabel: '房價（萬）',
    xMin: 10, xMax: 80, xStep: 1,
    yMin: 200, yMax: 2000, yStep: 10,
    points: [[20,480],[25,580],[30,700],[35,780],[40,900],[45,1050],[50,1150],[55,1280],[60,1400],[28,640]],
  },
  study: {
    label: '讀書 vs 成績',
    xLabel: '讀書時數（小時）', yLabel: '考試成績（分）',
    xMin: 0, xMax: 15, xStep: 0.5,
    yMin: 0, yMax: 100, yStep: 1,
    points: [[1,45],[2,55],[3,60],[4,65],[5,72],[6,78],[7,82],[8,88],[9,91],[10,95]],
  },
  temp: {
    label: '氣溫 vs 冰淇淋',
    xLabel: '氣溫（°C）', yLabel: '冰淇淋銷量（份）',
    xMin: 5, xMax: 45, xStep: 1,
    yMin: 0, yMax: 300, yStep: 5,
    points: [[15,30],[18,45],[22,70],[25,95],[28,130],[30,160],[32,190],[35,220],[20,58],[26,110]],
  },
  custom: {
    label: '自訂',
    xLabel: 'X 值', yLabel: 'Y 值',
    xMin: 0, xMax: 100, xStep: 1,
    yMin: 0, yMax: 100, yStep: 1,
    points: [[20,35],[40,55],[60,70],[80,90]],
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
  const mg = 0.08;

  function toSvgX(x) { return PAD.left + ((x - xMin) / xRange) * chartW * (1 - mg) + chartW * mg * 0.5; }
  function toSvgY(y) { return PAD.top + chartH - ((y - yMin) / yRange) * chartH * (1 - mg) - chartH * mg * 0.5; }

  const ticks = 5;
  const xTicks = Array.from({ length: ticks }, (_, i) => xMin + (xRange / (ticks - 1)) * i);
  const yTicks = Array.from({ length: ticks }, (_, i) => yMin + (yRange / (ticks - 1)) * i);

  return {
    toSvgX, toSvgY, xTicks, yTicks,
    lx1: toSvgX(lineX[0]), ly1: toSvgY(lineY[0]),
    lx2: toSvgX(lineX[1]), ly2: toSvgY(lineY[1]),
    W, H, PAD,
  };
}

export default function LinearRegressionLab() {
  const [presetKey, setPresetKey] = useState('house');
  const cfg = PRESETS[presetKey];

  const [rows, setRows] = useState(() =>
    PRESETS.house.points.map(([x, y]) => ({ x, y }))
  );
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handlePreset(key) {
    setPresetKey(key);
    setRows(PRESETS[key].points.map(([x, y]) => ({ x, y })));
    setResult(null);
    setError('');
  }

  function updateRow(index, field, value) {
    setRows((prev) => prev.map((r, i) => i === index ? { ...r, [field]: Number(value) } : r));
  }

  function addRow() {
    const midX = Math.round((cfg.xMin + cfg.xMax) / 2);
    const midY = Math.round((cfg.yMin + cfg.yMax) / 2);
    setRows((prev) => [...prev, { x: midX, y: midY }]);
  }

  function removeRow(index) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function runRegression() {
    setError('');
    if (rows.length < 2) { setError('至少需要 2 個資料點'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/run-linear-regression`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x_values: rows.map((r) => r.x), y_values: rows.map((r) => r.y) }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || '執行失敗'); }
      setResult(await res.json());
    } catch (e) {
      setError(e.message || '無法連線到後端');
    } finally {
      setLoading(false);
    }
  }

  const chart = result ? buildChart(result.x_values, result.y_values, result.line_x, result.line_y) : null;

  return (
    <section className="lrLab">
      <div className="lrHeader">
        <h3>線性迴歸實驗室</h3>
        <p>拖曳滑桿調整每個資料點的 X / Y 值，按下「送出計算」後 Python 即時運算結果。</p>
      </div>

      {/* preset tabs */}
      <div className="presetTabs">
        {Object.entries(PRESETS).map(([key, p]) => (
          <button key={key} type="button" className={presetKey === key ? 'active' : ''} onClick={() => handlePreset(key)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="lrBody">
        {/* ── Left: sliders ── */}
        <div className="sliderPanel">
          <div className="axisLabels">
            <span>X 軸：{cfg.xLabel}</span>
            <span>Y 軸：{cfg.yLabel}</span>
          </div>

          <div className="sliderList">
            {rows.map((row, i) => (
              <div key={i} className="sliderRow">
                <span className="rowIdx">{i + 1}</span>

                <div className="sliderGroup">
                  <span className="axisTag x">X</span>
                  <input
                    type="range"
                    min={cfg.xMin} max={cfg.xMax} step={cfg.xStep}
                    value={row.x}
                    onChange={(e) => updateRow(i, 'x', e.target.value)}
                    className="slider sliderX"
                  />
                  <span className="sliderVal">{row.x}</span>
                </div>

                <div className="sliderGroup">
                  <span className="axisTag y">Y</span>
                  <input
                    type="range"
                    min={cfg.yMin} max={cfg.yMax} step={cfg.yStep}
                    value={row.y}
                    onChange={(e) => updateRow(i, 'y', e.target.value)}
                    className="slider sliderY"
                  />
                  <span className="sliderVal">{row.y}</span>
                </div>

                <button type="button" className="removeBtn" onClick={() => removeRow(i)} aria-label="刪除">×</button>
              </div>
            ))}
          </div>

          <div className="bottomActions">
            <button type="button" className="addBtn" onClick={addRow}>+ 新增資料點</button>
            <span className="pointCount">{rows.length} 個點</span>
          </div>

          {error && <p className="errMsg">{error}</p>}

          <button type="button" className="runBtn" onClick={runRegression} disabled={loading}>
            {loading ? '計算中…' : '送出計算'}
          </button>
        </div>

        {/* ── Right: result ── */}
        <div className="lrResult">
          {!result && !loading && (
            <div className="placeholder">
              <div className="placeholderIcon">📈</div>
              <p>調整左側滑桿後按「送出計算」，圖表與統計數據會顯示在這裡。</p>
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
                  <span className="statLabel">斜率 slope</span>
                  <strong className="statValue">{result.slope}</strong>
                </div>
                <div className="statCard">
                  <span className="statLabel">截距 intercept</span>
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
                  {[0,1,2,3,4].map((i) => {
                    const tick = Math.min(...result.y_values.concat(result.line_y)) + (Math.max(...result.y_values.concat(result.line_y)) - Math.min(...result.y_values.concat(result.line_y))) / 4 * i;
                    return <line key={i} x1={chart.PAD.left} y1={chart.toSvgY(tick)} x2={chart.W - chart.PAD.right} y2={chart.toSvgY(tick)} stroke="var(--grid)" strokeWidth="1" />;
                  })}
                  <line x1={chart.PAD.left} y1={chart.PAD.top} x2={chart.PAD.left} y2={chart.H - chart.PAD.bottom} stroke="var(--axis)" strokeWidth="1.5" />
                  <line x1={chart.PAD.left} y1={chart.H - chart.PAD.bottom} x2={chart.W - chart.PAD.right} y2={chart.H - chart.PAD.bottom} stroke="var(--axis)" strokeWidth="1.5" />
                  {chart.xTicks.map((tick, i) => (
                    <g key={i}>
                      <line x1={chart.toSvgX(tick)} y1={chart.H - chart.PAD.bottom} x2={chart.toSvgX(tick)} y2={chart.H - chart.PAD.bottom + 5} stroke="var(--axis)" strokeWidth="1" />
                      <text x={chart.toSvgX(tick)} y={chart.H - chart.PAD.bottom + 17} textAnchor="middle" fontSize="10" fill="var(--tick)">
                        {Number.isInteger(tick) ? tick : tick.toFixed(1)}
                      </text>
                    </g>
                  ))}
                  {chart.yTicks.map((tick, i) => (
                    <g key={i}>
                      <line x1={chart.PAD.left - 5} y1={chart.toSvgY(tick)} x2={chart.PAD.left} y2={chart.toSvgY(tick)} stroke="var(--axis)" strokeWidth="1" />
                      <text x={chart.PAD.left - 8} y={chart.toSvgY(tick) + 4} textAnchor="end" fontSize="10" fill="var(--tick)">
                        {Number.isInteger(tick) ? tick : tick.toFixed(1)}
                      </text>
                    </g>
                  ))}
                  <line x1={chart.lx1} y1={chart.ly1} x2={chart.lx2} y2={chart.ly2} stroke="#4f63f6" strokeWidth="2.5" strokeLinecap="round" />
                  {result.x_values.map((x, i) => (
                    <circle key={i} cx={chart.toSvgX(x)} cy={chart.toSvgY(result.y_values[i])} r="5" fill="#ef4444" fillOpacity="0.75" stroke="#fff" strokeWidth="1.5" />
                  ))}
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
                      <span className={Math.abs(result.predictions[i] - result.y_values[i]) < Math.abs(result.y_values[i]) * 0.15 ? 'close' : ''}>
                        誤差 {(result.predictions[i] - result.y_values[i]).toFixed(1)}
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
        .lrHeader p { margin: 0 0 16px; color: var(--muted); font-size: 0.86rem; }

        .presetTabs {
          display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .presetTabs button {
          border: 1px solid var(--line); border-radius: 20px;
          background: var(--surface-soft); color: var(--muted-strong);
          padding: 5px 14px; font: inherit; font-size: 0.82rem; cursor: pointer;
          transition: all 0.15s;
        }
        .presetTabs button.active {
          border-color: var(--accent); background: var(--accent); color: #fff;
        }

        .lrBody {
          display: grid;
          grid-template-columns: 360px minmax(0, 1fr);
          gap: 24px;
          align-items: start;
        }

        /* ── Slider panel ── */
        .axisLabels {
          display: flex; justify-content: space-between;
          margin-bottom: 10px; font-size: 0.78rem; color: var(--muted);
        }

        .sliderList {
          display: flex; flex-direction: column; gap: 4px;
          max-height: 340px; overflow-y: auto;
          padding-right: 4px;
        }
        .sliderRow {
          display: grid;
          grid-template-columns: 22px 1fr 1fr 26px;
          gap: 6px;
          align-items: center;
          padding: 8px 10px;
          border: 1px solid var(--line-soft);
          border-radius: 8px;
          background: var(--surface-soft);
        }
        .rowIdx {
          font-size: 0.72rem; color: var(--muted); text-align: center; font-weight: 700;
        }
        .sliderGroup {
          display: flex; align-items: center; gap: 6px;
        }
        .axisTag {
          font-size: 0.7rem; font-weight: 800; border-radius: 4px;
          padding: 2px 5px; flex-shrink: 0;
        }
        .axisTag.x { background: #dbeafe; color: #1d4ed8; }
        .axisTag.y { background: #fce7f3; color: #9d174d; }
        .slider {
          flex: 1; min-width: 0;
          height: 4px; border-radius: 2px; cursor: pointer;
          -webkit-appearance: none; appearance: none;
          background: var(--line);
          accent-color: var(--accent);
        }
        .sliderX { accent-color: #3b82f6; }
        .sliderY { accent-color: #ec4899; }
        .sliderVal {
          font-size: 0.78rem; font-weight: 700; color: var(--text);
          min-width: 36px; text-align: right; flex-shrink: 0;
        }
        .removeBtn {
          border: 0; background: transparent; color: var(--muted);
          cursor: pointer; font-size: 1rem; padding: 0; line-height: 1;
          border-radius: 4px; text-align: center;
        }
        .removeBtn:hover { background: #fee2e2; color: #dc2626; }

        .bottomActions {
          display: flex; align-items: center; justify-content: space-between;
          margin: 10px 0 8px;
        }
        .addBtn {
          border: 1px dashed var(--line); border-radius: 6px;
          background: transparent; color: var(--accent);
          padding: 6px 12px; font: inherit; font-size: 0.82rem; cursor: pointer;
        }
        .addBtn:hover { background: var(--surface-soft); }
        .pointCount { font-size: 0.78rem; color: var(--muted); }

        .errMsg {
          margin: 0 0 8px; font-size: 0.82rem; color: #dc2626;
          background: #fee2e2; border: 1px solid #fca5a5;
          border-radius: 6px; padding: 8px 10px;
        }
        .runBtn {
          width: 100%; border: 0; border-radius: 8px;
          background: var(--accent); color: #fff;
          padding: 13px; font: inherit; font-weight: 800;
          cursor: pointer; font-size: 0.95rem; transition: opacity 0.15s;
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
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;
        }
        .statCard {
          border: 1px solid var(--line); border-radius: 8px;
          background: var(--surface-soft); padding: 10px 12px;
        }
        .statCard.accent { grid-column: 1 / -1; border-color: var(--accent); background: var(--surface); }
        .statCard.good { border-color: #86efac; background: #f0fdf4; }
        .statCard.ok   { border-color: #fde68a; background: #fffbeb; }
        .statCard.weak { border-color: #fca5a5; background: #fff1f2; }
        .statLabel { display: block; font-size: 0.72rem; color: var(--muted); margin-bottom: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
        .statValue { display: block; font-size: 0.95rem; color: var(--text); font-family: 'Consolas', monospace; }
        .statHint { font-size: 0.72rem; color: var(--muted); }
        .statCard.good .statHint { color: #16a34a; }
        .statCard.ok .statHint   { color: #b45309; }
        .statCard.weak .statHint { color: #dc2626; }

        .chartWrap {
          border: 1px solid var(--line); border-radius: 8px;
          background: var(--surface-soft); overflow: hidden; margin-bottom: 14px;
        }
        .regressionChart {
          width: 100%; display: block;
          --grid: var(--line-soft); --axis: var(--line); --tick: var(--muted);
        }

        .predictTitle { margin: 0 0 8px; font-size: 0.8rem; font-weight: 700; color: var(--muted); }
        .predictList { display: flex; flex-direction: column; gap: 5px; }
        .predictItem {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 6px; font-size: 0.78rem;
          border: 1px solid var(--line-soft); border-radius: 6px;
          background: var(--surface-soft); padding: 7px 10px; color: var(--muted);
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
