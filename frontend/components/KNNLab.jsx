import { useState, useMemo } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const C0 = '#ef4444';
const C1 = '#3b82f6';
const GRID_N = 26; // decision region grid resolution

function SliderRow({ label, sub, value, min, max, step, onChange, color, disabled }) {
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
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ accentColor: color }}
      />
      <span className="paramVal" style={{ color }}>{value}</span>
      <style jsx>{`
        .paramRow { display: grid; grid-template-columns: 130px 1fr 52px; gap: 10px; align-items: center; }
        .paramMeta { display: flex; flex-direction: column; }
        .paramLabel { font-size: 0.88rem; font-weight: 700; color: var(--text); }
        .paramSub { font-size: 0.72rem; color: var(--muted); margin-top: 1px; }
        .paramSlider { width: 100%; cursor: pointer; height: 4px; min-width: 0; }
        .paramSlider:disabled { opacity: 0.4; cursor: not-allowed; }
        .paramVal { font-size: 0.92rem; font-weight: 800; text-align: right; font-family: 'Consolas', monospace; white-space: nowrap; }
      `}</style>
    </div>
  );
}

function buildChart(points) {
  const PAD = { top: 24, right: 24, bottom: 48, left: 48 };
  const W = 420, H = 420;
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const allX = points.map((p) => p.x);
  const allY = points.map((p) => p.y);
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
    W, H, PAD, xMin, xMax, yMin, yMax, cW, cH,
  };
}

// Runs KNN in JS — 200 training pts × GRID_N² cells ≈ 135k ops, < 5ms
function buildDecisionGrid(trainData, k, chart) {
  const { xMin, xMax, yMin, yMax, PAD, cW, cH } = chart;
  const xStep = (xMax - xMin) / GRID_N;
  const yStep = (yMax - yMin) / GRID_N;
  const cellW = cW / GRID_N;
  const cellH = cH / GRID_N;

  const cells = [];
  for (let i = 0; i < GRID_N; i++) {
    for (let j = 0; j < GRID_N; j++) {
      const cx = xMin + (i + 0.5) * xStep;
      const cy = yMax - (j + 0.5) * yStep; // j=0 → top → high y
      let v0 = 0, v1 = 0;
      // inline sort-free knn for speed: collect k smallest by partial scan
      const heap = [];
      for (let n = 0; n < trainData.length; n++) {
        const p = trainData[n];
        const d2 = (p.x - cx) ** 2 + (p.y - cy) ** 2;
        heap.push({ d2, label: p.label });
      }
      heap.sort((a, b) => a.d2 - b.d2);
      for (let n = 0; n < k; n++) heap[n].label === 0 ? v0++ : v1++;
      cells.push({ x: PAD.left + i * cellW, y: PAD.top + j * cellH, w: cellW, h: cellH, label: v1 >= v0 ? 1 : 0 });
    }
  }
  return cells;
}

