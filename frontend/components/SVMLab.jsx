import { useState, useEffect, useMemo, useCallback } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const W = 480, H = 380, PAD = 36;

function toSVG(v, min, max, px0, px1) {
  return px0 + ((v - min) / (max - min)) * (px1 - px0);
}

function buildChart(points) {
  if (!points?.length) return null;
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const xMin = Math.min(...xs) - 0.5, xMax = Math.max(...xs) + 0.5;
  const yMin = Math.min(...ys) - 0.5, yMax = Math.max(...ys) + 0.5;
  return {
    xMin, xMax, yMin, yMax,
    px0: PAD, px1: W - PAD, py0: H - PAD, py1: PAD,
    sx: v => toSVG(v, xMin, xMax, PAD, W - PAD),
    sy: v => toSVG(v, yMin, yMax, H - PAD, PAD),
  };
}

export default function SVMLab() {
  const [C, setC] = useState(1.0);
  const [pendingC, setPendingC] = useState(1.0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSVM = useCallback(async (cVal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/simulate-svm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ C: cVal }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSVM(1.0); }, [fetchSVM]);

  const chart = useMemo(() => result ? buildChart(result.points) : null, [result]);

  const boundary = useMemo(() => {
    if (!chart || !result) return null;
    const { coef, intercept } = result;
    const [w1, w2] = coef;
    const b = intercept;
    const norm = Math.sqrt(w1 * w1 + w2 * w2);
    const lineY = x => -(w1 * x + b) / w2;
    const marginY = (x, sign) => lineY(x) + sign * (1 / w2) * (1 / norm) * 1;

    const x0 = chart.xMin, x1 = chart.xMax;
    return {
      main: [
        { x: chart.sx(x0), y: chart.sy(lineY(x0)) },
        { x: chart.sx(x1), y: chart.sy(lineY(x1)) },
      ],
      upper: [
        { x: chart.sx(x0), y: chart.sy(marginY(x0, 1)) },
        { x: chart.sx(x1), y: chart.sy(marginY(x1, 1)) },
      ],
      lower: [
        { x: chart.sx(x0), y: chart.sy(marginY(x0, -1)) },
        { x: chart.sx(x1), y: chart.sy(marginY(x1, -1)) },
      ],
    };
  }, [chart, result]);

  const svSet = useMemo(() => {
    if (!result?.support_vectors) return new Set();
    return new Set(result.support_vectors.map(sv => `${sv.x.toFixed(2)},${sv.y.toFixed(2)}`));
  }, [result]);

  const handleCCommit = () => {
    setC(pendingC);
    fetchSVM(pendingC);
  };

  const C_STEPS = [0.01, 0.1, 0.5, 1, 2, 5, 10, 50, 100];

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <h3 className="text-white font-semibold mb-1">支援向量機 (SVM) 實驗室</h3>
        <p className="text-gray-400 text-sm">調整正則化參數 C，觀察決策邊界與邊距的變化。</p>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm font-medium">正則化參數 C</span>
            <span className="text-amber-400 font-mono text-sm">{pendingC}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {C_STEPS.map(v => (
              <button
                key={v}
                onClick={() => setPendingC(v)}
                className={`px-3 py-1 rounded text-xs font-mono border transition-colors ${
                  pendingC === v
                    ? 'bg-amber-500 border-amber-400 text-black'
                    : 'border-gray-600 text-gray-300 hover:border-amber-500'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={handleCCommit}
            disabled={loading || pendingC === C}
            className="self-start px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium disabled:opacity-40 transition-colors"
          >
            {loading ? '計算中…' : '套用'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
          載入失敗：{error}
        </div>
      )}

      {/* Visualization + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-4">
          {loading && (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">計算中…</div>
          )}
          {!loading && chart && boundary && (
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
              {/* Margin band fill */}
              <polygon
                points={[
                  ...boundary.upper.map(p => `${p.x},${p.y}`),
                  ...boundary.lower.slice().reverse().map(p => `${p.x},${p.y}`),
                ].join(' ')}
                fill="#f59e0b"
                fillOpacity={0.08}
              />
              {/* Margin lines */}
              <line
                x1={boundary.upper[0].x} y1={boundary.upper[0].y}
                x2={boundary.upper[1].x} y2={boundary.upper[1].y}
                stroke="#f59e0b" strokeWidth={1} strokeDasharray="4 3" opacity={0.6}
              />
              <line
                x1={boundary.lower[0].x} y1={boundary.lower[0].y}
                x2={boundary.lower[1].x} y2={boundary.lower[1].y}
                stroke="#f59e0b" strokeWidth={1} strokeDasharray="4 3" opacity={0.6}
              />
              {/* Decision boundary */}
              <line
                x1={boundary.main[0].x} y1={boundary.main[0].y}
                x2={boundary.main[1].x} y2={boundary.main[1].y}
                stroke="#f59e0b" strokeWidth={2}
              />
              {/* Points */}
              {result.points.map((p, i) => {
                const isSV = svSet.has(`${p.x.toFixed(2)},${p.y.toFixed(2)}`);
                const cx = chart.sx(p.x), cy = chart.sy(p.y);
                const color = p.label === 0 ? '#60a5fa' : '#f87171';
                return (
                  <g key={i}>
                    {isSV && (
                      <circle cx={cx} cy={cy} r={7} fill="none" stroke={color} strokeWidth={2} opacity={0.9} />
                    )}
                    <circle cx={cx} cy={cy} r={isSV ? 3.5 : 4} fill={color} opacity={isSV ? 1 : 0.7} />
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Stats panel */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-col gap-4">
          <h4 className="text-white text-sm font-semibold">模型指標</h4>
          {result && (
            <>
              <StatRow label="準確率" value={`${(result.accuracy * 100).toFixed(1)}%`} accent="text-green-400" />
              <StatRow label="邊距寬度" value={result.margin_width.toFixed(4)} accent="text-amber-400" />
              <StatRow label="支援向量數" value={result.n_support} />
              <StatRow label="C 值" value={C} />
            </>
          )}
          <div className="mt-2 p-3 bg-gray-700/50 rounded-lg text-xs text-gray-400 space-y-1">
            <p className="font-medium text-gray-300">C 值的作用</p>
            <p>C 小 → 允許更多誤分類，邊距較寬（高偏差）</p>
            <p>C 大 → 嚴格分類，邊距較窄（高變異）</p>
            <p>支援向量（帶外框的點）定義決策邊界。</p>
          </div>
          <div className="flex gap-3 text-xs mt-1">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /> 類別 0</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> 類別 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, accent = 'text-white' }) {
  return (
    <div className="flex justify-between items-center text-sm border-b border-gray-700 pb-2">
      <span className="text-gray-400">{label}</span>
      <span className={`font-mono font-semibold ${accent}`}>{value}</span>
    </div>
  );
}