export default function KNNLab() {
  const [trainData, setTrainData] = useState(null);
  const [k, setK] = useState(5);
  const [testX, setTestX] = useState(0.0);
  const [testY, setTestY] = useState(0.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function fetchData() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/simulate-knn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || '執行失敗'); }
      const data = await res.json();
      setTrainData(data.points);
    } catch (e) {
      setError(e.message || '無法連線到後端');
    } finally {
      setLoading(false);
    }
  }

  const chart = useMemo(() => (trainData ? buildChart(trainData) : null), [trainData]);

  const decisionGrid = useMemo(
    () => (trainData && chart ? buildDecisionGrid(trainData, k, chart) : []),
    [trainData, k, chart],
  );

  const neighborInfo = useMemo(() => {
    if (!trainData) return null;
    const withDist = trainData.map((p, idx) => ({
      idx, label: p.label,
      d: Math.sqrt((p.x - testX) ** 2 + (p.y - testY) ** 2),
    }));
    withDist.sort((a, b) => a.d - b.d);
    const neighbors = withDist.slice(0, k);
    const v0 = neighbors.filter((n) => n.label === 0).length;
    const v1 = neighbors.filter((n) => n.label === 1).length;
    return { neighbors, v0, v1, predicted: v1 >= v0 ? 1 : 0, kthDist: neighbors[k - 1]?.d ?? 0 };
  }, [trainData, k, testX, testY]);

  const neighborSet = useMemo(
    () => new Set(neighborInfo?.neighbors.map((n) => n.idx) ?? []),
    [neighborInfo],
  );

  const predictedColor = neighborInfo ? (neighborInfo.predicted === 1 ? C1 : C0) : '#94a3b8';

  return (
    <section className="knnLab">
      <div className="knnHeader">
        <h3>K 最近鄰模擬實驗室</h3>
        <p>
          拖曳 <b>測試點（橘圓）</b> 的位置，觀察 K 個最近鄰（連線點）如何決定預測類別。
          背景色塊顯示整張特徵空間的分類區域，K 越大邊界越平滑。
        </p>
      </div>

      <div className="knnBody">
        {/* ── Left panel ── */}
        <div className="paramPanel">
          <div className="formulaBox">
            <span className="formulaTitle">決策規則</span>
            <code>ŷ = majority(y&#x2081;, …, y&#x1D44F;)</code>
            <span className="formulaHint">取距離最近的 K 個訓練樣本，以多數投票決定類別</span>
          </div>

          <div className="sliderStack">
            <SliderRow
              label="鄰居數 K"
              sub="K 越大，邊界越平滑"
              value={k} min={1} max={15} step={1}
              onChange={setK} color="#f97316"
              disabled={!trainData}
            />
            <SliderRow
              label="測試點 X"
              sub="特徵 1 的位置"
              value={testX} min={-3.0} max={3.0} step={0.1}
              onChange={setTestX} color="#8b5cf6"
              disabled={!trainData}
            />
            <SliderRow
              label="測試點 Y"
              sub="特徵 2 的位置"
              value={testY} min={-3.0} max={3.0} step={0.1}
              onChange={setTestY} color="#8b5cf6"
              disabled={!trainData}
            />
          </div>

          {error && <p className="errMsg">{error}</p>}

          <button type="button" className="runBtn" onClick={fetchData} disabled={loading}>
            {loading ? '載入中…' : trainData ? '↺ 重新載入' : '▶ 載入訓練資料'}
          </button>

          {neighborInfo && (
            <div className="statsPanel">
              <div className="statItem full predBox" style={{ borderColor: predictedColor }}>
                <span>預測類別</span>
                <strong style={{ color: predictedColor, fontSize: '1.3rem' }}>
                  類別 {neighborInfo.predicted}
                </strong>
                <small>{neighborInfo.v1} 票類別 1 vs {neighborInfo.v0} 票類別 0</small>
              </div>
              <div className="statItem">
                <span>鄰居數 K</span>
                <strong style={{ color: '#f97316' }}>{k}</strong>
                <small>掃描 200 個訓練點</small>
              </div>
              <div className="statItem">
                <span>第 K 近距離</span>
                <strong>{neighborInfo.kthDist.toFixed(3)}</strong>
                <small>搜尋半徑</small>
              </div>
              <div className="statItem">
                <span>類別 1 鄰居</span>
                <strong style={{ color: C1 }}>{neighborInfo.v1}</strong>
              </div>
              <div className="statItem">
                <span>類別 0 鄰居</span>
                <strong style={{ color: C0 }}>{neighborInfo.v0}</strong>
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel: chart ── */}
        <div className="chartPanel">
          {!trainData && !loading && (
            <div className="placeholder">
              <div className="placeholderIcon">🔍</div>
              <p>按左側「載入訓練資料」，散佈圖與分類區域將顯示在這裡。</p>
            </div>
          )}
          {loading && (
            <div className="placeholder">
              <div className="spinner" />
              <p>Python 生成資料中…</p>
            </div>
          )}

          {trainData && chart && (
            <>
              <div className="chartLegend">
                <span><i className="dot" style={{ background: C1 }} />類別 1</span>
                <span><i className="dot" style={{ background: C0 }} />類別 0</span>
                <span><i className="dot ring" style={{ borderColor: '#f97316' }} />K 個近鄰</span>
                <span><i className="dot testDot" />測試點</span>
              </div>

              <div className="svgWrap">
                <svg viewBox={`0 0 ${chart.W} ${chart.H}`} className="simChart">

                  {/* ── Decision region background ── */}
                  {decisionGrid.map((cell, i) => (
                    <rect key={i}
                      x={cell.x} y={cell.y} width={cell.w} height={cell.h}
                      fill={cell.label === 1 ? C1 : C0}
                      fillOpacity="0.1"
                    />
                  ))}

                  {/* ── Grid lines ── */}
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

                  {/* ── Axes ── */}
                  <line x1={chart.PAD.left} y1={chart.PAD.top} x2={chart.PAD.left} y2={chart.H - chart.PAD.bottom} stroke="var(--axis)" strokeWidth="1.5" />
                  <line x1={chart.PAD.left} y1={chart.H - chart.PAD.bottom} x2={chart.W - chart.PAD.right} y2={chart.H - chart.PAD.bottom} stroke="var(--axis)" strokeWidth="1.5" />

                  {/* ── Tick labels ── */}
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

                  {/* ── Axis labels ── */}
                  <text x={chart.PAD.left + chart.cW / 2} y={chart.H - 6} textAnchor="middle" fontSize="11" fill="var(--tick)" fontWeight="600">特徵 1</text>
                  <text x={12} y={chart.PAD.top + chart.cH / 2} textAnchor="middle" fontSize="11" fill="var(--tick)" fontWeight="600" transform={`rotate(-90, 12, ${chart.PAD.top + chart.cH / 2})`}>特徵 2</text>

                  {/* ── Lines from test point to neighbors ── */}
                  {neighborInfo?.neighbors.map((n) => {
                    const p = trainData[n.idx];
                    return (
                      <line key={n.idx}
                        x1={chart.toX(testX)} y1={chart.toY(testY)}
                        x2={chart.toX(p.x)} y2={chart.toY(p.y)}
                        stroke={n.label === 1 ? C1 : C0}
                        strokeWidth="1.2" strokeOpacity="0.55" strokeDasharray="4 3"
                      />
                    );
                  })}

                  {/* ── Training data points ── */}
                  {trainData.map((p, i) => {
                    const isNeighbor = neighborSet.has(i);
                    const color = p.label === 1 ? C1 : C0;
                    const cx = chart.toX(p.x);
                    const cy = chart.toY(p.y);
                    if (isNeighbor) {
                      return (
                        <g key={i}>
                          <circle cx={cx} cy={cy} r="9" fill={color} fillOpacity="0.15" />
                          <circle cx={cx} cy={cy} r="5.5" fill={color} fillOpacity="0.85" stroke="#fff" strokeWidth="1.5" />
                        </g>
                      );
                    }
                    return <circle key={i} cx={cx} cy={cy} r="3.5" fill={color} fillOpacity="0.55" />;
                  })}

                  {/* ── Test point ── */}
                  {(() => {
                    const cx = chart.toX(testX);
                    const cy = chart.toY(testY);
                    return (
                      <g>
                        <circle cx={cx} cy={cy} r="20" fill="#f97316" fillOpacity="0.12" />
                        <circle cx={cx} cy={cy} r="10" fill="#f97316" stroke="#fff" strokeWidth="2.5" />
                        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="900" fill="#fff">?</text>
                      </g>
                    );
                  })()}

                </svg>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .knnLab {
          border: 1px solid var(--line); border-radius: 12px;
          background: var(--surface); padding: 24px;
          box-shadow: 0 8px 24px var(--shadow); margin-top: 24px;
          max-width: 860px;
        }
        .knnHeader h3 { margin: 0 0 4px; font-size: 1.1rem; }
        .knnHeader p { margin: 0; color: var(--muted); font-size: 0.86rem; line-height: 1.5; }

        .knnBody {
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
        .formulaHint { font-size: 0.72rem; color: var(--muted); line-height: 1.45; }

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
        .statItem.predBox { border-width: 2px; }
        .statItem span { font-size: 0.72rem; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
        .statItem strong { font-size: 1rem; font-family: 'Consolas', monospace; color: var(--text); }
        .statItem small { font-size: 0.7rem; color: var(--muted); margin-top: 2px; }

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
        .dot.ring { background: transparent; border: 2.5px solid; width: 12px; height: 12px; }
        .dot.testDot { background: #f97316; width: 14px; height: 14px; border: 2px solid #fff; box-shadow: 0 0 0 2px rgba(249,115,22,0.4); }

        .svgWrap {
          border: 1px solid var(--line); border-radius: 8px;
          background: var(--surface-soft); overflow: hidden;
        }
        .simChart {
          width: 100%; display: block;
          --grid: var(--line-soft); --axis: var(--line); --tick: var(--muted);
        }

        @media (max-width: 960px) {
          .knnBody { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
